import { expect, test } from 'bun:test';
import * as master from './zed-master';
import type { ZedProject as PlatformProject } from '../rest/projects-client/projects';

test('the daemon project is exported as ZedMasterProject', () => {
  const project: master.ZedMasterProject = {
    id: 'p1',
    name: 'demo',
    path: '/work/demo',
    description: '',
    created_at: '2026-07-10T00:00:00Z',
    opencode_id: null,
  };
  expect(project.id).toBe('p1');
});

test('the deprecated ZedProject alias still resolves to the daemon shape', () => {
  // Back-compat: `@zed/sdk/opencode-client` consumers keep compiling.
  const legacy: master.ZedProject = {
    id: 'p1',
    name: 'demo',
    path: '/work/demo',
    description: '',
    created_at: '2026-07-10T00:00:00Z',
    opencode_id: null,
  };
  expect(legacy.path).toBe('/work/demo');
});

test('the platform project is a DIFFERENT shape and keeps its name', () => {
  const platform: PlatformProject = {
    project_id: 'proj_1',
    account_id: 'acct_1',
    name: 'demo',
    repo_url: 'https://example.test/r.git',
    default_branch: 'main',
    manifest_path: 'zed.yaml',
    status: 'active',
    metadata: {},
    last_opened_at: null,
    created_at: '2026-07-10T00:00:00Z',
    updated_at: '2026-07-10T00:00:00Z',
  };
  expect(platform.project_id).toBe('proj_1');
});
