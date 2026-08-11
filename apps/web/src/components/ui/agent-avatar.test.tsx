import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { AgentAvatar } from './agent-avatar';

describe('AgentAvatar', () => {
  test('renders the Zed symbol for the default agent', () => {
    const html = renderToStaticMarkup(<AgentAvatar isDefault size={22} />);
    expect(html).toContain('zed-symbol.svg');
  });

  test('falls back to the robot icon otherwise', () => {
    const html = renderToStaticMarkup(<AgentAvatar size={22} />);
    expect(html).toContain('<svg');
    expect(html).not.toContain('zed-symbol.svg');
  });
});
