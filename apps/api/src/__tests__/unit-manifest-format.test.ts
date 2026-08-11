// Runtime manifest parse/serialize is dual-format: the format + resolved path
// ride on the ParsedManifest so a read→mutate→commit round-trip writes back to
// the same file in the same format. (Read RESOLUTION is exercised against a live
// git mirror in ke2e; here we cover the pure parse/serialize dispatch.)
import { describe, expect, test } from 'bun:test';
import { parseManifestString, serializeManifest } from '../projects/triggers';

const YAML = `zed_version: 1
project:
  name: demo
triggers:
  - slug: nightly
    type: cron
    cron: "0 9 * * *"
    prompt: run it
`;

// Legacy v1 manifest format (zed.toml).
const LEGACY_TOML = `zed_version = 1
[project]
name = "demo"
`;

describe('parseManifestString / serializeManifest dual-format', () => {
  test('parses yaml, tags format + path, round-trips back to yaml', () => {
    const m = parseManifestString(YAML, 'yaml', 'zed.yaml');
    expect(m.format).toBe('yaml');
    expect(m.path).toBe('zed.yaml');
    expect(m.schemaVersion).toBe(1);
    expect((m.raw.project as { name: string }).name).toBe('demo');

    const out = serializeManifest(m);
    expect(out.trimStart().startsWith('zed_version')).toBe(true);
    // A yaml manifest serializes to yaml, never toml table headers.
    expect(out).toContain('project:');
    expect(out).not.toContain('[project]');
    // Serialized text re-parses to the same object.
    expect(parseManifestString(out, 'yaml', 'zed.yaml').raw).toEqual(m.raw);
  });

  test('default format is legacy v1 toml — backward compatible', () => {
    const m = parseManifestString(LEGACY_TOML);
    expect(m.format).toBe('toml');
    expect(m.path).toBe('zed.toml');
    const out = serializeManifest(m);
    expect(out).toContain('[project]');
    expect(out).not.toContain('project:');
  });

  test('a mutation survives the yaml round-trip', () => {
    const m = parseManifestString(YAML, 'yaml', 'zed.yaml');
    (m.raw.triggers as Array<Record<string, unknown>>).push({
      slug: 'weekly',
      type: 'cron',
      cron: '0 0 * * 0',
      prompt: 'weekly run',
    });
    const back = parseManifestString(serializeManifest(m), 'yaml', 'zed.yaml');
    expect((back.raw.triggers as unknown[]).length).toBe(2);
    expect((back.raw.triggers as Array<{ slug: string }>)[1].slug).toBe('weekly');
  });

  test('rejects an unsupported schema version regardless of format', () => {
    expect(() => parseManifestString('zed_version: 99\n', 'yaml', 'zed.yaml')).toThrow(
      /schema version 99/,
    );
  });
});
