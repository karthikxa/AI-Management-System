import { describe, expect, test } from 'bun:test';

import type { ZedProject } from '@zed/sdk';
import { groupProjectsByRepository } from './project-repository-groups';

function project(projectId: string, repoUrl: string, branch: string): ZedProject {
  return {
    project_id: projectId,
    account_id: 'account-1',
    name: projectId,
    repo_url: repoUrl,
    default_branch: branch,
    manifest_path: 'zed.yaml',
    status: 'active',
    metadata: {},
    last_opened_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}

describe('groupProjectsByRepository', () => {
  test('groups equivalent GitHub URLs while preserving isolated projects and branches', () => {
    const groups = groupProjectsByRepository([
      project('API dev', 'https://github.com/Zed/suna.git', 'dev'),
      project('Web dev', 'git@github.com:zed/suna.git', 'dev'),
      project('Production', 'https://github.com/zed/suna/', 'main'),
      project('Company', 'https://github.com/zed/company.git', 'main'),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      key: 'github.com/zed/suna',
      label: 'Zed/suna',
    });
    expect(groups[0]?.projects.map((item) => [item.name, item.default_branch])).toEqual([
      ['API dev', 'dev'],
      ['Web dev', 'dev'],
      ['Production', 'main'],
    ]);
    expect(groups[1]?.label).toBe('zed/company');
  });
});
