export function buildTunnelConnectCommand(backendUrl: string): string {
  const backend = backendUrl.replace(/\/+$/, '');
  return `npx --yes @zed/agent-tunnel@latest connect --api-url ${backend}/tunnel`;
}
