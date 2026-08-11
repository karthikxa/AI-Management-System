import { describe, expect, test } from 'bun:test';

import { publicGatewayBaseUrl } from './public-url';

describe('publicGatewayBaseUrl', () => {
  test('derives the public origin from the configured base url', () => {
    expect(publicGatewayBaseUrl('https://gateway-dev.zed.com/v1/llm')).toBe(
      'https://gateway-dev.zed.com',
    );
    expect(publicGatewayBaseUrl('https://gateway.zed.com/v1/llm')).toBe(
      'https://gateway.zed.com',
    );
  });

  test('returns null when unset or malformed', () => {
    expect(publicGatewayBaseUrl(undefined)).toBeNull();
    expect(publicGatewayBaseUrl(null)).toBeNull();
    expect(publicGatewayBaseUrl('')).toBeNull();
    expect(publicGatewayBaseUrl('not a url')).toBeNull();
  });
});
