/**
 * The layer split is a ZERO-BYTE-CHANGE refactor: `buildLayeredDockerfile` used
 * to render one flat array; it now concatenates `zedToolchainLayer` and
 * `zedArtifactLayer`. The rendered Dockerfile text is NOT part of the
 * snapshot fingerprint — it enters snapshot identity only via
 * RUNTIME_LAYER_VERSION (apps/api/src/snapshots/templates.ts). So a split that
 * silently dropped, duplicated, or re-ordered a byte would NOT invalidate a
 * cached image: every existing snapshot would keep serving while new builds
 * rendered something else.
 *
 * These tests are what let RUNTIME_LAYER_VERSION stay put across the split.
 */
import { describe, expect, test } from 'bun:test';
import { AGENT_BROWSER_VERSION, OPENCODE_VERSION } from '../../runtime-versions';
import {
  buildLayeredDockerfile,
  type BuildLayeredDockerfileOpts,
  zedArtifactLayer,
  zedToolchainLayer,
  normalizeUserDockerfileForSnapshot,
  PLATFORM_DEFAULT_USER_DOCKERFILE,
} from '../dockerfile-layer';

const COMMON = {
  opencodeVersion: OPENCODE_VERSION,
  agentBrowserVersion: AGENT_BROWSER_VERSION,
  agentBinaryPath: 'zed-agent.gz',
  cliBinaryPath: 'zed.gz',
  entrypointScriptPath: 'zed-entrypoint',
  machineDocPath: 'MACHINE.md',
  slackCliPath: 'zed-slack-cli',
};

// The user Dockerfile shapes the production builder actually feeds in: a plain
// one, the platform default, and a legacy starter one (whose baseline apt block
// normalizeUserDockerfileForSnapshot strips).
const USER_DOCKERFILES: Array<{ label: string; source: string }> = [
  { label: 'plain', source: 'FROM ubuntu:24.04\nRUN apt-get install -y foo\n' },
  { label: 'platform default', source: PLATFORM_DEFAULT_USER_DOCKERFILE },
  { label: 'no trailing newline', source: 'FROM scratch' },
  {
    label: 'legacy starter (baseline apt block stripped)',
    source: `FROM ubuntu:24.04

# Bring in baseline tooling. The Zed layer on top also installs
# git/curl/ca-certificates/nodejs/npm, but having them in your base
# makes interactive sessions snappier.
RUN apt-get update \\
    && apt-get install -y --no-install-recommends \\
        ca-certificates \\
        curl \\
        git \\
        build-essential \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
`,
  },
];

// The opts shapes the production builder actually renders: the shared default
// image (no config warm), the real default image (starter config + catalog),
// and a per-project COLD warm (warmRepo).
const OPT_SHAPES: Array<{ label: string; opts: Omit<BuildLayeredDockerfileOpts, 'userDockerfile'> }> = [
  { label: 'bare (no opencodeConfigPath)', opts: { ...COMMON } },
  {
    label: 'with opencodeConfigPath + catalogPath',
    opts: {
      ...COMMON,
      opencodeConfigPath: 'zed-opencode-config',
      catalogPath: 'zed-llm-catalog.json',
    },
  },
  {
    label: 'with warmRepo (per-project COLD warm)',
    opts: {
      ...COMMON,
      opencodeConfigPath: 'zed-opencode-config',
      warmRepo: {
        stagedPath: 'zed-warm-repo',
        stagedGitPath: 'zed-warm-repo-git.tar',
        branch: 'main',
      },
    },
  },
  {
    label: 'agentBrowserVersion omitted (pinned default)',
    opts: (() => {
      const { agentBrowserVersion: _omitted, ...rest } = COMMON;
      return rest;
    })(),
  },
];

describe('layer split composes byte-identically', () => {
  for (const { label: userLabel, source } of USER_DOCKERFILES) {
    for (const { label: optsLabel, opts } of OPT_SHAPES) {
      test(`${userLabel} × ${optsLabel}`, () => {
        const full: BuildLayeredDockerfileOpts = { userDockerfile: source, ...opts };
        const trimmed = normalizeUserDockerfileForSnapshot(source).trimEnd();
        expect(buildLayeredDockerfile(full)).toBe(
          `${trimmed}\n${zedToolchainLayer(full)}${zedArtifactLayer(full)}`,
        );
      });
    }
  }
});

describe('the halves join without a seam', () => {
  const opts: BuildLayeredDockerfileOpts = { userDockerfile: 'FROM scratch', ...COMMON };

  test('the toolchain half ends with a newline, so the halves concatenate raw', () => {
    // The '\n' that used to sit between the two halves in the single flat array
    // lives at the tail of the toolchain half — callers must NOT re-add it.
    expect(zedToolchainLayer(opts).endsWith('\n')).toBe(true);
  });

  test('the artifact half is the contiguous staged-artifact tail', () => {
    const artifact = zedArtifactLayer(opts);
    expect(artifact.startsWith('USER root\nCOPY zed-agent.gz /tmp/zed-agent.gz\n')).toBe(true);
    expect(artifact.endsWith('ENTRYPOINT ["/usr/local/bin/zed-entrypoint"]\n')).toBe(true);
  });

  test('each instruction lands in exactly one half', () => {
    const toolchain = zedToolchainLayer(opts);
    const artifact = zedArtifactLayer(opts);
    // Toolchain: installs from the network, stages nothing.
    expect(toolchain).toContain('# ─── Zed runtime layer (auto-injected) ─');
    expect(toolchain).toContain(`opencode-ai@${OPENCODE_VERSION}`);
    expect(toolchain).toContain(`agent-browser@${AGENT_BROWSER_VERSION}`);
    expect(toolchain).not.toContain('COPY ');
    expect(toolchain).not.toContain('ENTRYPOINT');
    // Artifacts: COPYs staged bytes, then wires the container.
    expect(artifact).toContain('COPY zed.gz /tmp/zed.gz');
    expect(artifact).toContain('COPY MACHINE.md /MACHINE.md');
    expect(artifact).toContain('COPY scaffold.git /opt/zed/scaffold.git');
    expect(artifact).toContain('zed --version');
    expect(artifact).toContain('ENV ZED_WORKSPACE=/workspace');
    expect(artifact).not.toContain('apt-get');
    expect(artifact).not.toContain('npm install');
  });

  test('the toolchain half needs no staged artifacts — it renders from an empty context', () => {
    // The local CLI omits the optional cache-warm script, keeping this renderer
    // usable with its intentionally empty build context.
    const toolchain = zedToolchainLayer({ opencodeVersion: OPENCODE_VERSION });
    expect(toolchain).not.toContain('COPY ');
    expect(toolchain).toContain('RUN apt-get update \\');
  });

  test('the optional catalog COPY only appears when catalogPath is set', () => {
    expect(zedArtifactLayer(opts)).not.toContain('/opt/zed/llm-catalog.json');
    expect(zedArtifactLayer({ ...opts, catalogPath: 'zed-llm-catalog.json' })).toContain(
      'COPY zed-llm-catalog.json /opt/zed/llm-catalog.json',
    );
  });
});
