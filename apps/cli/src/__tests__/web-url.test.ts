import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { projectWebUrl, sessionWebUrl, webDashboardUrl } from '../web-url';

const SAVED = { ...process.env };

beforeEach(() => {
  delete process.env.ZED_FRONTEND_URL;
  delete process.env.ZED_DASHBOARD_URL;
  delete process.env.BASH_ENV;
  process.env.ZED_DISABLE_SANDBOX_ENV_FILE = '1';
});

afterEach(() => {
  process.env = { ...SAVED };
});

describe('webDashboardUrl — derive fallback (no authoritative env)', () => {
  test('prod api host never leaks: api-prod.zed.com → zed.com', () => {
    // The original bug: this returned https://api-prod.zed.com unchanged.
    expect(webDashboardUrl('https://api-prod.zed.com/v1')).toBe('https://zed.com');
  });

  test('api. prefix is stripped: api.zed.com → zed.com', () => {
    expect(webDashboardUrl('https://api.zed.com/v1')).toBe('https://zed.com');
  });

  test('api-<env> maps to subdomain: api-dev.zed.com → dev.zed.com', () => {
    expect(webDashboardUrl('https://api-dev.zed.com')).toBe('https://dev.zed.com');
  });

  test('<env>-api maps to subdomain: dev-api.zed.com → dev.zed.com', () => {
    expect(webDashboardUrl('https://dev-api.zed.com/v1')).toBe('https://dev.zed.com');
  });

  test('local self-host: api :8008 → dashboard :3000', () => {
    expect(webDashboardUrl('http://localhost:8008')).toBe('http://localhost:3000');
  });

  test('unparseable input falls back to zed.com', () => {
    expect(webDashboardUrl('not a url')).toBe('https://zed.com');
  });
});

describe('webDashboardUrl — authoritative env wins over derivation', () => {
  test('ZED_FRONTEND_URL beats the api host', () => {
    process.env.ZED_FRONTEND_URL = 'https://zed.com/';
    expect(webDashboardUrl('https://api-prod.zed.com/v1')).toBe('https://zed.com');
  });

  test('ZED_DASHBOARD_URL is honored as a legacy override', () => {
    process.env.ZED_DASHBOARD_URL = 'http://localhost:3001';
    expect(webDashboardUrl('http://localhost:8008')).toBe('http://localhost:3001');
  });

  test('ZED_FRONTEND_URL from agent-env.sh beats API host when shell did not source it', () => {
    const dir = mkdtempSync(join(tmpdir(), 'zed-cli-agent-env-'));
    try {
      const envFile = join(dir, 'agent-env.sh');
      writeFileSync(envFile, "export ZED_FRONTEND_URL='https://dev.zed.com/'\n");
      process.env.BASH_ENV = envFile;
      delete process.env.ZED_DISABLE_SANDBOX_ENV_FILE;

      expect(webDashboardUrl('https://dev-api.zed.com/v1')).toBe('https://dev.zed.com');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('projectWebUrl / sessionWebUrl', () => {
  test('prefers the server-provided dashboard_url', () => {
    expect(
      projectWebUrl('https://api-prod.zed.com/v1', 'p1', 'https://zed.com/projects/p1'),
    ).toBe('https://zed.com/projects/p1');
  });

  test('without dashboard_url, derived host still never leaks api-prod', () => {
    expect(projectWebUrl('https://api-prod.zed.com/v1', 'p1')).toBe(
      'https://zed.com/projects/p1',
    );
  });

  test('session url is built on the project url', () => {
    expect(sessionWebUrl('https://api-prod.zed.com/v1', 'p1', 's1')).toBe(
      'https://zed.com/projects/p1/sessions/s1',
    );
  });
});
