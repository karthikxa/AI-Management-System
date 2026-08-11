import { describe, expect, test } from 'bun:test';
import { buildTunnelConnectCommand } from './tunnel-connect-command';

describe('buildTunnelConnectCommand', () => {
  test('keeps absolute API URLs and appends the tunnel root', () => {
    expect(
      buildTunnelConnectCommand({
        backendUrl: 'https://dev-api.zed.com/v1/',
        origin: 'https://dev.zed.com',
      }),
    ).toBe(
      'npx --yes @zed/agent-tunnel@latest connect --api-url https://dev-api.zed.com/v1/tunnel',
    );
  });

  test('resolves root-relative API URLs against the browser origin', () => {
    expect(
      buildTunnelConnectCommand({
        backendUrl: '/v1',
        origin: 'https://dev.zed.com',
      }),
    ).toBe(
      'npx --yes @zed/agent-tunnel@latest connect --api-url https://dev.zed.com/v1/tunnel',
    );
  });
});
