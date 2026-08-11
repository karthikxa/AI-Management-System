import { describe, expect, test } from 'bun:test';
import { buildSessionRuntimeEnv } from './session-runtime-env';

const BASE_INPUT = {
  projectId: 'proj-1',
  sessionId: 'sess-1',
  repoUrl: 'https://example.test/acme/repo.git',
  baseRef: 'main',
  agentName: 'default',
  apiUrl: 'https://api.zed.test/v1',
};

describe('buildSessionRuntimeEnv — ZED_COMPILED_AGENT_CONFIG', () => {
  test('omits the key entirely for a v1 project (compiledAgentConfig absent) — byte-for-byte unaffected', () => {
    const env = buildSessionRuntimeEnv(BASE_INPUT);
    expect(env).not.toHaveProperty('ZED_COMPILED_AGENT_CONFIG');
  });

  test('omits the key when compiledAgentConfig is explicitly null', () => {
    const env = buildSessionRuntimeEnv({ ...BASE_INPUT, compiledAgentConfig: null });
    expect(env).not.toHaveProperty('ZED_COMPILED_AGENT_CONFIG');
  });

  test('carries the compiled JSON through verbatim for a v2 project', () => {
    const compiled = JSON.stringify({ agent: { support: { mode: 'primary' } } });
    const env = buildSessionRuntimeEnv({ ...BASE_INPUT, compiledAgentConfig: compiled });
    expect(env.ZED_COMPILED_AGENT_CONFIG).toBe(compiled);
  });

  test('coexists with ZED_OPENCODE_MODEL — the per-session override key is unaffected', () => {
    const compiled = JSON.stringify({ agent: {} });
    const env = buildSessionRuntimeEnv({
      ...BASE_INPUT,
      compiledAgentConfig: compiled,
      opencodeModel: 'anthropic/claude-opus-4-8',
    });
    expect(env.ZED_OPENCODE_MODEL).toBe('anthropic/claude-opus-4-8');
    expect(env.ZED_COMPILED_AGENT_CONFIG).toBe(compiled);
  });

  test('ignores legacy attribution input and emits no attribution variables', () => {
    const env = buildSessionRuntimeEnv({
      ...BASE_INPUT,
      originRef: 'legacy-reference',
    } as Parameters<typeof buildSessionRuntimeEnv>[0]);

    expect(env).not.toHaveProperty('ZED_END_USER_REF');
    expect(env).not.toHaveProperty('ZED_ORIGIN_REF');
  });
});

describe('buildSessionRuntimeEnv — workspace mode', () => {
  test('runtime mode removes every project Git coordinate', () => {
    const env = buildSessionRuntimeEnv({
      ...BASE_INPUT,
      workspaceMode: 'runtime',
    });

    expect(env.ZED_WORKSPACE_MODE).toBe('runtime');
    expect(env.ZED_PROJECT_AUTO_CLONE).toBe('0');
    expect(env).not.toHaveProperty('ZED_REPO_URL');
    expect(env).not.toHaveProperty('ZED_DEFAULT_BRANCH');
    expect(env).not.toHaveProperty('ZED_BASE_REF');
    expect(env).not.toHaveProperty('ZED_BRANCH_NAME');
  });

  test('read mode cannot clone before exact-path artifacts are implemented', () => {
    const env = buildSessionRuntimeEnv({
      ...BASE_INPUT,
      workspaceMode: 'read',
    });

    expect(env.ZED_WORKSPACE_MODE).toBe('read');
    expect(env.ZED_PROJECT_AUTO_CLONE).toBe('0');
    expect(env).not.toHaveProperty('ZED_REPO_URL');
    expect(env).not.toHaveProperty('ZED_DEFAULT_BRANCH');
    expect(env).not.toHaveProperty('ZED_BASE_REF');
    expect(env).not.toHaveProperty('ZED_BRANCH_NAME');
  });

  test('legacy and branch sessions keep the project clone and Git coordinates', () => {
    for (const env of [
      buildSessionRuntimeEnv(BASE_INPUT),
      buildSessionRuntimeEnv({ ...BASE_INPUT, workspaceMode: 'branch' }),
    ]) {
      expect(env.ZED_PROJECT_AUTO_CLONE).toBe('1');
      expect(env.ZED_REPO_URL).toBe(BASE_INPUT.repoUrl);
      expect(env.ZED_DEFAULT_BRANCH).toBe(BASE_INPUT.baseRef);
      expect(env.ZED_BASE_REF).toBe(BASE_INPUT.baseRef);
      expect(env.ZED_BRANCH_NAME).toBe(BASE_INPUT.sessionId);
    }
  });
});
