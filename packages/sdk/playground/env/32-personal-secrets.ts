/**
 * 32 — PERSONAL project secrets (per-user overrides of project secrets):
 * setPersonal → list → removePersonal round-trip. Cleans up after itself.
 *
 * Run (from packages/sdk):  bun run playground/env/32-personal-secrets.ts [projectId]
 */
import { makeZed, pickProjectId, run } from "../_shared";

const NAME = "SDK_PLAYGROUND_PERSONAL_SECRET";

run("personal-secrets", async () => {
  const zed = makeZed();
  const projectId = await pickProjectId(zed, process.argv[2]);
  const secrets = zed.project(projectId).secrets;

  await secrets.setPersonal(NAME, { value: "personal-value-from-playground" });
  console.log(`✓ setPersonal(${NAME})`);

  const during = await secrets.list();
  console.log(
    `✓ list() after set: ${JSON.stringify(during.items.map((s) => s.name))}`,
  );

  await secrets.removePersonal(NAME);
  console.log("✓ removePersonal() — cleaned up");
});
