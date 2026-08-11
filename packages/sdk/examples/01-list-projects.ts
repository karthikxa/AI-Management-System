/**
 * 01 — List projects with a Zed PAT.
 *
 * Shows the minimum viable client: `createZed` + a static bearer token
 * (a `zed_pat_...` Personal Access Token, minted from the Zed dashboard
 * or `zed.accounts.tokens.create()` — see 06-files-and-secrets.ts). No
 * Supabase session, no browser — this is the shape a CLI, cron job, or
 * server-side script uses.
 *
 * Run:
 *   ZED_API_URL=http://localhost:8008/v1 ZED_API_KEY=zed_pat_... \
 *     bun run examples/01-list-projects.ts
 *
 * As an npm consumer (outside this monorepo) the only import line changes:
 *   import { createZed } from '@zed/sdk';
 * This file imports from '../src/index' instead, so `tsc`/`bun` resolve it
 * against the package's own source without a published build (see
 * examples/tsconfig.json).
 */
import { createZed } from '../src/index';

async function main() {
  const backendUrl = process.env.ZED_API_URL ?? 'http://localhost:8008/v1';
  const apiKey = process.env.ZED_API_KEY;
  if (!apiKey) {
    console.error('Set ZED_API_KEY to a zed_pat_... token and re-run.');
    process.exit(1);
  }

  const zed = createZed({
    backendUrl,
    getToken: async () => apiKey,
  });

  const projects = await zed.projects.list();
  console.log(`${projects.length} project(s) reachable with this token:\n`);
  for (const p of projects) {
    console.log(`  ${p.project_id}  ${p.name}`);
  }

  if (projects[0]) {
    const detail = await zed.project(projects[0].project_id).detail();
    console.log(
      `\nFirst project's detail: ${detail.config.agents.length} agent(s), ${detail.file_count} file(s)`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
