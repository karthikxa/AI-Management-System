import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { renderHostNotice } from '../host-notice.ts';

const ENV_KEYS = [
  'ZED_CLI_TOKEN',
  'ZED_TOKEN',
  'ZED_API_URL',
  'ZED_PROJECT_ID',
  'ZED_SESSION_ID',
  'BASH_ENV',
  'ZED_DISABLE_SANDBOX_ENV_FILE',
  'ZED_CONFIG_FILE',
  'ZED_AUTH_FILE',
] as const;

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = {};
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  process.env.ZED_DISABLE_SANDBOX_ENV_FILE = '1';
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

function writeConfig(hosts: Record<string, unknown>, active = 'cloud'): string {
  const dir = mkdtempSync(join(tmpdir(), 'zed-cli-banner-'));
  const file = join(dir, 'config.json');
  writeFileSync(file, JSON.stringify({ active, hosts }, null, 2));
  process.env.ZED_CONFIG_FILE = file;
  return dir;
}

describe('host notice', () => {
  test('shows env-provided sandbox host and project-token auth instead of logged-out config host', () => {
    const dir = writeConfig({
      cloud: {
        url: 'https://api.zed.com',
        token: '',
        user_id: '',
        user_email: '',
        account_id: '',
        logged_in_at: '',
      },
    });
    try {
      process.env.ZED_API_URL = 'https://dev-api.zed.com/v1';
      process.env.ZED_CLI_TOKEN = 'zed_pat_project';
      process.env.ZED_PROJECT_ID = 'proj_123';

      const notice = renderHostNotice(['whoami']);
      expect(notice).toContain('host sandbox');
      expect(notice).toContain('https://dev-api.zed.com/v1');
      expect(notice).toContain('authenticated (project token)');
      expect(notice).not.toContain('https://api.zed.com');
      expect(notice).not.toContain('not logged in');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('shows ZED_API_URL override for stored user auth', () => {
    const dir = writeConfig({
      cloud: {
        url: 'https://api.zed.com',
        token: 'zed_pat_user',
        user_id: 'user_123',
        user_email: 'user@example.com',
        account_id: 'acct_123',
        logged_in_at: '2026-01-01T00:00:00.000Z',
      },
    });
    try {
      process.env.ZED_API_URL = 'https://dev-api.zed.com/v1';

      const notice = renderHostNotice(['whoami']);
      expect(notice).toContain('host env');
      expect(notice).toContain('https://dev-api.zed.com/v1');
      expect(notice).toContain('user@example.com (user)');
      expect(notice).not.toContain('https://api.zed.com');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('shows session-token auth when sandbox env includes a session id', () => {
    const dir = writeConfig({
      cloud: {
        url: 'https://api.zed.com',
        token: '',
        user_id: '',
        user_email: '',
        account_id: '',
        logged_in_at: '',
      },
    });
    try {
      process.env.ZED_API_URL = 'https://api.zed.com/v1';
      process.env.ZED_CLI_TOKEN = 'zed_pat_session';
      process.env.ZED_PROJECT_ID = 'proj_123';
      process.env.ZED_SESSION_ID = 'sess_123';

      const notice = renderHostNotice(['whoami']);
      expect(notice).toContain('host sandbox');
      expect(notice).toContain('authenticated (session token)');
      expect(notice).not.toContain('authenticated (project token)');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('--host display uses the requested stored host instead of sandbox env auth', () => {
    const dir = writeConfig(
      {
        customdev: {
          url: 'https://dev-api.zed.com/v1',
          token: 'zed_pat_user',
          user_id: 'user_123',
          user_email: 'dev@example.com',
          account_id: 'acct_123',
          logged_in_at: '2026-01-01T00:00:00.000Z',
        },
      },
      'customdev',
    );
    try {
      process.env.ZED_API_URL = 'https://sandbox-api.zed.test/v1';
      process.env.ZED_CLI_TOKEN = 'zed_pat_project';

      const notice = renderHostNotice(['whoami', '--host', 'customdev']);
      expect(notice).toContain('host customdev');
      expect(notice).toContain('https://dev-api.zed.com/v1');
      expect(notice).toContain('dev@example.com (user)');
      expect(notice).not.toContain('https://sandbox-api.zed.test/v1');
      expect(notice).not.toContain('project token');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
