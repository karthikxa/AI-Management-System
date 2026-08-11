import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  activeAccount,
  clearDefaultProject,
  defaultProject,
  loadConfig,
  setActiveAccount,
  setDefaultProject,
} from '../api/config.ts';
import { resolveProjectId, saveLink } from '../project-link.ts';
import { renderContext, renderHostNotice } from '../host-notice.ts';
import { stripAnsi } from '../style.ts';

const ENV_KEYS = [
  'ZED_CLI_TOKEN',
  'ZED_TOKEN',
  'ZED_API_URL',
  'ZED_PROJECT_ID',
  'BASH_ENV',
  'ZED_DISABLE_SANDBOX_ENV_FILE',
  'ZED_CONFIG_FILE',
  'ZED_AUTH_FILE',
] as const;

let saved: Record<string, string | undefined>;
let tmp: string;
let originalCwd: string;

function writeConfig(hosts: Record<string, unknown>, active = 'test'): void {
  const file = join(tmp, 'config.json');
  writeFileSync(file, JSON.stringify({ active, hosts }, null, 2));
  process.env.ZED_CONFIG_FILE = file;
}

function loggedInHost(extra: Record<string, unknown> = {}) {
  return {
    url: 'https://api.test',
    token: 'tok_test',
    user_id: 'user_1',
    user_email: 'user@example.test',
    account_id: 'account_1',
    logged_in_at: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

beforeEach(() => {
  saved = {};
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  process.env.ZED_DISABLE_SANDBOX_ENV_FILE = '1';
  originalCwd = process.cwd();
  tmp = mkdtempSync(join(tmpdir(), 'zed-acct-cfg-'));
});

afterEach(() => {
  process.chdir(originalCwd);
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
  rmSync(tmp, { recursive: true, force: true });
});

describe('config: account + default-project state', () => {
  test('old config without the new fields still loads (back-compat)', () => {
    writeConfig({ test: loggedInHost() });
    const config = loadConfig();
    expect(config.active).toBe('test');
    expect(config.hosts.test.account_id).toBe('account_1');
    expect(config.hosts.test.default_project).toBeUndefined();
    expect(activeAccount()).toEqual({ id: 'account_1', slug: 'account_', name: '' });
  });

  test('setActiveAccount persists display fields and round-trips', () => {
    writeConfig({ test: loggedInHost({ account_id: '' }) });
    setActiveAccount({ id: 'acc_zed', slug: 'zed', name: 'Zed' });
    expect(activeAccount()).toEqual({ id: 'acc_zed', slug: 'zed', name: 'Zed' });
    // Persisted to disk, not just in memory.
    const onDisk = JSON.parse(readFileSync(process.env.ZED_CONFIG_FILE!, 'utf8'));
    expect(onDisk.hosts.test.account_slug).toBe('zed');
    expect(onDisk.hosts.test.account_name).toBe('Zed');
  });

  test('setDefaultProject + defaultProject round-trip and clearDefaultProject removes it', () => {
    writeConfig({ test: loggedInHost() });
    setDefaultProject({ project_id: 'proj_a', account_id: 'account_1', name: 'Alpha' });
    expect(defaultProject()).toEqual({ project_id: 'proj_a', account_id: 'account_1', name: 'Alpha' });
    expect(clearDefaultProject()).toBe(true);
    expect(defaultProject()).toBeNull();
    expect(clearDefaultProject()).toBe(false);
  });

  test('switching to a different account drops a now-foreign default project', () => {
    writeConfig({
      test: loggedInHost({
        default_project: { project_id: 'proj_a', account_id: 'account_1', name: 'Alpha' },
      }),
    });
    expect(defaultProject()?.project_id).toBe('proj_a');
    setActiveAccount({ id: 'account_2', slug: 'two', name: 'Two' });
    expect(defaultProject()).toBeNull();
  });

  test('switching to the SAME account keeps the default project', () => {
    writeConfig({
      test: loggedInHost({
        default_project: { project_id: 'proj_a', account_id: 'account_1', name: 'Alpha' },
      }),
    });
    setActiveAccount({ id: 'account_1', slug: 'one', name: 'One' });
    expect(defaultProject()?.project_id).toBe('proj_a');
  });
});

describe('resolveProjectId fallback order', () => {
  test('falls back to the active host default project when no link / env', () => {
    writeConfig({
      test: loggedInHost({
        default_project: { project_id: 'proj_default', account_id: 'account_1' },
      }),
    });
    process.chdir(tmp); // linkless dir
    expect(resolveProjectId()).toBe('proj_default');
  });

  test('explicit arg and ZED_PROJECT_ID outrank the default', () => {
    writeConfig({
      test: loggedInHost({
        default_project: { project_id: 'proj_default', account_id: 'account_1' },
      }),
    });
    process.chdir(tmp);
    expect(resolveProjectId('explicit')).toBe('explicit');
    process.env.ZED_PROJECT_ID = 'env_proj';
    expect(resolveProjectId()).toBe('env_proj');
  });

  test('a directory link outranks the default project', () => {
    writeConfig({
      test: loggedInHost({
        default_project: { project_id: 'proj_default', account_id: 'account_1' },
      }),
    });
    mkdirSync(join(tmp, '.zed'), { recursive: true });
    process.chdir(tmp);
    saveLink(
      { project_id: 'proj_linked', account_id: 'account_1', linked_at: '2026-01-01T00:00:00.000Z' },
      tmp,
    );
    expect(existsSync(join(tmp, '.zed', 'link.json'))).toBe(true);
    expect(resolveProjectId()).toBe('proj_linked');
  });
});

describe('renderContext + host notice', () => {
  test('context block shows host, account, and default project', () => {
    writeConfig({
      test: loggedInHost({
        account_slug: 'zed',
        account_name: 'Zed',
        default_project: { project_id: 'proj_a', account_id: 'account_1', name: 'Alpha' },
      }),
    });
    process.chdir(tmp);
    const out = stripAnsi(renderContext());
    expect(out).toContain('host');
    expect(out).toContain('test');
    expect(out).toContain('account');
    expect(out).toContain('Zed');
    expect(out).toContain('project');
    expect(out).toContain('Alpha');
    expect(out).toContain('(default)');
    // A bound default project points at the switch verb.
    expect(out).toContain('switch with `zed projects use`');
  });

  test('a directory-linked project does not show the default-project switch hint', () => {
    writeConfig({
      test: loggedInHost({
        account_slug: 'zed',
        account_name: 'Zed',
        default_project: { project_id: 'proj_a', account_id: 'account_1', name: 'Alpha' },
      }),
    });
    mkdirSync(join(tmp, '.zed'), { recursive: true });
    saveLink(
      { project_id: 'proj_linked', account_id: 'account_1', linked_at: '2026-01-01T00:00:00.000Z' },
      tmp,
    );
    process.chdir(tmp);
    const out = stripAnsi(renderContext());
    expect(out).toContain('(linked)');
    expect(out).not.toContain('switch with');
  });

  test('context block nudges when account / default project are unset', () => {
    writeConfig({ test: loggedInHost({ account_id: '' }) });
    process.chdir(tmp);
    const out = stripAnsi(renderContext());
    expect(out).toContain('zed accounts use');
    expect(out).toContain('zed projects use');
  });

  test('breadcrumb renders the full host -> account -> project -> session path when signed in', () => {
    writeConfig({
      test: loggedInHost({
        account_slug: 'zed',
        account_name: 'Zed',
        default_project: { project_id: 'proj_a', account_id: 'account_1', name: 'Alpha' },
      }),
    });
    process.chdir(tmp);
    const out = stripAnsi(renderContext());
    // Signed-in host row carries the ● glyph + the navigation verb.
    expect(out).toMatch(/●\s+host/);
    expect(out).toContain('▸ zed hosts use');
    // Every level is present, top-down.
    expect(out).toContain('account');
    expect(out).toContain('project');
    expect(out).toContain('session');
    // The session leaf is empty (no persisted active session) and offers a verb.
    expect(out).toContain('open one: zed chat');
  });

  test('breadcrumb hides lower levels + points at login when signed out of the active host', () => {
    writeConfig({
      test: {
        url: 'https://api.test',
        token: '',
        user_id: '',
        user_email: '',
        account_id: '',
        logged_in_at: '',
      },
    });
    process.chdir(tmp);
    const out = stripAnsi(renderContext());
    expect(out).toMatch(/○\s+host/);
    expect(out).toContain('not logged in');
    expect(out).toContain('→ zed hosts login');
    // Can't have an account/project without a signed-in host.
    expect(out).not.toContain('account');
    expect(out).not.toContain('session');
  });

  test('breadcrumb marks an unmet account gap as actionable', () => {
    writeConfig({ test: loggedInHost({ account_id: '' }) });
    process.chdir(tmp);
    const out = stripAnsi(renderContext());
    expect(out).toMatch(/⚠\s+account/);
    expect(out).toContain('→ zed accounts use');
  });

  test('subcommand host notice appends account + default project', () => {
    writeConfig({
      test: loggedInHost({
        account_slug: 'zed',
        account_name: 'Zed',
        default_project: { project_id: 'proj_a', account_id: 'account_1', name: 'Alpha' },
      }),
    });
    process.chdir(tmp);
    const notice = stripAnsi(renderHostNotice(['whoami']) ?? '');
    expect(notice).toContain('host test');
    expect(notice).toContain('account Zed');
    expect(notice).toContain('project Alpha');
    expect(notice).toContain('(default)');
  });

  test('a directory link displays its own host instead of the globally active host', () => {
    writeConfig({
      cloud: loggedInHost({ url: 'https://api.zed.com' }),
      customdev: loggedInHost({ url: 'https://dev-api.zed.com' }),
    });
    mkdirSync(join(tmp, '.zed'), { recursive: true });
    saveLink(
      {
        project_id: 'proj_linked',
        account_id: 'account_1',
        host: 'customdev',
        host_url: 'https://dev-api.zed.com',
        linked_at: '2026-01-01T00:00:00.000Z',
      },
      tmp,
    );
    process.chdir(tmp);

    const notice = stripAnsi(renderHostNotice(['env', 'pull']) ?? '');
    expect(notice).toContain('host customdev');
    expect(notice).toContain('https://dev-api.zed.com');
    expect(notice).toContain('project proj_lin');
    expect(notice).not.toContain('host cloud');
  });

  test('--host override does not claim the active account / project', () => {
    writeConfig({
      test: loggedInHost({
        account_slug: 'zed',
        account_name: 'Zed',
        default_project: { project_id: 'proj_a', account_id: 'account_1', name: 'Alpha' },
      }),
    });
    process.chdir(tmp);
    const notice = stripAnsi(renderHostNotice(['whoami', '--host', 'cloud']) ?? '');
    expect(notice).toContain('host cloud');
    expect(notice).not.toContain('account Zed');
    expect(notice).not.toContain('project Alpha');
  });
});
