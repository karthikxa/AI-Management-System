import { z } from 'zod'

/**
 * Env contract for zed-sandbox-agent-server.
 *
 * Names must stay aligned with apps/api/src/projects/index.ts: the API
 * passes ZED_PROJECT_AUTO_CLONE / ZED_REPO_URL / ZED_BRANCH_NAME /
 * ZED_DEFAULT_BRANCH / ZED_PROJECT_ID / ZED_API_URL /
 * ZED_SERVICE_PORT to Daytona at sandbox creation time. The provider layer
 * injects the sandbox credential as ZED_SANDBOX_TOKEN (with ZED_TOKEN kept
 * as a back-compat alias for daemons baked before the rename). It is the daemon's
 * own identity: the HMAC key for X-Zed-User-Context validation AND the bearer
 * for the sandbox-identity routes (clone-credential / turn-stream / turn-question).
 * It is distinct from the SESSION token (ZED_CLI_TOKEN), which acts as the
 * launching user. Git provider credentials are fetched just-in-time from apps/api.
 */

const BoolFlag = z.preprocess((v) => {
  if (typeof v !== 'string') return false
  const s = v.trim().toLowerCase()
  return s === '1' || s === 'true' || s === 'yes' || s === 'on'
}, z.boolean())

const Schema = z.object({
  ZED_SERVICE_PORT: z.coerce.number().int().positive().default(8000),
  ZED_OPENCODE_INTERNAL_PORT: z.coerce.number().int().positive().default(4096),
  // The other half of the opencode port PAIR. A verified reload boots the new
  // opencode on whichever of the two is idle, proves it serves, and only then
  // swaps to it and kills the old one — so a config that cannot boot never
  // takes the session down with it.
  //
  // Fixed rather than picked at reload time on purpose: both ports must be in
  // the web proxy's blocked-self-ports set, and that set is built once at
  // startup. An ephemeral port would be unguarded the moment it went live,
  // handing the sandbox an unproxied route to its own opencode.
  ZED_OPENCODE_STANDBY_PORT: z.coerce.number().int().positive().default(4097),
  // Static web server port. Default 3211 is a hard contract: apps/web
  // (platform-client STATIC_FILE_SERVER, url.ts) and the starter `show` tool
  // build preview URLs against this exact port via /proxy/3211 and p3211-* .
  ZED_STATIC_PORT: z.coerce.number().int().positive().default(3211),
  ZED_WORKSPACE: z.string().default('/workspace'),
  // Project repo is cloned directly into the workspace. The repo's
  // Zed-owned files live under <workspace>/.zed/ (Dockerfile +
  // opencode config dir) — no intermediate clone-target directory.
  ZED_PROJECT_TARGET: z.string().default('/workspace'),
  ZED_DEFAULT_BRANCH: z.string().default('main'),
  ZED_BRANCH_FETCH_ATTEMPTS: z.coerce.number().int().positive().default(60),
  ZED_BRANCH_FETCH_DELAY: z.coerce.number().positive().default(0.25),
  ZED_DEFAULT_OPENCODE_CONFIG_DIR: z
    .string()
    .default('/ephemeral/zed-master/opencode'),
  ZED_PROJECT_AUTO_CLONE: BoolFlag.default(false),
  ZED_PROJECT_ID: z.string().optional(),
  ZED_API_URL: z.string().optional(),
  ZED_REPO_URL: z.string().optional(),
  ZED_BRANCH_NAME: z.string().optional(),
  ZED_SESSION_FRESH: z.string().optional(),
  ZED_BASE_SHA: z.string().optional(),
  // The sandbox credential. ZED_SANDBOX_TOKEN is canonical; ZED_TOKEN is
  // the legacy alias (resolved with a fallback below).
  ZED_SANDBOX_TOKEN: z.string().optional(),
  ZED_TOKEN: z.string().optional(),
  ZED_GIT_USER_NAME: z.string().default('Zed Agent'),
  ZED_GIT_USER_EMAIL: z.string().default('agent@zed.ai'),
  // Depth of the boot-time `git clone`. 1 (the default) is a SHALLOW clone:
  // one commit, no history — the only thing a fresh session's working tree
  // actually needs at boot. History is restored right after boot by a
  // background `fetch --unshallow` (see scheduleHistoryBackfill in git.ts), so
  // `git log`/`blame`/`diff` work by the time an agent could ask for them.
  // 0 clones full history inline (the old behaviour).
  //
  // Measured 2026-07-25 on zed-ai/company, direct to GitHub: full 5462ms
  // (27MB / 758 commits) vs --depth 1 3516ms (25MB / 1 commit). A real but
  // MODEST win — history is only ~2MB of that repo, so shallow buys ~1.5x, not
  // an order of magnitude. The bulk of a clone is the working tree, which no
  // depth setting avoids; only baking the repo into the image does (warm
  // images). Do not expect this flag alone to fix boot latency.
  //
  // --filter=blob:none measured 6161ms — SLOWER than a full clone — on top of
  // stalling on lazy blob fetches through the git proxy, which is why the API
  // forces no filter. Shallow has neither problem: one pack, no on-demand
  // fetches.
  ZED_CLONE_DEPTH: z.coerce.number().int().min(0).default(1),
  // Partial-clone filter for the boot-time `git clone`. Empty (the default)
  // means no filter. Prefer ZED_CLONE_DEPTH — a blobless clone measured
  // slower than a full one and defers cost into unpredictable mid-session
  // stalls. Kept for remotes where shallow is unavailable.
  ZED_CLONE_FILTER: z.string().default(''),
})

