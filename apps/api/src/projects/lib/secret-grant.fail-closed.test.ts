import { beforeEach, describe, expect, mock, test } from 'bun:test';

const actualGit = await import('../git');

let readManifestFromRepoImpl: () => Promise<{ path: string; content: string } | null> = async () =>
  null;

mock.module('../git', () => ({
  ...actualGit,
  readManifestFromRepo: () => readManifestFromRepoImpl(),
}));

const { SecretGrantResolutionError, resolveSessionSecretGrant } = await import('./secret-grant');

const PROJECT = {
  projectId: 'p1',
  repoUrl: 'https://github.com/acme/repo',
  defaultBranch: 'main',
  manifestPath: 'zed.yaml',
};

const MANIFEST = [
  'zed_version: 2',
  'default_agent: zed',
  'agents:',
  '  zed:',
  '    secrets:',
  '      - STRIPE_KEY',
].join('\n');

beforeEach(() => {
  readManifestFromRepoImpl = async () => null;
});

describe('resolveSessionSecretGrant fails closed through the real manifest loader', () => {
  test('a git read failure refuses instead of synthesizing an all-secrets manifest', async () => {
    readManifestFromRepoImpl = async () => {
      throw new Error('git-proxy 429');
    };
    await expect(resolveSessionSecretGrant({ ...PROJECT, sessionAgent: 'zed' })).rejects.toThrow(
      SecretGrantResolutionError,
    );
  });

  test('a git read failure on a default-sentinel session also refuses', async () => {
    readManifestFromRepoImpl = async () => {
      throw new Error('mirror refresh failed');
    };
    await expect(
      resolveSessionSecretGrant({ ...PROJECT, sessionAgent: 'default' }),
    ).rejects.toThrow(SecretGrantResolutionError);
  });

  test('an unparseable manifest refuses rather than resolving default to unrestricted', async () => {
    readManifestFromRepoImpl = async () => ({
      path: 'zed.yaml',
      content: 'zed_version: 2\nagents:\n  - [unbalanced\n',
    });
    await expect(
      resolveSessionSecretGrant({ ...PROJECT, sessionAgent: 'default' }),
    ).rejects.toThrow(SecretGrantResolutionError);
  });

  test('a genuinely absent manifest is still the unrestricted back-compat path', async () => {
    readManifestFromRepoImpl = async () => null;
    await expect(resolveSessionSecretGrant({ ...PROJECT, sessionAgent: 'zed' })).resolves.toBe(
      'all',
    );
  });

  test('a readable manifest resolves its declared narrow grant', async () => {
    readManifestFromRepoImpl = async () => ({ path: 'zed.yaml', content: MANIFEST });
    await expect(
      resolveSessionSecretGrant({ ...PROJECT, sessionAgent: 'zed' }),
    ).resolves.toEqual(['STRIPE_KEY']);
  });

  test('the declared narrow grant is not widened for a default-sentinel session', async () => {
    readManifestFromRepoImpl = async () => ({ path: 'zed.yaml', content: MANIFEST });
    await expect(
      resolveSessionSecretGrant({ ...PROJECT, sessionAgent: 'default' }),
    ).resolves.toEqual(['STRIPE_KEY']);
  });
});
