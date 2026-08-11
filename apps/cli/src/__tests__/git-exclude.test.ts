import { expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

import { appendGitExcludeEntries } from '../git-exclude.ts';

test('repository-local excludes are appended once without replacing existing content', () => {
  const repo = mkdtempSync(resolve(tmpdir(), 'zed-git-exclude-'));
  spawnSync('git', ['init', '-b', 'main'], { cwd: repo });
  const excludePath = resolve(repo, '.git', 'info', 'exclude');
  writeFileSync(excludePath, '# user entry\n/custom\n');

  appendGitExcludeEntries(repo, ['/.zed/link.json'], 'Zed local project binding');
  appendGitExcludeEntries(repo, ['/.zed/link.json'], 'Zed local project binding');

  expect(readFileSync(excludePath, 'utf8')).toBe(
    '# user entry\n/custom\n# Zed local project binding\n/.zed/link.json\n',
  );
});