export type Config = {
  servicePort: number
  opencodeInternalPort: number
  /** Idle half of the opencode port pair; see ZED_OPENCODE_STANDBY_PORT. */
  opencodeStandbyPort: number
  staticPort: number
  workspace: string
  projectTarget: string
  defaultBranch: string
  branchFetchAttempts: number
  branchFetchDelaySec: number
  defaultOpencodeConfigDir: string
  autoClone: boolean
  projectId: string | undefined
  apiUrl: string | undefined
  repoUrl: string | undefined
  branchName: string | undefined
  sessionFresh: boolean
  baseSha: string | undefined
  /** The sandbox credential (HMAC key + sandbox-identity route bearer). NOT the
   *  session/user token — see the module doc. */
  sandboxToken: string | undefined
  gitUserName: string
  gitUserEmail: string
  cloneFilter: string
  cloneDepth: number
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = Schema.parse({
    ZED_SERVICE_PORT: env.ZED_SERVICE_PORT,
    ZED_OPENCODE_INTERNAL_PORT: env.ZED_OPENCODE_INTERNAL_PORT,
    ZED_OPENCODE_STANDBY_PORT: env.ZED_OPENCODE_STANDBY_PORT,
    ZED_STATIC_PORT: env.ZED_STATIC_PORT,
    ZED_WORKSPACE: env.ZED_WORKSPACE,
    ZED_PROJECT_TARGET: env.ZED_PROJECT_TARGET,
    ZED_DEFAULT_BRANCH: env.ZED_DEFAULT_BRANCH,
    ZED_BRANCH_FETCH_ATTEMPTS: env.ZED_BRANCH_FETCH_ATTEMPTS,
    ZED_BRANCH_FETCH_DELAY: env.ZED_BRANCH_FETCH_DELAY,
    ZED_DEFAULT_OPENCODE_CONFIG_DIR: env.ZED_DEFAULT_OPENCODE_CONFIG_DIR,
    ZED_PROJECT_AUTO_CLONE: env.ZED_PROJECT_AUTO_CLONE,
    ZED_PROJECT_ID: env.ZED_PROJECT_ID,
    ZED_API_URL: env.ZED_API_URL,
    ZED_REPO_URL: env.ZED_REPO_URL,
    ZED_BRANCH_NAME: env.ZED_BRANCH_NAME,
    ZED_SESSION_FRESH: env.ZED_SESSION_FRESH,
    ZED_BASE_SHA: env.ZED_BASE_SHA,
    ZED_SANDBOX_TOKEN: env.ZED_SANDBOX_TOKEN,
    ZED_TOKEN: env.ZED_TOKEN,
    ZED_GIT_USER_NAME: env.ZED_GIT_USER_NAME,
    ZED_GIT_USER_EMAIL: env.ZED_GIT_USER_EMAIL,
    ZED_CLONE_FILTER: env.ZED_CLONE_FILTER,
    ZED_CLONE_DEPTH: env.ZED_CLONE_DEPTH,
  })

  return {
    servicePort: parsed.ZED_SERVICE_PORT,
    opencodeInternalPort: parsed.ZED_OPENCODE_INTERNAL_PORT,
    opencodeStandbyPort: parsed.ZED_OPENCODE_STANDBY_PORT,
    staticPort: parsed.ZED_STATIC_PORT,
    workspace: parsed.ZED_WORKSPACE,
    projectTarget: parsed.ZED_PROJECT_TARGET,
    defaultBranch: parsed.ZED_DEFAULT_BRANCH,
    branchFetchAttempts: parsed.ZED_BRANCH_FETCH_ATTEMPTS,
    branchFetchDelaySec: parsed.ZED_BRANCH_FETCH_DELAY,
    defaultOpencodeConfigDir: parsed.ZED_DEFAULT_OPENCODE_CONFIG_DIR,
    autoClone: parsed.ZED_PROJECT_AUTO_CLONE,
    projectId: parsed.ZED_PROJECT_ID,
    apiUrl: parsed.ZED_API_URL,
    repoUrl: parsed.ZED_REPO_URL,
    branchName: parsed.ZED_BRANCH_NAME,
    sessionFresh: parsed.ZED_SESSION_FRESH === '1',
    baseSha: parsed.ZED_BASE_SHA,
    // Canonical name wins; fall back to the legacy alias so daemons running in
    // older-API sandboxes (which only inject ZED_TOKEN) still resolve it.
    sandboxToken: parsed.ZED_SANDBOX_TOKEN ?? parsed.ZED_TOKEN,
    gitUserName: parsed.ZED_GIT_USER_NAME,
    gitUserEmail: parsed.ZED_GIT_USER_EMAIL,
    cloneFilter: parsed.ZED_CLONE_FILTER,
    cloneDepth: parsed.ZED_CLONE_DEPTH,
  }
}

