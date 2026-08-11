import { describe, expect, test } from 'bun:test';

import {
  ZED_CLI_DEV_INSTALL_COMMAND,
  ZED_CLI_INSTALL_COMMAND,
  getDeploymentCliInstallCommand,
  getZedCliInstallCommand,
} from './zed-cli';

describe('getZedCliInstallCommand', () => {
  test('picks the dev channel for a dev version', () => {
    expect(getZedCliInstallCommand('1.2.3-dev.4')).toBe(ZED_CLI_DEV_INSTALL_COMMAND);
    expect(getZedCliInstallCommand('dev')).toBe(ZED_CLI_DEV_INSTALL_COMMAND);
  });

  test('picks the stable channel otherwise', () => {
    expect(getZedCliInstallCommand('1.2.3')).toBe(ZED_CLI_INSTALL_COMMAND);
    expect(getZedCliInstallCommand(undefined)).toBe(ZED_CLI_INSTALL_COMMAND);
  });
});

describe('getDeploymentCliInstallCommand', () => {
  test('targets the deployment origin', () => {
    expect(getDeploymentCliInstallCommand(undefined, 'http://10.0.0.5:3000')).toBe(
      'curl -fsSL http://10.0.0.5:3000/install | bash',
    );
    expect(getDeploymentCliInstallCommand('1.2.3-dev.4', 'http://10.0.0.5:3000')).toBe(
      'curl -fsSL http://10.0.0.5:3000/install | ZED_CHANNEL=dev bash',
    );
  });

  test('uses only the origin from an absolute deployment URL', () => {
    expect(getDeploymentCliInstallCommand(undefined, 'https://self-host.example/base/')).toBe(
      'curl -fsSL https://self-host.example/install | bash',
    );
  });

  test('on zed.com the rendered command is unchanged', () => {
    expect(getDeploymentCliInstallCommand('1.2.3', 'https://zed.com')).toBe(
      ZED_CLI_INSTALL_COMMAND,
    );
    expect(getDeploymentCliInstallCommand('1.2.3-dev.4', 'https://zed.com')).toBe(
      ZED_CLI_DEV_INSTALL_COMMAND,
    );
  });

  test('falls back to the canonical URL when there is no origin (SSR)', () => {
    expect(getDeploymentCliInstallCommand(undefined, '')).toBe(ZED_CLI_INSTALL_COMMAND);
    expect(getDeploymentCliInstallCommand(undefined, 'not a URL')).toBe(
      ZED_CLI_INSTALL_COMMAND,
    );
  });
});
