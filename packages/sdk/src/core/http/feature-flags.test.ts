import { afterEach, describe, expect, test } from 'bun:test';

import { configureZed } from './config';
import { featureFlags, parseFlagOverride } from './feature-flags';

const ENV_KEYS = [
  'NEXT_PUBLIC_DISABLE_MOBILE_ADVERTISING',
  'NEXT_PUBLIC_ENABLE_DINO_GAME',
  'NEXT_PUBLIC_ENABLE_PROJECTS',
] as const;

const originalEnv: Record<string, string | undefined> = {};
for (const key of ENV_KEYS) originalEnv[key] = process.env[key];

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
  configureZed({ backendUrl: '', getToken: async () => null });
});

describe('featureFlags defaults', () => {
  test('fall back to the documented defaults with no env and no config', () => {
    for (const key of ENV_KEYS) delete process.env[key];
    configureZed({ backendUrl: '', getToken: async () => null });

    expect(featureFlags.disableMobileAdvertising).toBe(false);
    expect(featureFlags.enableDinoGame).toBe(false);
    expect(featureFlags.enableProjects).toBe(false);
    expect(featureFlags.enableAutoModel).toBe(false);
  });
});

describe('featureFlags NEXT_PUBLIC_* env fallback (back-compat)', () => {
  test('reads the legacy env var when no config override is set', () => {
    configureZed({ backendUrl: '', getToken: async () => null });
    process.env.NEXT_PUBLIC_ENABLE_PROJECTS = 'true';
    expect(featureFlags.enableProjects).toBe(true);

    process.env.NEXT_PUBLIC_ENABLE_PROJECTS = 'false';
    expect(featureFlags.enableProjects).toBe(false);
  });
});

describe('featureFlags configureZed override', () => {
  test('an explicit override wins over the env var', () => {
    process.env.NEXT_PUBLIC_ENABLE_PROJECTS = 'true';
    configureZed({
      backendUrl: '',
      getToken: async () => null,
      featureFlags: { enableProjects: false },
    });

    expect(featureFlags.enableProjects).toBe(false);
  });

  test('resolves on a host with no NEXT_PUBLIC_* env at all (portable path)', () => {
    delete process.env.NEXT_PUBLIC_DISABLE_MOBILE_ADVERTISING;
    configureZed({
      backendUrl: '',
      getToken: async () => null,
      featureFlags: { disableMobileAdvertising: true },
    });

    expect(featureFlags.disableMobileAdvertising).toBe(true);
  });

  test('an unset override key still falls back to env / default', () => {
    process.env.NEXT_PUBLIC_ENABLE_DINO_GAME = 'true';
    configureZed({
      backendUrl: '',
      getToken: async () => null,
      featureFlags: { enableProjects: true },
    });

    expect(featureFlags.enableDinoGame).toBe(true);
    expect(featureFlags.enableProjects).toBe(true);
  });

  test('parseFlagOverride maps recognized values and yields undefined otherwise', () => {
    expect(parseFlagOverride('true')).toBe(true);
    expect(parseFlagOverride('1')).toBe(true);
    expect(parseFlagOverride(' ON ')).toBe(true);
    expect(parseFlagOverride('false')).toBe(false);
    expect(parseFlagOverride('0')).toBe(false);
    expect(parseFlagOverride(undefined)).toBeUndefined();
    expect(parseFlagOverride('')).toBeUndefined();
    expect(parseFlagOverride('banana')).toBeUndefined();
  });

  test('a parseFlagOverride undefined override falls through to env/default', () => {
    process.env.NEXT_PUBLIC_ENABLE_PROJECTS = 'true';
    configureZed({
      backendUrl: '',
      getToken: async () => null,
      featureFlags: { enableProjects: parseFlagOverride(undefined) },
    });
    expect(featureFlags.enableProjects).toBe(true);
  });

  test('reflects a configureZed call made after this module was already imported', () => {
    delete process.env.NEXT_PUBLIC_ENABLE_PROJECTS;
    configureZed({ backendUrl: '', getToken: async () => null });
    expect(featureFlags.enableProjects).toBe(false);

    configureZed({
      backendUrl: '',
      getToken: async () => null,
      featureFlags: { enableProjects: true },
    });
    expect(featureFlags.enableProjects).toBe(true);
  });
});