type ManifestFormat = 'yaml' | 'toml'

/**
 * Read the project manifest, preferring the canonical `zed.yaml` (schema v2)
 * and falling back to the legacy `zed.toml` (v1) — the same resolution order
 * the API and CLI use. Returns null when neither file exists. The daemon has no
 * TOML/YAML parser dependency, so callers regex the returned body per `format`.
 */
async function readProjectManifest(
  fs: typeof import('node:fs/promises'),
  projectTarget: string,
): Promise<{ body: string; format: ManifestFormat } | null> {
  const candidates: { file: string; format: ManifestFormat }[] = [
    { file: 'zed.yaml', format: 'yaml' },
    { file: 'zed.yml', format: 'yaml' },
    { file: 'zed.toml', format: 'toml' },
  ]
  for (const { file, format } of candidates) {
    try {
      return { body: await fs.readFile(`${projectTarget}/${file}`, 'utf8'), format }
    } catch {}
  }
  return null
}

/**
 * Pull a single string value at `<section>.<key>` out of a manifest body without
 * a full parser. Handles both shapes:
 *   YAML — `section:` then an indented `key: value` (value optionally quoted)
 *   TOML — `[section]` then `key = "value"` (value quoted)
 * Returns null if the section/key is absent or the value is empty.
 */
function extractNestedString(
  body: string,
  format: ManifestFormat,
  section: string,
  key: string,
): string | null {
  if (format === 'toml') {
    // The `[section]` table body runs up to the next `[…]` header or EOF.
    // `(?![\s\S])` is the JS end-of-string anchor (`\Z` matches a literal Z).
    const sectionMatch = body.match(
      new RegExp(`^\\[${section}\\]\\s*$([\\s\\S]*?)(?=^\\s*\\[|(?![\\s\\S]))`, 'm'),
    )
    const sectionBody = sectionMatch?.[1]
    if (!sectionBody) return null
    const keyMatch = sectionBody.match(new RegExp(`^\\s*${key}\\s*=\\s*['"]([^'"]+)['"]`, 'm'))
    const value = keyMatch?.[1]?.trim()
    return value && value.length > 0 ? value : null
  }
  // YAML: a top-level `section:` mapping whose block is the indented lines that
  // follow, up to the next non-indented (non-blank) line or EOF.
  const sectionMatch = body.match(
    new RegExp(`^${section}:\\s*$([\\s\\S]*?)(?=^\\S|(?![\\s\\S]))`, 'm'),
  )
  const sectionBody = sectionMatch?.[1]
  if (!sectionBody) return null
  const keyMatch = sectionBody.match(
    new RegExp(`^\\s+${key}\\s*:\\s*(?:['"]([^'"]+)['"]|([^\\s#][^#\\n]*?))\\s*(?:#.*)?$`, 'm'),
  )
  const value = (keyMatch?.[1] ?? keyMatch?.[2])?.trim()
  return value && value.length > 0 ? value : null
}

/**
 * Read `sandbox.on_boot` from the project manifest — a shell command the daemon
 * runs (backgrounded) once the repo is materialized and opencode is up, so a
 * session can auto-start its dev stack (e.g. `on_boot: "pnpm dev"`). Resolves
 * zed.yaml first, then legacy zed.toml. Returns null when unset.
 */
