/**
 * 19 — connectors: the deployment-wide easy-connect flag,
 * the project's connector list, and the first connector's config + policies.
 * All reads.
 *
 * Run (from packages/sdk):  bun run playground/connectors/19-connectors.ts [projectId]
 */
import { makeZed, pickProjectId, run } from "../_shared";

run("connectors", async () => {
  const zed = makeZed();
  const projectId = await pickProjectId(zed, process.argv[2]);
  const connectors = zed.project(projectId).connectors;

  const status = await zed.connectStatus();
  console.log(`✓ connectStatus(): ${JSON.stringify(status)}`);

  const list = await connectors.list();
  console.log(`✓ ${JSON.stringify(list).slice(0, 300)}…`);

  const first = Array.isArray(list) ? list[0] : undefined;
  const slug = (first as { slug?: string } | undefined)?.slug;
  if (slug) {
    const config = await connectors.config(slug);
    console.log(
      `✓ config('${slug}'): ${JSON.stringify(config).slice(0, 250)}…`,
    );
    const policies = await connectors.policies.get(slug);
    console.log(
      `✓ policies.get('${slug}'): ${JSON.stringify(policies).slice(0, 200)}`,
    );
  } else {
    console.log("  (no connectors installed — config/policies not exercised)");
  }
});
