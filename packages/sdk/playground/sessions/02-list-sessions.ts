/**
 * 02 — given a project, can I read its sessions?
 * Project selection: argv[2] → ZED_PROJECT_ID → first project.
 *
 * Run (from packages/sdk):  bun run playground/sessions/02-list-sessions.ts [projectId]
 */
import { makeZed, pickProjectId, run } from "../_shared";

run("list-sessions", async () => {
  const zed = makeZed();
  const projectId = await pickProjectId(zed, process.argv[2]);

  const sessions = await zed.projects.sessions(projectId);

  console.log(
    `✓ projects.sessions(${projectId}) returned ${sessions.length} session(s):\n`,
  );
  for (const s of sessions) {
    console.log(`  ${s.name ?? s.branch_name}`);
    console.log(`    id:     ${s.session_id}`);
    console.log(`    status: ${s.status}`);
    console.log(`    agent:  ${s.agent_name ?? "—"}\n`);
  }

  if (sessions.length > 0) {
    console.log("pin one for the chat scripts:");
    console.log(`  export ZED_SESSION_ID=${sessions[0]!.session_id}`);
  }
});
