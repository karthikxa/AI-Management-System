import { afterEach, describe, expect, test } from 'bun:test';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as tar from 'tar';
import { archiveAppDirectory, loadManifestAppDefaults, readAppArchive } from './apps';

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe('Zed Apps archive packaging', () => {
  test('reads a prebuilt archive through one checked file handle', async () => {
    const root = await mkdtemp(join(tmpdir(), 'zed-app-archive-test-'));
    temporaryRoots.push(root);
    const archivePath = join(root, 'app.tar.gz');
    const expected = new Uint8Array([31, 139, 8, 0]);
    await writeFile(archivePath, expected);

    expect(await readAppArchive(archivePath)).toEqual(expected);
    await expect(readAppArchive(root)).rejects.toThrow('regular file');
  });

  test('applies project ignore files and mandatory secret/control exclusions', async () => {
    const root = await mkdtemp(join(tmpdir(), 'zed-app-pack-test-'));
    temporaryRoots.push(root);
    await mkdir(join(root, '.git'), { recursive: true });
    await mkdir(join(root, '.zed'), { recursive: true });
    await mkdir(join(root, 'nested'), { recursive: true });
    await writeFile(join(root, 'index.html'), 'hello');
    await writeFile(join(root, 'debug.log'), 'ignored');
    await writeFile(join(root, 'keep.tmp'), 'ignored by dockerignore');
    await writeFile(join(root, 'private.txt'), 'ignored by zedignore');
    await writeFile(join(root, '.env.production'), 'SECRET=never');
    await writeFile(join(root, 'nested', '.env.local'), 'SECRET=never');
    await writeFile(join(root, '.git', 'config'), 'credential');
    await writeFile(join(root, '.zed', 'link.json'), '{}');
    await writeFile(join(root, '.gitignore'), '*.log\n');
    await writeFile(join(root, '.dockerignore'), '*.tmp\n');
    await writeFile(join(root, '.zedignore'), 'private.txt\n');

    const archived = await archiveAppDirectory(root, false);
    const archivePath = join(root, 'inspect.tar.gz');
    await writeFile(archivePath, archived.bytes);
    const entries: string[] = [];
    await tar.t({ file: archivePath, onentry: (entry) => entries.push(entry.path.replace(/^\.\//, '')) });
    await archived.cleanup();

    expect(entries).toContain('index.html');
    expect(entries).not.toContain('debug.log');
    expect(entries).not.toContain('keep.tmp');
    expect(entries).not.toContain('private.txt');
    expect(entries.some((entry) => entry.includes('.env'))).toBe(false);
    expect(entries.some((entry) => entry.startsWith('.git/'))).toBe(false);
    expect(entries.some((entry) => entry.startsWith('.zed/'))).toBe(false);
  });

  test('loads one provider-neutral v2 App block relative to its manifest', async () => {
    const root = await mkdtemp(join(tmpdir(), 'zed-app-manifest-test-'));
    temporaryRoots.push(root);
    await writeFile(join(root, 'zed.yaml'), [
      'zed_version: 2',
      'default_agent: main',
      'agents:',
      '  main: {}',
      'apps:',
      '  storefront:',
      '    path: web',
      '    type: bundle',
      '    output_dir: dist',
      '    env:',
      '      NODE_ENVIRONMENT: production',
      '    secrets:',
      '      DATABASE_URL: database-primary',
      '',
    ].join('\n'));

    expect(loadManifestAppDefaults(root, undefined, true)).toMatchObject({
      name: 'storefront',
      root,
      block: {
        path: 'web',
        type: 'bundle',
        output_dir: 'dist',
        env: { NODE_ENVIRONMENT: 'production' },
        secrets: { DATABASE_URL: 'database-primary' },
      },
    });
  });
});
