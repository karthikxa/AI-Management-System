import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const helperPath = join(
  import.meta.dir,
  "..",
  "..",
  "templates",
  "base",
  ".zed",
  "opencode",
  "tools",
  "lib",
  "get-env.ts",
);

let tempDir: string | null = null;

afterEach(() => {
  delete process.env.ZED_AGENT_ENV_FILE;
  delete process.env.ZED_API_URL;
  delete process.env.ZED_TOKEN;
  if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  tempDir = null;
});

async function importFreshHelper() {
  return import(`${pathToFileURL(helperPath).href}?t=${Date.now()}`);
}

describe("opencode tool env helper", () => {
  test("reads Zed router env from the live agent env file", async () => {
    // mkdtemp gives an unpredictable, race-free dir (vs a guessable /tmp path).
    tempDir = mkdtempSync(join(tmpdir(), "zed-tool-env-"));
    const envFile = join(tempDir, "agent-env.sh");
    writeFileSync(
      envFile,
      [
        "# generated shell env",
        "export ZED_API_URL='https://staging-api.zed.com/v1'",
        "export ZED_TOKEN='zed_sb_test'",
        "",
      ].join("\n"),
    );
    delete process.env.ZED_API_URL;
    delete process.env.ZED_TOKEN;
    process.env.ZED_AGENT_ENV_FILE = envFile;

    const { getEnv, getZedRouterBase } = await importFreshHelper();

    expect(getEnv("ZED_API_URL")).toBe("https://staging-api.zed.com/v1");
    expect(getEnv("ZED_TOKEN")).toBe("zed_sb_test");
    expect(getZedRouterBase("tavily")).toBe(
      "https://staging-api.zed.com/v1/router/tavily",
    );
  });
});
