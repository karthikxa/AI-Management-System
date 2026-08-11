import { describe, expect, test } from 'bun:test';
import { filterSkills, skillScope } from './skill-scope';

const skill = (name: string, description: string | null = null) => ({
  name,
  path: `.opencode/skill/${name}/SKILL.md`,
  description,
});

describe('skillScope', () => {
  test('zed-* skills are platform runtime', () => {
    expect(skillScope('zed-cli')).toBe('zed');
    expect(skillScope('zed-presentation')).toBe('zed');
  });
  test('everything else belongs to the project', () => {
    expect(skillScope('podcast')).toBe('project');
    expect(skillScope('my-zed-thing')).toBe('project');
  });
});

describe('filterSkills', () => {
  const all = [skill('zed-cli'), skill('podcast', 'Make an episode'), skill('dataviz')];

  test('scope null returns everything', () => {
    expect(filterSkills(all, { scope: null, query: '' })).toHaveLength(3);
  });
  test('scope narrows to one family', () => {
    expect(filterSkills(all, { scope: 'zed', query: '' }).map((s) => s.name)).toEqual([
      'zed-cli',
    ]);
  });
  test('query matches name and description, case-insensitively', () => {
    expect(filterSkills(all, { scope: null, query: 'POD' }).map((s) => s.name)).toEqual(['podcast']);
    expect(filterSkills(all, { scope: null, query: 'episode' }).map((s) => s.name)).toEqual([
      'podcast',
    ]);
  });
  test('scope and query compose', () => {
    expect(filterSkills(all, { scope: 'project', query: 'zed' })).toHaveLength(0);
  });
});
