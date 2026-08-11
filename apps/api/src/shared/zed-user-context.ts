/**
 * Signed user-context header sent from the preview proxy to zed-master.
 *
 * Format: `<base64url(json payload)>.<base64url(HMAC-SHA256)>`
 *
 * Zed-master owns the same secret (the sandbox's ZED_TOKEN service key)
 * and verifies the signature locally — no callback to the Zed API per
 * request. An `exp` field bounds staleness after ACL changes.
 *
 * Keep this module pure so the sandbox-side verifier can mirror the same
 * serialization format without depending on anything platform-specific.
 */

import { createHmac, timingSafeEqual } from 'crypto';

export const ZED_USER_CONTEXT_HEADER = 'X-Zed-User-Context';

/**
 * Marks a request the API makes DIRECTLY to a sandbox daemon, server-to-server.
 *
 * It exists because the bearer token cannot express that distinction: the
 * preview proxy authenticates every request it relays — an ordinary user's
 * included — with the target sandbox's own service key, so the daemon sees the
 * same `Authorization` either way.
 *
 * The proxy therefore STRIPS this header from everything it forwards (see
 * STRIP_FORWARD_HEADERS in sandbox-proxy/routes/preview.ts), which makes its
 * presence positive proof of a direct call and impossible to forge through the
 * proxy — the same mechanism that already protects `authorization` and `cookie`.
 *
 * Only for platform→daemon control calls whose blast radius warrants it (today:
 * the destructive `base=1` branch reset). Mirrored, with the same reasoning, in
 * apps/zed-sandbox-agent-server/src/zed-user-context.ts.
 */
export const ZED_SERVICE_CALL_HEADER = 'X-Zed-Service-Call';

/** TTL for a signed context — short enough that revocations take effect quickly. */
const ZED_USER_CONTEXT_TTL_SECONDS = 60;

export interface ZedUserContext {
  userId: string;
  sandboxId: string;
  sandboxRole: 'owner' | 'admin' | 'member' | 'platform_admin';
  scopes: string[];
  iat: number;
  exp: number;
}

function base64urlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(s: string): Buffer {
  const pad = 4 - (s.length % 4);
  const padded = pad < 4 ? s + '='.repeat(pad) : s;
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function sign(payloadB64: string, secret: string): string {
  const mac = createHmac('sha256', secret).update(payloadB64).digest();
  return base64urlEncode(mac);
}

export function encodeZedUserContext(
  ctx: Omit<ZedUserContext, 'iat' | 'exp'> & { ttlSeconds?: number },
  secret: string,
): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + (ctx.ttlSeconds ?? ZED_USER_CONTEXT_TTL_SECONDS);
  const payload: ZedUserContext = {
    userId: ctx.userId,
    sandboxId: ctx.sandboxId,
    sandboxRole: ctx.sandboxRole,
    scopes: ctx.scopes ?? [],
    iat,
    exp,
  };
  const payloadB64 = base64urlEncode(Buffer.from(JSON.stringify(payload), 'utf8'));
  const sig = sign(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

export type ZedUserContextVerifyResult =
  | { ok: true; context: ZedUserContext }
  | { ok: false; reason: 'malformed' | 'bad_signature' | 'expired' | 'invalid_json' };

export function verifyZedUserContext(
  token: string | undefined | null,
  secret: string,
): ZedUserContextVerifyResult {
  if (!token || typeof token !== 'string') return { ok: false, reason: 'malformed' };
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, reason: 'malformed' };
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return { ok: false, reason: 'malformed' };

  const expectedSig = sign(payloadB64, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'bad_signature' };
  }

  let payload: ZedUserContext;
  try {
    payload = JSON.parse(base64urlDecode(payloadB64).toString('utf8')) as ZedUserContext;
  } catch {
    return { ok: false, reason: 'invalid_json' };
  }

  if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) {
    return { ok: false, reason: 'expired' };
  }

  return { ok: true, context: payload };
}
