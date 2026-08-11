import { describe, expect, test } from 'bun:test';
import { inferFrontendUrl } from './frontend-url';

describe('inferFrontendUrl', () => {
  test('maps exact Zed API hosts', () => {
    expect(inferFrontendUrl('https://api.zed.com/v1')).toBe('https://zed.com');
    expect(inferFrontendUrl('https://staging-api.zed.com/v1')).toBe('https://staging.zed.com');
  });

  test.each([
    'https://api.zed.com.attacker.example/v1',
    'https://attacker.example/api.zed.com',
    'not a URL',
  ])('does not trust a substring match: %s', (backendUrl) => {
    expect(inferFrontendUrl(backendUrl)).toBeNull();
  });
});
