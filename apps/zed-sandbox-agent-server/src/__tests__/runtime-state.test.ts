import { describe, expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  DEFAULT_ZED_RUNTIME_STATE_DIRECTORY,
  OPENCODE_SEED_BAKED_PIN_PATH,
  OPENCODE_SESSION_PIN_PATH,
  resolveZedRuntimeStateDirectory,
  resolveOpenCodeAuditSpoolPath,
  writeOpenCodeSeedBakedPin,
  writeOpenCodeSessionPin,
} from '../runtime-state'

describe('sandbox runtime state paths', () => {
  test('keeps every default under the zed-owned home directory', () => {
    expect(DEFAULT_ZED_RUNTIME_STATE_DIRECTORY).toBe('/home/zed/.local/state/zed')
    expect(OPENCODE_SESSION_PIN_PATH).toBe(
      '/home/zed/.local/state/zed/opencode-session-id',
    )
    expect(OPENCODE_SEED_BAKED_PIN_PATH).toBe(
      '/home/zed/.local/state/zed/opencode-seed-baked-id',
    )
    expect(resolveOpenCodeAuditSpoolPath({})).toBe(
      '/home/zed/.local/state/zed/opencode-audit-spool.json',
    )
  })

  test('supports one shared state-directory override', () => {
    const env = { ZED_RUNTIME_STATE_DIR: '/tmp/zed-runtime-test' }
    expect(resolveZedRuntimeStateDirectory(env)).toBe('/tmp/zed-runtime-test')
    expect(resolveOpenCodeAuditSpoolPath(env)).toBe(
      '/tmp/zed-runtime-test/opencode-audit-spool.json',
    )
  })

  test('keeps the legacy spool-specific override authoritative', () => {
    expect(
      resolveOpenCodeAuditSpoolPath({
        ZED_RUNTIME_STATE_DIR: '/tmp/ignored',
        ZED_AUDIT_SPOOL_PATH: '/tmp/explicit-spool.json',
      }),
    ).toBe('/tmp/explicit-spool.json')
  })

  test('writes validated session state with private directory and file modes', async () => {
    const root = mkdtempSync(join(tmpdir(), 'zed-runtime-state-'))
    const priorStateDirectory = process.env.ZED_RUNTIME_STATE_DIR
    try {
      process.env.ZED_RUNTIME_STATE_DIR = root
      const fresh = await import(`../runtime-state.ts?test=${crypto.randomUUID()}`)
      fresh.writeOpenCodeSessionPin('ses_private')
      fresh.writeOpenCodeSeedBakedPin('ses_seed')
      const sessionPath = join(root, 'opencode-session-id')
      const seedPath = join(root, 'opencode-seed-baked-id')
      expect(readFileSync(sessionPath, 'utf8')).toBe('ses_private')
      expect(readFileSync(seedPath, 'utf8')).toBe('ses_seed')
      expect(statSync(root).mode & 0o777).toBe(0o700)
      expect(statSync(sessionPath).mode & 0o777).toBe(0o600)
      expect(statSync(seedPath).mode & 0o777).toBe(0o600)
    } finally {
      if (priorStateDirectory === undefined) delete process.env.ZED_RUNTIME_STATE_DIR
      else process.env.ZED_RUNTIME_STATE_DIR = priorStateDirectory
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('rejects malformed OpenCode session ids before any write', () => {
    expect(() => writeOpenCodeSessionPin('../escape')).toThrow('malformed OpenCode session id')
    expect(() => writeOpenCodeSeedBakedPin('ses_valid\ninjected')).toThrow(
      'malformed OpenCode session id',
    )
  })
})
