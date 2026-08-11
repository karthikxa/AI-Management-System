/**
 * 08 — list the project's skills and read one SKILL.md straight from the repo.
 *
 * `readProjectFile` is a platform REST read (repo content) — no sandbox needed.
 *
 * Run (from packages/sdk):  bun run playground/skills/08-list-skills.ts [projectId]
 */
import { readProjectFile } from "../../src/index";
import { makeZed, pickProjectId, run } from "../_shared";

run("list-skills", async () => {
  const zed = makeZed();
  const projectId = await pickProjectId(zed, process.argv[2]);

  const detail = await zed.projects.detail(projectId);
  const skills = detail.config.skills;

  console.log(`✓ ${skills.length} skill(s):\n`);
  for (const skill of skills) {
    console.log(`  ${skill.name}`);
    console.log(`    path: ${skill.path}`);
    if (skill.description)
      console.log(`    desc: ${skill.description.slice(0, 100)}`);
    console.log("");
  }

  if (skills.length > 0) {
    const first = skills[0]!;
    const file = await readProjectFile(projectId, first.path);
    console.log(`✓ readProjectFile('${first.path}') — first 300 chars:\n`);
    console.log(file.content.slice(0, 300));
  }
});
