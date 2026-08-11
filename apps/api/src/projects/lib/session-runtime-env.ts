import { agentConfigEtag } from './compile-agent-config';
import type { WorkspaceModeV2 } from '@zed/manifest-schema';
import { workspaceModeAllowsFullRepository } from './session-sandbox-metadata';

export interface SessionRuntimeEnvInput {
  projectId: string;
  sessionId: string;
  repoUrl: string;
  baseRef: string;
  agentName: string;
  apiUrl: string;
  /** Frontend base URL (no /v1) the sandbox surfaces as user-facing links. */
  frontendUrl?: string;
  initialPrompt?: string | null;
  opencodeModel?: string | null;
  /** Project file delivery mode selected by the session's agent. */
  workspaceMode?: WorkspaceModeV2 | null;
  /** Server-compiled OpenCode agent config (JSON string) for a `zed_version:
   *  2` project — see `compile-agent-config.ts`. `null`/omitted for a v1
   *  project: no key is emitted, so v1 sandbox env is byte-for-byte unchanged. */
  compiledAgentConfig?: string | null;
}

export function buildSessionRuntimeEnv(input: SessionRuntimeEnvInput): Record<string, string> {
  const allowsFullRepository = workspaceModeAllowsFullRepository(input.workspaceMode);
  const projectGitEnv: Record<string, string> =
    allowsFullRepository
      ? {
          ZED_REPO_URL: input.repoUrl,
          ZED_DEFAULT_BRANCH: input.baseRef,
          ZED_BASE_REF: input.baseRef,
          ZED_BRANCH_NAME: input.sessionId,
        }
      : {};
  return {
    ...projectGitEnv,
    ZED_PROJECT_ID: input.projectId,
    ZED_SESSION_ID: input.sessionId,
    ZED_SERVICE_PORT: '8000',
    ZED_AGENT_NAME: input.agentName,
    ZED_API_URL: input.apiUrl,
    ZED_PROJECT_AUTO_CLONE: allowsFullRepository ? '1' : '0',
    ...(input.workspaceMode ? { ZED_WORKSPACE_MODE: input.workspaceMode } : {}),
    // Frontend base for user-facing dashboard links — the agent/CLI must never
    // surface ZED_API_URL (the API host) to a human. See sandboxFrontendBaseUrl().
    ...(input.frontendUrl ? { ZED_FRONTEND_URL: input.frontendUrl } : {}),
    // The sandbox daemon owns OpenCode root creation for every cold session.
    // The API adopts/persists that root; it must not create a competing one.
    ZED_BOOTSTRAP_OPENCODE_SESSION: '1',
    ...(input.initialPrompt ? { ZED_INITIAL_PROMPT: input.initialPrompt } : {}),
    ...(input.opencodeModel ? { ZED_OPENCODE_MODEL: input.opencodeModel } : {}),
    // The sandbox daemon merges this as the BASE of its own composed opencode
    // config (connector MCP / gateway provider / Slack overlays still apply on
    // top — see apps/zed-sandbox-agent-server/src/opencode.ts). Per-call
    // The resolved session model (ZED_OPENCODE_MODEL above), or an explicit
    // model on a prompt request, still wins over this compiled fallback.
    ...(input.compiledAgentConfig
      ? {
          ZED_COMPILED_AGENT_CONFIG: input.compiledAgentConfig,
          // Content hash of the line above, echoed by the daemon's /zed/health.
          // It is what makes "is this session running the latest config?" a
          // question anyone can answer — the box reports what it actually
          // spawned with, rather than the API guessing from what it last sent.
          ZED_COMPILED_AGENT_CONFIG_ETAG: agentConfigEtag(input.compiledAgentConfig) ?? '',
        }
      : {}),
  };
}
