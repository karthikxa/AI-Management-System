/**
 * Zed-native PTY client — the daemon `/zed/pty` endpoints
 * (routes/pty.ts in zed-sandbox-agent-server), owned by the SDK.
 * Independent of whatever agent runtime (OpenCode today) is running in the
 * sandbox — a raw terminal shouldn't go down with the agent.
 *
 * Response shape matches OpenCode's own `Pty` entity 1:1 (id/title/command/
 * args/cwd/status/pid/exitCode), so this is a drop-in swap for callers
 * already built against that contract.
 *
 * Every call takes an explicit `baseUrl` (same convention as `env.ts`/
 * `triggers.ts`) rather than reading the module-global "active runtime" —
 * a caller keyed to a specific sandbox instance must talk to THAT instance.
 */
import { authenticatedFetch, getAuthToken } from '../http/auth';
import { stripTrailingSlashes } from '../../platform/strings';

export interface ZedPty {
  id: string;
  title: string;
  command: string;
  args: string[];
  cwd: string;
  status: 'running' | 'exited';
  pid: number;
  exitCode?: number;
}

async function ptyErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}) as { error?: string; message?: string });
  return body?.error || body?.message || res.statusText || fallback;
}

function requireBaseUrl(baseUrl: string): string {
  if (!baseUrl) {
    throw new Error('[zed-pty] Server URL not ready — sandbox is still loading');
  }
  return stripTrailingSlashes(baseUrl);
}

/** List running/exited terminals. Daemon `GET /zed/pty`. */
export async function listZedPty(baseUrl: string): Promise<ZedPty[]> {
  const url = requireBaseUrl(baseUrl);
  const res = await authenticatedFetch(`${url}/zed/pty`);
  if (!res.ok) throw new Error(await ptyErrorMessage(res, 'Failed to list terminals'));
  return res.json();
}

/** Spawn a new terminal. Daemon `POST /zed/pty`. */
export async function createZedPty(
  baseUrl: string,
  body?: { command?: string; args?: string[]; cwd?: string; title?: string; env?: Record<string, string> },
): Promise<ZedPty> {
  const url = requireBaseUrl(baseUrl);
  const res = await authenticatedFetch(`${url}/zed/pty`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(await ptyErrorMessage(res, 'Failed to create terminal'));
  return res.json();
}

/** Rename/resize a terminal. Daemon `PATCH /zed/pty/:id`. */
export async function updateZedPty(
  baseUrl: string,
  ptyId: string,
  body: { title?: string; size?: { rows: number; cols: number } },
): Promise<ZedPty> {
  const url = requireBaseUrl(baseUrl);
  const res = await authenticatedFetch(`${url}/zed/pty/${encodeURIComponent(ptyId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await ptyErrorMessage(res, 'Failed to update terminal'));
  return res.json();
}

/** Kill + remove a terminal. Daemon `DELETE /zed/pty/:id`. */
export async function removeZedPty(baseUrl: string, ptyId: string): Promise<void> {
  const url = requireBaseUrl(baseUrl);
  const res = await authenticatedFetch(`${url}/zed/pty/${encodeURIComponent(ptyId)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await ptyErrorMessage(res, 'Failed to remove terminal'));
}

/**
 * WebSocket URL for a terminal's live stream — same http→ws conversion,
 * mixed-content upgrade, and `?token=` query auth (WebSocket can't set
 * custom headers) the OpenCode-backed terminal used, just pointed at
 * `/zed/pty` instead of OpenCode's `/pty`.
 */
export async function getZedPtyWebSocketUrl(ptyId: string, baseUrl: string): Promise<string> {
  const base = requireBaseUrl(baseUrl);
  const wsBase = (() => {
    try {
      const parsed = new URL(base);
      if (parsed.protocol === 'https:') parsed.protocol = 'wss:';
      else if (parsed.protocol === 'http:') parsed.protocol = 'ws:';
      // Browsers block ws:// from an https page (mixed content) — force wss:
      // in that case rather than fail a deployment-only combination.
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && parsed.protocol === 'ws:') {
        parsed.protocol = 'wss:';
      }
      return stripTrailingSlashes(parsed.toString());
    } catch {
      return base.replace('https://', 'wss://').replace('http://', 'ws://');
    }
  })();
  const url = `${wsBase}/zed/pty/${encodeURIComponent(ptyId)}/connect`;
  // Browser WebSocket API doesn't support custom headers, so inject the auth
  // token as a query param for the daemon (via the backend proxy) to check.
  const token = await getAuthToken();
  if (!token) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

/** Grouped namespace for ergonomic use (also available as named exports). */
export const zedPty = {
  list: listZedPty,
  create: createZedPty,
  update: updateZedPty,
  remove: removeZedPty,
  webSocketUrl: getZedPtyWebSocketUrl,
};
