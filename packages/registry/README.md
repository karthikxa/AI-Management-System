# @zed/registry

The Zed **registry + marketplace engine** — share and 1-click install skills,
agents, commands, tools, arbitrary files/folders, or whole projects.

It is a **superset of the [shadcn registry format](https://ui.shadcn.com/docs/registry)**:

- The **format is shadcn's** (`registry.json` / `registry-item.json`, `$schema`,
  `include` composition, `registryDependencies`, namespaces). So **any GitHub
  repo with a `registry.json` is a registry** — no server, no build step — and
  shadcn tooling can read the plain-file items.
- The **installer is Zed's**, because our install target is a repo's
  `.zed/` that gets committed and materialized in a session — something
  `npx shadcn add` (which writes into a local Next.js app) structurally can't do.

> **Why not just shadcn?** The schema is shadcn's biggest gift; we use it
> verbatim. But "install = commit into the project's GitHub repo → live in the
> next session", plus private/company registries behind Zed auth, require our
> own installer. Hybrid keeps the open interop *and* the Zed-native behavior.

## The format

A registry is a `registry.json` at a repo root:

```jsonc
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "zed-ai/skills",
  "items": [
    {
      "name": "pdf",
      "type": "registry:skill",
      "title": "PDF",
      "description": "Create, edit, OCR, fill, convert PDFs.",
      "files": [
        { "path": ".zed/opencode/skills/pdf/SKILL.md", "type": "registry:file", "target": "@skills/pdf/SKILL.md" }
      ]
    }
  ]
}
```

### Item types

shadcn's types (`registry:file`, `registry:component`, `registry:lib`, …) plus
Zed-native ones:

| type | what it is |
| --- | --- |
| `registry:skill` | an Agent Skills `SKILL.md` (+ its reference files/folders) |
| `registry:agent` | an agent persona `.md` |
| `registry:command` | an OpenCode slash command `.md` |
| `registry:tool` | a custom OpenCode tool (`.ts`) / plugin |
| `registry:trigger` | a `zed.yaml` `triggers:` block |
| `registry:connector` | a connector definition (Pipedream/MCP/HTTP) |
| `registry:rules` | `AGENTS.md` / rules files |
| `registry:memory` | seed memory files |
| `registry:project` | a whole Zed project scaffold |
| `registry:bundle` | a curated set of other items (a "use-case"/starter) |

Every item is ultimately **files copied to `target` paths** — the richer type
drives categorization, icons, and validation.

### Target aliases

A file's `target` says where it lands. Aliases expand against the consuming
project's canonical OpenCode layout. Zed-managed system skills and optional
marketplace skills land in the OpenCode config directory:

| alias | expands to |
| --- | --- |
| `~/x` | `x` (repo root — shadcn-compatible) |
| `@opencode/x` | `<configDir>/x` |
| `@skills/x` | `<configDir>/skills/x` |
| `@agents/x` | `<configDir>/agents/x` |
| `@commands/x` | `<configDir>/commands/x` |
| `@tools/x` | `<configDir>/tools/x` |
| `@memory/x` | `.zed/memory/x` |

## The CLI

```bash
# Browse and install marketplace items.
zed marketplace search pdf
zed marketplace show pdf
zed marketplace install pdf --project <project-id>
zed marketplace status --project <project-id>
```

Installing writes the files into `.zed/` and records them (with content
hashes) in `registry-lock.json`. Then `git commit && zed ship` makes them
live — or use `--project <id>` to commit straight into a linked cloud project.

`zed add` has been removed from the user-facing CLI. `zed registry`
remains a developer authoring command for local registry work, but normal users
and agents should use `zed marketplace`.

Publish *anything* (arbitrary files, whole folders, a project bundle) by
hand-writing a partial registry in `zed.registry.json`; `zed registry
build` merges it and expands any folder `path` into per-file entries.

## The marketplace: three scopes, one format

The same registry format at three visibility levels:

1. **Repo** — a project's own `registry.json`; install through the marketplace
   engine.
2. **Company** — an org registry repo (e.g. `zed-ai/skills`) shown in
   **Customize → Add**, behind Zed auth for private repos.
3. **Global** — a Zed-hosted gallery (`/marketplace`) aggregating curated +
   community registries, with an **"Add to project"** button that commits the
   item into the chosen project's repo.

## Engine API

```ts
import {
  buildRegistry,        // repo → registry.json
  loadItem, loadRegistry, // resolve from GitHub / URL / disk (+ include)
  planInstall,          // resolve targets + transitive registryDependencies (pure)
  applyInstall,         // write files + update the lock
  validateRegistry,     // structural validation
  readLock,             // registry-lock.json (migrates legacy skills-lock.json)
} from '@zed/registry';
```

`planInstall` is pure (no disk writes), so callers can preview (`--dry-run`) and
the **API/web can reuse it to produce files to *commit*** into a project repo
instead of writing to a working tree.

## Status

- ✅ Format + types, validation, address parsing, GitHub/URL/local fetch with
  `include`, build, install planner + lock, `zed marketplace`, unit tests,
  and black-box CLI/API coverage.
- ✅ `zed marketplace install --project <id>` commits into a linked cloud
  project's repo through the API marketplace install path.
- ✅ API marketplace list/detail/install endpoints.
- 🔜 Web `/marketplace` gallery.
- 🔜 Zed-managed update CR workflow.
