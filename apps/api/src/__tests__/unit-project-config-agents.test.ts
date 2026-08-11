import { describe, expect, test } from 'bun:test';

import { resolveConfigAgents } from '../projects/git/config';
import type { LoadedAgents } from '../projects/agents';

const nativeAgents = [
  {
    name: 'zed',
    path: '.zed/opencode/agents/zed.md',
    description: 'Default Zed agent',
    mode: 'primary',
  },
  {
    name: 'release-bot',
    path: '.zed/opencode/agents/release-bot.md',
    description: 'Ships releases',
    mode: 'subagent',
  },
];

describe('project config agent discovery', () => {
  test('no agents: keeps legacy OpenCode discovery', () => {
    const result = resolveConfigAgents(nativeAgents, { specs: [], errors: [] });

    expect(result.agent_discovery).toBe('opencode');
    expect(result.agents).toEqual([
      { ...nativeAgents[0], source: 'opencode', enabled: true },
      { ...nativeAgents[1], source: 'opencode', enabled: true },
    ]);
  });

  test('agents: becomes the launchable server-side roster', () => {
    const loaded: LoadedAgents = {
      errors: [],
      specs: [
        {
          name: 'zed',
          path: 'zed.yaml#agents.zed',
          enabled: true,
          connectors: 'all',
          zedCli: 'all',
          env: 'all',
          file: null,
          model: null,
        },
        {
          name: 'triage',
          path: 'zed.yaml#agents.triage',
          enabled: true,
          connectors: [],
          zedCli: [],
          env: 'all',
          file: '.zed/opencode/agents/release-bot.md',
          model: null,
        },
        {
          name: 'disabled',
          path: 'zed.yaml#agents.disabled',
          enabled: false,
          connectors: [],
          zedCli: [],
          env: 'all',
          file: null,
          model: null,
        },
      ],
    };

    const result = resolveConfigAgents(nativeAgents, loaded);

    expect(result.agent_discovery).toBe('declarative');
    expect(result.agents).toEqual([
      {
        name: 'zed',
        path: '.zed/opencode/agents/zed.md',
        description: 'Default Zed agent',
        mode: 'primary',
        source: 'zed.yaml',
        enabled: true,
        sandbox: null,
        scope: { env: 'all', connectors: 'all', zed_cli: 'all' },
      },
      {
        name: 'triage',
        path: '.zed/opencode/agents/release-bot.md',
        description: 'Ships releases',
        mode: 'subagent',
        source: 'zed.yaml',
        enabled: true,
        sandbox: null,
        scope: { env: 'all', connectors: [], zed_cli: [] },
      },
    ]);
  });

  test('per-agent env/connectors/CLI allowlists surface as read-only scope', () => {
    const loaded: LoadedAgents = {
      errors: [],
      specs: [
        {
          name: 'support_bot',
          path: 'zed.yaml#agents.support_bot',
          enabled: true,
          connectors: ['stripe'],
          zedCli: ['project.read'],
          env: ['GITHUB_TOKEN', 'OPENAI_API_KEY'],
          file: null,
          model: null,
        },
      ],
    };

    const [agent] = resolveConfigAgents(nativeAgents, loaded).agents;
    // The UI reads exactly this to render the per-agent scope panel — note the
    // wire key is `zed_cli` (snake_case), mapped from the spec's `zedCli`.
    expect(agent?.scope).toEqual({
      env: ['GITHUB_TOKEN', 'OPENAI_API_KEY'],
      connectors: ['stripe'],
      zed_cli: ['project.read'],
    });
  });

  test('OpenCode-discovered agents carry no agents: scope', () => {
    const result = resolveConfigAgents(nativeAgents, { specs: [], errors: [] });
    expect(result.agents.every((a) => a.scope === undefined)).toBe(true);
  });

  test('invalid agents: adoption disables legacy discovery instead of silently exposing all agents', () => {
    const result = resolveConfigAgents(nativeAgents, {
      specs: [],
      errors: [{
        name: '(top-level)',
        path: 'zed.yaml',
        error: '`agents` must use [[agents]]',
      }],
    });

    expect(result.agent_discovery).toBe('declarative');
    expect(result.agents).toEqual([]);
  });
});
