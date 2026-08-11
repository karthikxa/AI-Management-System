'use client';

import { BRAND, resolveApiUrl } from '@/config/brand';
import { configureZed, createZed } from '@zed/sdk';
import { getSessionToken } from './session';

/**
 * The white-label's single seam to Zed: the official `@zed/sdk`. No raw
 * HTTP and no runtime transport imports. One token supplied via `getToken` — a pasted
 * Zed API key in direct mode, or Lumen's own session token in wrapper mode
 * (see `configureWrapperMode` below). Swap `BRAND.apiUrl` + the key to
 * re-point direct mode at any Zed deployment.
 */

const TOKEN_KEY = 'zed_api_key';

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setApiKey(key: string): void {
  window.localStorage.setItem(TOKEN_KEY, key.trim());
}

export function clearApiKey(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

/**
 * The configured client. `createZed` wires the platform seam once on
 * import, defaulting to direct mode. All of its methods read the platform
 * config LIVE on every call (not at creation time), so `configureWrapperMode`
 * below can safely re-point the same `zed` object at the wrapper proxy
 * later — no consumer needs to re-import or re-create anything.
 */
export const zed = createZed({
  backendUrl: BRAND.apiUrl,
  getToken: async () => getApiKey(),
});

/**
 * Re-point the SDK at the same-origin BFF proxy once `Providers` confirms
 * wrapper mode is on (`GET /api/mode`). Direct mode never calls this — `zed`
 * stays wired to `BRAND.apiUrl` + the pasted API key, unchanged.
 */
export function configureWrapperMode(): void {
  configureZed({
    backendUrl: resolveApiUrl(true),
    getToken: async () => getSessionToken(),
  });
}
