import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { platformConfig } from '@zed/sdk';

import type { Auth } from './auth.ts';
import { zedFromAuth, sdkBackendUrl, withZedScope } from './sdk.ts';

const originalFetch = globalThis.fetch;

function auth(overrides: Partial<Auth> = {}): Auth {
  return {
    api_base: 'https://api.zed.com',
    token: 'zed_pat_test',
    user_id: 'u1',
    user_email: 'u@example.com',
    account_id: 'a1',
    logged_in_at: '2026-07-30T00:00:00.000Z',
    ...overrides,
  };
}

describe('sdkBackendUrl', () => {
  test('appends the version prefix to a bare origin', () => {
    expect(sdkBackendUrl('https://api.zed.com')).toBe('https://api.zed.com/v1');
  });

  test('does not double the version prefix when the base already carries it', () => {
    expect(sdkBackendUrl('https://api.zed.com/v1')).toBe('https://api.zed.com/v1');
  });

  test('strips a trailing slash before appending the version prefix', () => {
    expect(sdkBackendUrl('https://api.zed.com/')).toBe('https://api.zed.com/v1');
  });

  test('keeps localhost on http so a local stack stays reachable', () => {
    expect(sdkBackendUrl('http://localhost:14108')).toBe('http://localhost:14108/v1');
  });

  test('returns an absolute url because the SDK rejects a relative backendUrl outside a browser', () => {
    expect(sdkBackendUrl('https://api.zed.com').startsWith('https://')).toBe(true);
  });
});

describe('zedFromAuth', () => {
  test('exposes the session handle the CLI needs', () => {
    const zed = zedFromAuth(auth());
    expect(typeof zed.session).toBe('function');
    expect(typeof zed.project).toBe('function');
    expect(typeof zed.projects.list).toBe('function');
  });

  test('reuses one client per host and token so a CLI process holds a single client', () => {
    const a = auth();
    expect(zedFromAuth(a)).toBe(zedFromAuth({ ...a }));
  });

  test('mints a distinct client for a different host', () => {
    expect(zedFromAuth(auth())).not.toBe(
      zedFromAuth(auth({ api_base: 'https://other.zed.com' })),
    );
  });

  test('mints a distinct client for a different token', () => {
    expect(zedFromAuth(auth())).not.toBe(zedFromAuth(auth({ token: 'zed_pat_other' })));
  });
});

describe('withZedScope', () => {
  beforeEach(() => {
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('makes the normalized backend url the platform config for the duration of the call', async () => {
    const seen = await withZedScope(auth(), async () => platformConfig().backendUrl);
    expect(seen).toBe('https://api.zed.com/v1');
  });

  test('resolves the auth token through the platform getToken seam', async () => {
    const token = await withZedScope(auth(), async () => platformConfig().getToken());
    expect(token).toBe('zed_pat_test');
  });

  test('identifies scoped backend requests as CLI traffic', async () => {
    const source = await withZedScope(auth(), async () => platformConfig().clientSource);
    expect(source).toBe('cli');
  });

  test('isolates concurrent scopes so a multi-host scan never crosses tokens', async () => {
    const [first, second] = await Promise.all([
      withZedScope(auth({ api_base: 'https://one.zed.com', token: 'one' }), async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return `${platformConfig().backendUrl}|${await platformConfig().getToken()}`;
      }),
      withZedScope(auth({ api_base: 'https://two.zed.com', token: 'two' }), async () => {
        return `${platformConfig().backendUrl}|${await platformConfig().getToken()}`;
      }),
    ]);
    expect(first).toBe('https://one.zed.com/v1|one');
    expect(second).toBe('https://two.zed.com/v1|two');
  });
});
