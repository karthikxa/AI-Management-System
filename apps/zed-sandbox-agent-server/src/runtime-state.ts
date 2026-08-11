import { chmodSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * Durable daemon state must live under the runtime user's home directory.
 * Platinum replaces /run after image creation and starts the entrypoint as
 * `zed`, so image-time ownership and root-only entrypoint repairs cannot
 * make /var/run/zed reliable.
 */
export const DEFAULT_ZED_RUNTIME_STATE_DIRECTORY = '/home/zed/.local/state/zed'

export function resolveZedRuntimeStateDirectory(
  env: Record<string, string | undefined> = process.env,
): string {
  return env.ZED_RUNTIME_STATE_DIR?.trim() || DEFAULT_ZED_RUNTIME_STATE_DIRECTORY
}

export function resolveOpenCodeAuditSpoolPath(
  env: Record<string, string | undefined> = process.env,
): string {
  return (
    env.ZED_AUDIT_SPOOL_PATH?.trim() ||
    join(resolveZedRuntimeStateDirectory(env), 'opencode-audit-spool.json')
  )
}

export const OPENCODE_SESSION_PIN_PATH = join(
  resolveZedRuntimeStateDirectory(),
  'opencode-session-id',
)

export const OPENCODE_SEED_BAKED_PIN_PATH = join(
  resolveZedRuntimeStateDirectory(),
  'opencode-seed-baked-id',
)

const OPENCODE_SESSION_ID = /^[A-Za-z0-9_-]{1,128}$/

function validatedOpenCodeSessionId(value: string): string {
  if (!OPENCODE_SESSION_ID.test(value)) {
    throw new Error('refusing to persist a malformed OpenCode session id')
  }
  return value
}

function ensurePrivateRuntimeStateDirectory(path: string): void {
  const directory = dirname(path)
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  chmodSync(directory, 0o700)
}

export function writeOpenCodeSessionPin(sessionId: string): void {
  const validatedSessionId = validatedOpenCodeSessionId(sessionId)
  ensurePrivateRuntimeStateDirectory(OPENCODE_SESSION_PIN_PATH)
  writeFileSync(OPENCODE_SESSION_PIN_PATH, validatedSessionId, {
    encoding: 'utf8',
    mode: 0o600,
  })
  chmodSync(OPENCODE_SESSION_PIN_PATH, 0o600)
}

export function writeOpenCodeSeedBakedPin(sessionId: string): void {
  const validatedSessionId = validatedOpenCodeSessionId(sessionId)
  ensurePrivateRuntimeStateDirectory(OPENCODE_SEED_BAKED_PIN_PATH)
  writeFileSync(OPENCODE_SEED_BAKED_PIN_PATH, validatedSessionId, {
    encoding: 'utf8',
    mode: 0o600,
  })
  chmodSync(OPENCODE_SEED_BAKED_PIN_PATH, 0o600)
}
