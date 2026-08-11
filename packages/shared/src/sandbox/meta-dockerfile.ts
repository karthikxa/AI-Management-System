import { NODE_VERSION, OPENCODE_VERSION, PNPM_VERSION } from '../runtime-versions';

export interface MetaSandboxDockerfileOptions {
  agentBinaryPath: string;
  cliBinaryPath: string;
  entrypointScriptPath: string;
  catalogPath: string;
  /** Staged managed `zed-*` skills dir — overlaid into the harness skills
   *  dir at boot so the coordinator learns the `zed` CLI properly. */
  managedSkillsPath: string;
}

export const META_AGENT_GUIDE = [
  '# Zed Meta Agent',
  '',
  'You coordinate work. You do not perform project work in this sandbox.',
  '',
  '- This sandbox is minimal on purpose: the `zed` CLI, git, and nothing else.',
  '- Specialized sessions run full sandboxes with Python (via `uv` — tell them to use `uv run`/`uvx`/`uv pip`,',
  '  never bare `pip`), Node, browsers, and document tooling preinstalled. Never plan around what a',
  '  session might be missing — just give it the task.',
  '- Read the `zed-cli` skill before coordinating; `zed skills get zed-system` serves the full,',
  '  always-current CLI reference.',
  '- Use the `zed` CLI to inspect the current project and its sessions.',
  '- Start a specialized session when the task needs a project runtime or toolchain.',
  '- Give each specialized session one bounded task.',
  '- You are the only coordinator. Specialized sessions do their task themselves and never spawn sessions.',
  '  Always pass the task via `--prompt`; the CLI appends a session contract that tells the worker to do the',
  '  work directly and to write deliverables under /workspace/out/.',
  '- If a task needs another skill, spawn a sibling session yourself — never ask a session to delegate.',
  '- Monitor each specialized session and report its verified result.',
  '- Wait for a session with `zed sessions wait-for <session-id> --timeout 120` — never poll with sleeps.',
  '  Exit 0 = finished, 3 = blocked on an ask (answer via `zed sessions pending`), 124 = still working.',
  '- Finished sessions stop automatically to save compute. A stopped session is parked, not failed:',
  '  `sessions chat`, `sessions cp`, and `sessions wait-for` wake it on demand.',
  '- Move files between sessions with `zed sessions cp <session-id>:<path> <session-id>:<path>`.',
  '  It also copies between this sandbox and a session (`zed sessions cp local.txt <session-id>:out/local.txt`).',
  '  Paths resolve under /workspace unless absolute. Add -r for directories. The destination path is overwritten.',
  '- To spawn a session with input files, use `zed sessions new --with-file <local path> --prompt "<task>"`.',
  '  Each file lands in /workspace/incoming/ before the prompt is delivered, and the prompt gets a manifest of the paths.',
  '- To hand a file to a running session: `zed sessions cp report.pdf <session-id>:incoming/report.pdf`,',
  '  then reference /workspace/incoming/report.pdf in `zed sessions chat <session-id> --prompt "<task>"`.',
  '- To collect results, pull them from the worker\'s /workspace/out/:',
  '  `zed sessions cp <session-id>:out/result.pdf result.pdf`.',
  '- Do not install project toolchains in this sandbox.',
  '- Do not clone the project repository into this sandbox.',
  '- Treat this sandbox as disposable.',
  '',
  '`ZED_CLI_TOKEN` authenticates the CLI without login or local configuration.',
  'It grants every project action allowed to the user who started this session.',
  'It cannot access another project, account administration, project secrets, or connectors.',
].join('\n');

/**
 * Render the platform meta-agent image.
 *
 * This runtime contains the daemon, Zed CLI, Git, and OpenCode. It excludes
 * project toolchains because the meta agent delegates project work to another
 * session.
 */
export function buildMetaSandboxDockerfile(options: MetaSandboxDockerfileOptions): string {
  return `# syntax=docker/dockerfile:1.7
FROM debian:bookworm-slim

RUN apt-get update \\
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \\
      ca-certificates curl git gzip libatomic1 sudo util-linux \\
 && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /bin/bash zed \\
 && mkdir -p /workspace /opt/zed /ephemeral/zed-master/opencode \\
 && chown -R zed:zed /workspace /opt/zed /ephemeral

ENV PNPM_HOME=/home/zed/.local/share/pnpm \\
    PATH="/home/zed/.local/share/pnpm/bin:\${PATH}"
RUN curl -fsSL https://get.pnpm.io/install.sh \\
      | env HOME=/home/zed SHELL=/bin/bash PNPM_VERSION=${PNPM_VERSION} sh - \\
 && HOME=/home/zed pnpm runtime set node ${NODE_VERSION} --global \\
 && HOME=/home/zed pnpm add --global --allow-build=opencode-ai "opencode-ai@${OPENCODE_VERSION}" \\
 && ln -sf "\$(command -v node)" /usr/local/bin/node \\
 && chown -R zed:zed /home/zed

COPY ${options.agentBinaryPath} /tmp/zed-agent.gz
COPY ${options.cliBinaryPath} /tmp/zed.gz
RUN gzip -dc /tmp/zed-agent.gz > /usr/local/bin/zed-agent \\
 && gzip -dc /tmp/zed.gz > /usr/local/bin/zed \\
 && chmod 0755 /usr/local/bin/zed-agent /usr/local/bin/zed \\
 && rm /tmp/zed-agent.gz /tmp/zed.gz
COPY ${options.entrypointScriptPath} /usr/local/bin/zed-entrypoint
RUN chmod 0755 /usr/local/bin/zed-entrypoint
COPY --chown=zed:zed <<'ZED_META_AGENT_GUIDE' /workspace/AGENTS.md
${META_AGENT_GUIDE}
ZED_META_AGENT_GUIDE
COPY --chown=zed:zed ${options.catalogPath} /opt/zed/llm-catalog.json
COPY --chown=zed:zed ${options.managedSkillsPath} /opt/zed/managed-skills

ENV ZED_WORKSPACE=/workspace \\
    ZED_PROJECT_AUTO_CLONE=0 \\
    ZED_OPENCODE_PROCESS_TRANSPORT=rest \\
    ZED_LLM_CATALOG_FILE=/opt/zed/llm-catalog.json
WORKDIR /workspace
EXPOSE 8000
ENTRYPOINT ["/usr/local/bin/zed-entrypoint"]
`;
}
