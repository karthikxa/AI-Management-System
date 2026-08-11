/**
 * 07 — The whole flow, framework-free, in one file.
 *
 * createZed → projects.list() → session(pid, sid).send() → session.stream()
 * → classifyTurn. Zero React, zero DOM, zero Node-specific API beyond
 * `process.env` and `console`.
 *
 * One correction vs. the naive guess: `session.transcript()` is the *compact
 * server-side* transcript read (`core/rest/projects-client/sessions.ts`'s
 * `getSessionTranscript`) — it returns a pre-flattened
 * `{ role, text, tools, files, error }` shape (text + tool names only, no
 * parts), which is NOT what `classifyTurn` classifies and doesn't typecheck
 * against it. `classifyTurn` (`core/turns/classify.ts`) takes a
 * `MessageWithParts` (`{ info: Message; parts: Part[] }`) — the raw opencode
 * runtime shape. To render with `classifyTurn`, read from the runtime
 * directly, exactly like `examples/04-render-transcript.ts` does:
 * `session.runtime.session.messages({ sessionID })`.
 *
 * Run:
 *   ZED_API_URL=http://localhost:8008/v1 ZED_API_KEY=zed_pat_... \
 *   ZED_PROJECT_ID=... ZED_SESSION_ID=... \
 *     bun run examples/07-vanilla.ts "list the files here"
 *
 * As an npm consumer, one import line changes:
 *   import { classifyTurn, createZed, narrowChatEvent } from '@zed/sdk';
 *   import type { MessageWithParts } from '@zed/sdk';
 */
import { classifyTurn, createZed, narrowChatEvent } from '../src/index';
import type { MessageWithParts } from '../src/index';

async function main() {
  const backendUrl = process.env.ZED_API_URL ?? 'http://localhost:8008/v1';
  const apiKey = process.env.ZED_API_KEY;
  const projectId = process.env.ZED_PROJECT_ID;
  const sessionId = process.env.ZED_SESSION_ID;
  const prompt = process.argv[2] ?? 'Say hello in one sentence.';

  if (!apiKey || !projectId || !sessionId) {
    console.error('Set ZED_API_KEY, ZED_PROJECT_ID and ZED_SESSION_ID.');
    process.exit(1);
  }

  const zed = createZed({ backendUrl, getToken: async () => apiKey });

  const projects = await zed.projects.list();
  console.log(`${projects.length} project(s); using ${projectId}`);

  const session = zed.session(projectId, sessionId);

  // Connect BEFORE sending so no early events are missed. `ensureReady()`
  // also hands back this handle's own resolved opencode session id, which
  // the final render loop below needs to read the runtime's own messages.
  const { opencodeSessionId } = await session.ensureReady();
  const handle = await session.stream({
    onEvent: (event) => {
      const narrowed = narrowChatEvent(event);
      if (!narrowed) return;
      console.log(`· ${narrowed.type}`);
    },
  });

  await session.send(prompt);

  // Let the turn settle, then render what arrived.
  await new Promise((resolve) => setTimeout(resolve, 15_000));
  handle.close();

  const result = await session.runtime.session.messages({ sessionID: opencodeSessionId });
  const messages = (result.data ?? []) as MessageWithParts[];
  for (const message of messages) {
    for (const part of classifyTurn(message).parts) {
      if (part.kind === 'text') console.log(part.text);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
