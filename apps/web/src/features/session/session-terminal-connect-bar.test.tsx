import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { ZED_CLI_INSTALL_COMMAND } from '@/lib/zed-cli';
import { SessionTerminalConnectBar } from './session-terminal-connect-bar';

describe('SessionTerminalConnectBar', () => {
  test('collapsed bar surfaces the install command — the one command that always works', () => {
    const html = renderToStaticMarkup(
      <SessionTerminalConnectBar projectSessionId="ps-123" />,
    );
    expect(html).toContain(ZED_CLI_INSTALL_COMMAND);
    // The session-specific connect command lives in the expanded steps, not
    // the collapsed teaser (collapsed content renders nothing else here).
    expect(html).not.toContain('zed sessions connect ps-123');
  });
});
