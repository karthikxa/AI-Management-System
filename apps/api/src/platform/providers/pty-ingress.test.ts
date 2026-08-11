import { describe, expect, test } from 'bun:test';

import { classifyPtyWebSocketPath } from './pty-ingress';

describe('classifyPtyWebSocketPath', () => {
  test('distinguishes OpenCode and Zed-native PTY websocket paths', () => {
    expect(classifyPtyWebSocketPath('/pty/pty_test/connect')).toBe('opencode');
    expect(classifyPtyWebSocketPath('/zed/pty/kpty_test/connect')).toBe('zed');
  });

  test('does not classify unrelated daemon or preview paths as PTY', () => {
    expect(classifyPtyWebSocketPath('/zed/health')).toBeNull();
    expect(classifyPtyWebSocketPath('/preview/pty/example')).toBeNull();
    expect(classifyPtyWebSocketPath()).toBeNull();
  });
});
