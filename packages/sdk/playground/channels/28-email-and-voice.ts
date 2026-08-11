/**
 * 28 — the other channels: email installation/mode and the voice channel's
 * bot display name. All reads (13-slack-status covers Slack).
 *
 * Run (from packages/sdk):  bun run playground/channels/28-email-and-voice.ts [projectId]
 */
import { makeZed, pickProjectId, run } from "../_shared";

run("email-and-voice", async () => {
  const zed = makeZed();
  const projectId = await pickProjectId(zed, process.argv[2]);
  const channels = zed.project(projectId).channels;

  const email = await channels.email.installation();
  console.log(`✓ email.installation(): ${JSON.stringify(email).slice(0, 250)}`);

  const emailMode = await channels.email.mode();
  console.log(`✓ email.mode(): ${JSON.stringify(emailMode).slice(0, 200)}`);

  await channels.voice.setBotName("Zed");
  console.log(`✓ voice.setBotName("Zed")`);
});
