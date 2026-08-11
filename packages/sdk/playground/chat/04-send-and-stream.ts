/**
 * 04 — the runtime seam: ready → stream → send → idle → transcript.
 * Also the "change model" test: set ZED_MODEL to send with a specific
 * model (ids come from `projects.llmCatalog()`; provider 'zed' = gateway).
 *
 * Uses ZED_SESSION_ID if set, otherwise creates a fresh session.
 *
 * Run (from packages/sdk):
 *   ZED_MODEL=claude-sonnet-4.6 bun run playground/chat/04-send-and-stream.ts "Say hello"
 */
import {
  makeZed,
  modelOverride,
  pickOrCreateSessionId,
  pickProjectId,
  reportTurn,
  run,
  sendAndWait,
} from "../_shared";

run("send-and-stream", async () => {
  const zed = makeZed();
  const projectId = await pickProjectId(zed);
  const sessionId = await pickOrCreateSessionId(
    zed,
    projectId,
    "sdk chat test",
  );
  const prompt = process.argv[2] ?? "Say hello in one sentence.";

  const session = zed.session(projectId, sessionId);
  const turn = await sendAndWait(session, prompt, { model: modelOverride() });
  reportTurn("send-and-stream", turn);
});
