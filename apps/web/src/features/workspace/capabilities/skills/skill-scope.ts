import type { ProjectConfigSummary } from '@zed/sdk';

export type SkillScope = 'project' | 'zed';
type Skill = ProjectConfigSummary['skills'][number];

/**
 * The `zed-*` family is platform runtime, force-injected into every session
 * at boot. It reads the same in every project and is not meaningfully editable
 * here, so it filters separately from the project's own skills.
 */
export function skillScope(name: string): SkillScope {
  return name.startsWith('zed-') ? 'zed' : 'project';
}

export function filterSkills(
  skills: readonly Skill[],
  opts: { scope: SkillScope | null; query: string },
): Skill[] {
  const q = opts.query.trim().toLowerCase();
  return skills.filter((s) => {
    if (opts.scope && skillScope(s.name) !== opts.scope) return false;
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q)
    );
  });
}
