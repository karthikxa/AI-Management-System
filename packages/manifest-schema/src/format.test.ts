import { describe, expect, test } from 'bun:test';
import {
  manifestCandidatePaths,
  manifestFormatForPath,
  parseManifestText,
  serializeManifestObject,
} from './format';
import { validateManifest } from './index';

describe('manifestCandidatePaths', () => {
  test('default → yaml, yml, toml in priority order', () => {
    expect(manifestCandidatePaths(undefined)).toEqual([
      { path: 'zed.yaml', format: 'yaml' },
      { path: 'zed.yml', format: 'yaml' },
      { path: 'zed.toml', format: 'toml' },
    ]);
    expect(manifestCandidatePaths('zed.toml')).toEqual(manifestCandidatePaths(undefined));
    expect(manifestCandidatePaths('')).toEqual(manifestCandidatePaths(undefined));
  });

  test('a custom path resolves its yaml/toml siblings (dir preserved)', () => {
    expect(manifestCandidatePaths('config/zed.toml')).toEqual([
      { path: 'config/zed.yaml', format: 'yaml' },
      { path: 'config/zed.yml', format: 'yaml' },
      { path: 'config/zed.toml', format: 'toml' },
    ]);
  });

  test('an explicit .yaml path still prefers yaml first', () => {
    expect(manifestCandidatePaths('zed.yaml')[0]).toEqual({
      path: 'zed.yaml',
      format: 'yaml',
    });
  });
});

describe('manifestFormatForPath', () => {
  test('detects yaml from .yaml/.yml, toml otherwise', () => {
    expect(manifestFormatForPath('zed.yaml')).toBe('yaml');
    expect(manifestFormatForPath('zed.yml')).toBe('yaml');
    expect(manifestFormatForPath('zed.toml')).toBe('toml');
    expect(manifestFormatForPath('anything')).toBe('toml');
  });
});

describe('parse/serialize round-trip', () => {
  const obj = {
    zed_version: 1,
    project: { name: 'demo' },
    triggers: [{ slug: 'nightly', type: 'cron', cron: '0 9 * * *', prompt: 'line one\nline two' }],
    agents: [{ name: 'pr-bot', connectors: ['github'], zed_cli: ['project.gitops.push'] }],
  };

  for (const format of ['toml', 'yaml'] as const) {
    test(`${format}: object → text → object is stable`, () => {
      const text = serializeManifestObject(obj, format);
      expect(typeof text).toBe('string');
      const back = parseManifestText(text, format);
      expect(back).toEqual(obj);
      // zed_version emitted first.
      expect(text.trimStart().startsWith('zed_version')).toBe(true);
    });
  }

  test('empty yaml doc normalizes to {} (validator then reports missing version)', () => {
    expect(parseManifestText('', 'yaml')).toEqual({});
    expect(parseManifestText('# just a comment\n', 'yaml')).toEqual({});
  });
});

describe('validateManifest dual-format', () => {
  const yaml = `zed_version: 1
project:
  name: demo
triggers:
  - slug: nightly
    type: cron
    cron: "0 9 * * *"
    prompt: do the thing
`;
  const toml = `zed_version = 1
[project]
name = "demo"
[[triggers]]
slug = "nightly"
type = "cron"
cron = "0 9 * * *"
prompt = "do the thing"
`;

  test('a valid yaml manifest validates like its toml twin', () => {
    const y = validateManifest(yaml, 'yaml');
    const t = validateManifest(toml, 'toml');
    expect(y.valid).toBe(true);
    expect(t.valid).toBe(true);
    expect(y.parsed).toEqual(t.parsed as Record<string, unknown>);
  });

  test('malformed yaml yields a clean error issue, not a throw', () => {
    const res = validateManifest('zed_version: 1\n  bad: : :\n', 'yaml');
    expect(res.valid).toBe(false);
    expect(res.parsed).toBeNull();
    expect(res.issues[0]?.severity).toBe('error');
  });

  test('a string with no format arg still parses as toml (backward compatible)', () => {
    expect(validateManifest(toml).valid).toBe(true);
  });
});
