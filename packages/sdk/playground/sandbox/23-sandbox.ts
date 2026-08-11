/**
 * 23 — sandbox infrastructure: health, boot templates, live sandbox list,
 * and snapshot builds. All reads (rebuildSnapshot is deliberately skipped).
 *
 * Run (from packages/sdk):  bun run playground/sandbox/23-sandbox.ts [projectId]
 */
import { makeZed, pickProjectId, run } from "../_shared";

run("sandbox", async () => {
  const zed = makeZed();
  const projectId = await pickProjectId(zed, process.argv[2]);
  const project = zed.project(projectId);

  const health = await zed.projects.sandboxHealth(projectId);
  console.log(`✓ sandboxHealth(): ${JSON.stringify(health).slice(0, 250)}…`);

  const templates = await zed.projects.sandboxTemplates(projectId);
  console.log(
    `✓ sandboxTemplates(): ${JSON.stringify(templates).slice(0, 250)}…`,
  );

  const sandboxes = await project.sandbox.list();
  console.log(`✓ sandbox.list(): ${JSON.stringify(sandboxes).slice(0, 250)}…`);

  const snapshots = await project.sandbox.snapshots();
  console.log(
    `✓ sandbox.snapshots(): ${JSON.stringify(snapshots).slice(0, 250)}…`,
  );
});
