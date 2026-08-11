import { describe, expect, test } from 'bun:test';

import { isZedAppUrl } from './zed-app-url';

describe('isZedAppUrl', () => {
  test('keeps every Zed Apps environment on its direct origin', () => {
    expect(isZedAppUrl('https://dev-store-aaaaaaaaaaaaaaaa.apps.zed.com/')).toBe(true);
    expect(isZedAppUrl('https://staging-demo-bbbbbbbbbbbbbbbb.apps.zed.com/path?q=1')).toBe(true);
    expect(isZedAppUrl('http://aaaaaaaaaaaaaaaa.apps.localhost:8008/')).toBe(true);
  });

  test('does not bypass the sandbox web proxy for unrelated websites', () => {
    expect(isZedAppUrl('https://example.com/apps.zed.com')).toBe(false);
    expect(isZedAppUrl('https://apps.zed.com.evil.test/')).toBe(false);
    expect(isZedAppUrl('javascript:alert(1)')).toBe(false);
  });
});