export async function resolveSandboxOnBoot(cfg: Config): Promise<string | null> {
  const fs = await import('node:fs/promises')
  const manifest = await readProjectManifest(fs, cfg.projectTarget)
  if (!manifest) return null
  return extractNestedString(manifest.body, manifest.format, 'sandbox', 'on_boot')
}

/**
 * Pick the opencode config dir for this sandbox. Honors `opencode.config_dir` in
 * the project's manifest (zed.yaml, or legacy zed.toml) when present,
 * defaulting to `.zed/opencode` relative to the cloned repo, and falls back
 * to ZED_DEFAULT_OPENCODE_CONFIG_DIR if the project doesn't have an
 * opencode.jsonc — that's what keeps a freshly provisioned sandbox bootable
 * before a project has been cloned.
 */
/**
 * The same directory, but REPO-RELATIVE — the form git pathspecs need.
 *
 * `resolveOpencodeConfigDir` answers "where does opencode read from" (absolute,
 * with a fallback outside the repo when the project has no opencode.jsonc). A
 * git operation needs the other half: the path inside the working tree, or
 * nothing at all when the effective dir is the out-of-repo default and there is
 * therefore nothing in git to sync.
 */
export async function resolveOpencodeConfigDirRelative(cfg: Config): Promise<string | null> {
  const fs = await import('node:fs/promises')
  const rel = await readOpencodeConfigDirFromManifest(fs, cfg.projectTarget)
  if (!isPlainRelativePath(rel)) return null
  const absolute = await resolveOpencodeConfigDir(cfg)
  // Fell back to the out-of-repo default: the project ships no opencode config,
  // so there is no tracked directory to update.
  return absolute === `${cfg.projectTarget}/${rel}` ? rel : null
}

/**
 * Is this a literal directory path, and nothing cleverer?
 *
 * `opencode.config_dir` comes from a repo-controlled manifest and this value
 * becomes a git PATHSPEC. The manifest reader only rejects absolute paths and
 * `..`, so `:(top)*` survives it — and git honours pathspec magic even after
 * `--`, which would let a manifest turn a config-dir sync into a rewrite of the
 * whole working tree. The git calls also run with `GIT_LITERAL_PATHSPECS=1`, so
 * this is the second of two independent guards rather than the only one; it
 * exists so a magic-looking value is SKIPPED loudly instead of silently
 * resolving to some other directory.
 *
 * Deliberately narrow: only the boot path may keep interpreting whatever the
 * manifest says. This governs the sync alone.
 */
function isPlainRelativePath(value: string): boolean {
  if (!value || value.startsWith('/') || value.startsWith('-')) return false
  return value
    .split('/')
    .every((segment) => segment.length > 0 && segment !== '.' && segment !== '..' && /^[\w .-]+$/.test(segment))
}

export async function resolveOpencodeConfigDir(cfg: Config): Promise<string> {
  const fs = await import('node:fs/promises')
  const relConfigDir = await readOpencodeConfigDirFromManifest(fs, cfg.projectTarget)
  const candidate = `${cfg.projectTarget}/${relConfigDir}`
  for (const filename of ['opencode.jsonc', 'opencode.json']) {
    try {
      const stat = await fs.stat(`${candidate}/${filename}`)
      if (stat.isFile()) {
        try {
          await fs.mkdir(candidate, { recursive: true })
        } catch {}
        return candidate
      }
    } catch {}
  }
  try {
    await fs.mkdir(cfg.defaultOpencodeConfigDir, { recursive: true })
  } catch {}
  return cfg.defaultOpencodeConfigDir
}

/**
 * Pluck `opencode.config_dir` out of the project manifest without dragging in a
 * full parser. Resolves zed.yaml first, then legacy zed.toml, and reads
 * the field from whichever format it found. Falls back to the default if the
 * manifest is absent or anything's off.
 */
async function readOpencodeConfigDirFromManifest(
  fs: typeof import('node:fs/promises'),
  projectTarget: string,
): Promise<string> {
  const fallback = '.zed/opencode'
  const manifest = await readProjectManifest(fs, projectTarget)
  if (!manifest) return fallback
  const rawValue = extractNestedString(manifest.body, manifest.format, 'opencode', 'config_dir')
  if (!rawValue) return fallback
  const raw = rawValue.trim().replace(/\/+$/, '')
  // Reject absolute paths and parent traversal — matches the API's validator.
  if (!raw || raw.startsWith('/') || raw.split('/').includes('..')) return fallback
  return raw
}
