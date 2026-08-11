import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

export function appdBinaryPath(): string {
  return process.env.ZED_APPD_BIN_PATH
    || resolve(REPO_ROOT, 'apps/zed-app-runtime/dist/zed-appd-linux-amd64');
}

export function appCaddyBinaryPath(): string {
  return process.env.ZED_APP_CADDY_BIN_PATH
    || resolve(REPO_ROOT, 'apps/zed-app-runtime/dist/caddy-linux-amd64');
}

type AppRuntimeArtifactDigestOptions = {
  repoRoot?: string;
  appdPath?: string;
  caddyPath?: string;
};

/** Identify the exact supervisor artifacts layered into new App images. */
export function appRuntimeArtifactDigest(
  options: AppRuntimeArtifactDigestOptions = {},
): string {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const binaryPaths = [
    options.appdPath ?? appdBinaryPath(),
    options.caddyPath ?? appCaddyBinaryPath(),
  ];
  const paths = binaryPaths.every(existsSync)
    ? binaryPaths
    : [
        resolve(repoRoot, 'apps/zed-app-runtime/main.go'),
        resolve(repoRoot, 'apps/zed-app-runtime/go.mod'),
        resolve(repoRoot, 'apps/zed-app-runtime/caddy/main.go'),
        resolve(repoRoot, 'apps/zed-app-runtime/caddy/go.mod'),
        resolve(repoRoot, 'apps/zed-app-runtime/caddy/go.sum'),
      ];
  const hash = createHash('sha256');
  for (const path of paths) {
    hash.update(path.slice(repoRoot.length));
    hash.update('\0');
    hash.update(readFileSync(path));
    hash.update('\0');
  }
  return hash.digest('hex');
}
