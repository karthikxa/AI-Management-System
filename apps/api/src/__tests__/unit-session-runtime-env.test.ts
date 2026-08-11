import { describe, expect, test } from 'bun:test';

import { buildPlatformMetaOpenCodeConfig } from '../projects/lib/platform-meta-agent';
import { buildSessionRuntimeEnv } from '../projects/lib/session-runtime-env';

const base = {
  projectId: 'proj-1',
  sessionId: 'sess-1',
  repoUrl: 'https://github.com/zed/project.git',
  baseRef: 'main',
  agentName: 'default',
  apiUrl: 'https://api.zed.test/v1',
};

describe('buildSessionRuntimeEnv', () => {
  test('always asks the sandbox daemon to bootstrap the OpenCode root', () => {
    const env = buildSessionRuntimeEnv(base);

    expect(env.ZED_BOOTSTRAP_OPENCODE_SESSION).toBe('1');
    expect(env.ZED_INITIAL_PROMPT).toBeUndefined();
    expect(env.ZED_REPO_URL).toBe(base.repoUrl);
    expect(env.ZED_BRANCH_NAME).toBe(base.sessionId);
  });

  test('adds first-turn and model payload without changing root ownership', () => {
    const env = buildSessionRuntimeEnv({
      ...base,
      initialPrompt: 'answer this Slack thread',
      opencodeModel: 'anthropic/claude-sonnet-4-6',
    });

    expect(env.ZED_BOOTSTRAP_OPENCODE_SESSION).toBe('1');
    expect(env.ZED_INITIAL_PROMPT).toBe('answer this Slack thread');
    expect(env.ZED_OPENCODE_MODEL).toBe('anthropic/claude-sonnet-4-6');
  });
  test('boots the platform meta agent through OpenCode REST', () => {
    const env = buildSessionRuntimeEnv({
      ...base,
      agentName: 'meta',
      compiledAgentConfig: buildPlatformMetaOpenCodeConfig(),
    });

    expect(env.ZED_BOOTSTRAP_OPENCODE_SESSION).toBe('1');
    expect(env.ZED_COMPILED_AGENT_CONFIG).toBe(buildPlatformMetaOpenCodeConfig());
  });
});
