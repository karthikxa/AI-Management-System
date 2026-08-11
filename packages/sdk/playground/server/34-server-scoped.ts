/**
 * 34 — the `@zed/sdk/server` subpath: `createScopedZed` +
 * `runWithZed` give a Node server per-request config isolation via
 * async_hooks, so concurrent requests with different tokens never share a
 * client. This proves a scoped client works and does NOT leak into the
 * global config seam.
 *
 * Run (from packages/sdk):  bun run playground/server/34-server-scoped.ts
 */
import { createScopedZed, runWithZed } from "../../src/node/server";
import { run } from "../_shared";

run("server-scoped", async () => {
  const backendUrl = process.env.ZED_API_URL ?? "http://localhost:8008/v1";
  const apiKey = process.env.ZED_API_KEY;
  if (!apiKey) {
    console.error("Set ZED_API_KEY in packages/sdk/.env.local");
    process.exit(1);
  }

  const config = { backendUrl, getToken: async () => apiKey };

  const scoped = createScopedZed(config);
  const projects = await runWithZed(config, () => scoped.projects.list());
  console.log(
    `✓ scoped projects.list() inside runWithZed: ${projects.length} project(s)`,
  );

  const [a, b] = await Promise.all([
    runWithZed(config, () => scoped.projects.list()),
    runWithZed(config, () => scoped.validateToken()),
  ]);
  console.log(
    `✓ two concurrent scoped runs: ${a.length} project(s) + validateToken ${JSON.stringify(b).slice(0, 120)}`,
  );
});
