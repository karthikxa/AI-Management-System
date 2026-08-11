import { describe, expect, test } from 'bun:test';
import {
  SESSION_RUNTIME_CONTEXT_ENV_NAME,
  mergeSessionSandboxEnv,
  parseSessionRuntimeContext,
  serializeSessionRuntimeContext,
} from './session-runtime-context';

describe('session runtime context boundaries', () => {
  test('serializes one deterministic JSON envelope, never per-key env vars', () => {
    const context = { workspace_id: 'org_123', locale: 'de', licensed: true };
    const serialized = serializeSessionRuntimeContext(context);
    expect(JSON.parse(serialized)).toEqual(context);
    const env = mergeSessionSandboxEnv({
      [SESSION_RUNTIME_CONTEXT_ENV_NAME]: serialized,
    });
    expect(env).toEqual({ ZED_SESSION_CONTEXT: serialized });
    expect(env).not.toHaveProperty('workspace_id');
    expect(env).not.toHaveProperty('locale');
  });

  test('rejects invalid internal values at the same boundary as public input', () => {
    expect(parseSessionRuntimeContext({ workspace_id: { nested: true } }).ok).toBe(false);
    expect(parseSessionRuntimeContext({ ZED_TOKEN: 'shadow' }).ok).toBe(false);
    expect(parseSessionRuntimeContext({ workspace_token: 'secret' }).ok).toBe(false);
  });

  test('trusted internal extras cannot shadow or invent ZED_SESSION_CONTEXT', () => {
    const base = { ZED_SESSION_CONTEXT: '{"workspace_id":"org_a"}', OTHER: 'base' };
    expect(
      mergeSessionSandboxEnv(base, {
        ZED_SESSION_CONTEXT: '{"workspace_id":"org_b"}',
        OTHER: 'extra',
      }),
    ).toEqual({
      ZED_SESSION_CONTEXT: '{"workspace_id":"org_a"}',
      OTHER: 'extra',
    });
    expect(
      mergeSessionSandboxEnv({ OTHER: 'base' }, { ZED_SESSION_CONTEXT: 'invented' }),
    ).toEqual({ OTHER: 'base' });
  });

  test('trusted internal extras cannot shadow or invent the secret capability catalog', () => {
    const catalog = '{"version":1,"capabilities":[]}';
    expect(
      mergeSessionSandboxEnv(
        { ZED_SECRET_CAPABILITIES: catalog },
        { ZED_SECRET_CAPABILITIES: '{"forged":true}' },
      ),
    ).toEqual({ ZED_SECRET_CAPABILITIES: catalog });
    expect(
      mergeSessionSandboxEnv({}, { ZED_SECRET_CAPABILITIES: '{"forged":true}' }),
    ).toEqual({});
  });
});
