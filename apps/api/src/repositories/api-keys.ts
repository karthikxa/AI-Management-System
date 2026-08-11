import { eq, and, inArray } from 'drizzle-orm';
import { zedApiKeys } from '@zed/db';
import { db } from '../shared/db';
import {
  hashSecretKey,
  candidateSecretKeyHashes,
  generateApiKeyPair,
  generateSandboxKeyPair,
  isApiKeySecretConfigured,
  isZedToken,
} from '../shared/crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

type ApiKeyType = 'user' | 'sandbox';

export interface ApiKeyValidationResult {
  isValid: boolean;
  accountId?: string;
  sandboxId?: string;
  keyId?: string;
  type?: ApiKeyType;
  error?: string;
}

export interface CreateApiKeyParams {
  sandboxId: string;
  accountId: string;
  title: string;
  description?: string;
  expiresAt?: Date;
  type?: ApiKeyType;
}

export interface CreateApiKeyResult {
  keyId: string;
  publicKey: string;
  secretKey: string; // returned ONCE at creation, never stored
  title: string;
  description: string | null;
  status: string;
  type: ApiKeyType;
  sandboxId: string;
  expiresAt: Date | null;
  createdAt: Date;
}

// ─── Throttle for last_used_at updates ───────────────────────────────────────

const THROTTLE_MS = 15 * 60 * 1000;
const lastUsedCache = new Map<string, number>();

// ─── CRUD Operations ─────────────────────────────────────────────────────────

/**
 * Create a new API key scoped to a sandbox.
 * Returns the secret key in plaintext ONCE — only the hash is stored.
 *
 * type='user'    → zed_<32> secret key (user-created, external access)
 * type='sandbox' → zed_sb_<32> secret key (auto-managed, injected into sandbox)
 */
export async function createApiKey(params: CreateApiKeyParams): Promise<CreateApiKeyResult> {
  if (!isApiKeySecretConfigured()) {
    throw new Error('API_KEY_SECRET not configured');
  }

  const keyType = params.type ?? 'user';
  const { publicKey, secretKey } = keyType === 'sandbox'
    ? generateSandboxKeyPair()
    : generateApiKeyPair();
  const secretKeyHash = hashSecretKey(secretKey);

  const [row] = await db
    .insert(zedApiKeys)
    .values({
      sandboxId: params.sandboxId,
      accountId: params.accountId,
      publicKey,
      secretKeyHash,
      title: params.title,
      description: params.description ?? null,
      type: keyType,
      expiresAt: params.expiresAt ?? null,
    })
    .returning();

  if (!row) {
    throw new Error('Failed to create API key');
  }

  return {
    keyId: row.keyId,
    publicKey: row.publicKey,
    secretKey, // plaintext — shown once
    title: row.title,
    description: row.description,
    status: row.status,
    type: row.type as ApiKeyType,
    sandboxId: row.sandboxId,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
  };
}

/**
 * List all API keys for a sandbox. Never returns secret data.
 */
export async function listApiKeys(sandboxId: string) {
  return db
    .select({
      keyId: zedApiKeys.keyId,
      publicKey: zedApiKeys.publicKey,
      title: zedApiKeys.title,
      description: zedApiKeys.description,
      type: zedApiKeys.type,
      status: zedApiKeys.status,
      sandboxId: zedApiKeys.sandboxId,
      expiresAt: zedApiKeys.expiresAt,
      lastUsedAt: zedApiKeys.lastUsedAt,
      createdAt: zedApiKeys.createdAt,
    })
    .from(zedApiKeys)
    .where(eq(zedApiKeys.sandboxId, sandboxId));
}

/**
 * Revoke an API key (soft-delete — sets status to 'revoked').
 */
export async function revokeApiKey(keyId: string, accountId: string): Promise<boolean> {
  const result = await db
    .update(zedApiKeys)
    .set({ status: 'revoked' })
    .where(
      and(
        eq(zedApiKeys.keyId, keyId),
        eq(zedApiKeys.accountId, accountId),
        eq(zedApiKeys.status, 'active'),
      ),
    )
    .returning({ keyId: zedApiKeys.keyId });

  return result.length > 0;
}

/**
 * Hard-delete an API key.
 */
export async function deleteApiKey(keyId: string, accountId: string): Promise<boolean> {
  const result = await db
    .delete(zedApiKeys)
    .where(
      and(
        eq(zedApiKeys.keyId, keyId),
        eq(zedApiKeys.accountId, accountId),
      ),
    )
    .returning({ keyId: zedApiKeys.keyId });

  return result.length > 0;
}

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Validate a Zed API key (zed_ or zed_sb_ prefix).
 * Single validation path for all key types — returns account_id, sandbox_id, and key type.
 */
export async function validateSecretKey(secretKey: string): Promise<ApiKeyValidationResult> {
  if (!isApiKeySecretConfigured()) {
    return { isValid: false, error: 'API_KEY_SECRET not configured' };
  }

  if (!isZedToken(secretKey)) {
    return { isValid: false, error: 'Invalid API key format — expected zed_ prefix' };
  }

  try {
    const secretKeyHashes = candidateSecretKeyHashes(secretKey);

    const [row] = await db
      .select({
        keyId: zedApiKeys.keyId,
        accountId: zedApiKeys.accountId,
        sandboxId: zedApiKeys.sandboxId,
        type: zedApiKeys.type,
        status: zedApiKeys.status,
        expiresAt: zedApiKeys.expiresAt,
      })
      .from(zedApiKeys)
      .where(
        and(
          inArray(zedApiKeys.secretKeyHash, secretKeyHashes),
          eq(zedApiKeys.status, 'active'),
        ),
      )
      .limit(1);

    if (!row) {
      const hasAnyKeys = await db.select({ keyId: zedApiKeys.keyId }).from(zedApiKeys).limit(1);
      console.warn(`[validateSecretKey] Token not found in DB. hash=${secretKeyHashes[0]!.slice(0, 16)}... prefix="${secretKey.slice(0, 20)}..." anyKeysInDb=${hasAnyKeys.length > 0}`);
      return { isValid: false, error: 'API key not found or invalid' };
    }

    if (row.expiresAt && row.expiresAt < new Date()) {
      return { isValid: false, error: 'API key expired' };
    }

    // Fire-and-forget: update last_used_at (throttled)
    updateLastUsedThrottled(row.keyId).catch(() => {});

    return {
      isValid: true,
      accountId: row.accountId,
      sandboxId: row.sandboxId,
      keyId: row.keyId,
      type: row.type as ApiKeyType,
    };
  } catch (err) {
    console.error('API key validation error:', err);
    return { isValid: false, error: 'Validation error' };
  }
}

// ─── Internal ────────────────────────────────────────────────────────────────

async function updateLastUsedThrottled(keyId: string): Promise<void> {
  const now = Date.now();
  const lastUpdate = lastUsedCache.get(keyId) || 0;

  if (now - lastUpdate < THROTTLE_MS) {
    return;
  }

  lastUsedCache.set(keyId, now);

  if (lastUsedCache.size > 1000) {
    const cutoff = now - THROTTLE_MS * 2;
    for (const [k, v] of lastUsedCache.entries()) {
      if (v < cutoff) {
        lastUsedCache.delete(k);
      }
    }
  }

  try {
    await db
      .update(zedApiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(zedApiKeys.keyId, keyId));
  } catch (err) {
    console.warn('Failed to update last_used_at:', err);
  }
}
