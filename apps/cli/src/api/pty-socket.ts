/**
 * Open a PTY WebSocket with an explicit User-Agent.
 *
 * Bun's WebSocket client does not send User-Agent by default, and Cloudflare
 * rejects that handshake before it reaches the Zed API. This is a Bun
 * runtime workaround, not Zed transport: the URL (including its `?token=`
 * auth, which a WebSocket cannot send as a header) is resolved by the SDK's
 * `getZedPtyWebSocketUrl`.
 */
export function openZedPtyWebSocket(url: string): WebSocket {
  const version = process.env.ZED_CLI_VERSION ?? 'dev';
  const BunWebSocket = WebSocket as unknown as new (
    url: string | URL,
    options?: Bun.WebSocketOptions,
  ) => WebSocket;
  return new BunWebSocket(url, {
    headers: { 'User-Agent': `zed-cli/${version}` },
  });
}
