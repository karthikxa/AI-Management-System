/**
 * 24 — triggers (cron / event automations): list what the project has.
 * Read-only — create/fire/remove mutate project automation, run those
 * deliberately.
 *
 * Run (from packages/sdk):  bun run playground/triggers/24-triggers.ts [projectId]
 */
import { makeZed, pickProjectId, run } from "../_shared";

run("triggers", async () => {
  const zed = makeZed();
  const projectId = await pickProjectId(zed, process.argv[2]);

  const triggers = await zed.project(projectId).triggers.list();
  console.log(`✓ triggers.list(): ${JSON.stringify(triggers).slice(0, 400)}…`);
});
