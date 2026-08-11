# @zed/cli

Create a new Zed project.

```sh
zed init my-project
```

Makes `./my-project/`, runs `git init -b main`, and writes the Zed
project floor at the repo root (`zed.yaml`, `README.md`,
`.zed/opencode/`, `.zed/memory/MEMORY.md`), stages every file, and
makes an initial commit.

## Usage

```sh
zed init                  # interactive flow: pick a name and wire local coding agents
zed init my-project       # use the given name
zed ship                  # create the cloud project (first run) + push your code
zed self-host start       # run your own Zed Cloud from Docker images
```

Scaffolding is explicit-only: `zed init` is the one command that creates
a project directory. An unknown subcommand (`zed use`, `zed inti`, …)
errors with a suggestion — it never scaffolds. Init asks which local coding
agents to wire through `--primary` and `--agents`.

Run `zed init --help` for the full flag list, or `zed --help`
for the full command list (project, auth, work, and resource subcommands —
sessions, triggers, connectors, secrets, sandboxes, marketplace, and more).

## What gets written

```
my-project/
├── .git/                              ← initialized on the `main` branch
├── .gitignore
├── README.md
├── zed.yaml                        ← v2 OpenCode manifest
└── .zed/
    ├── memory/MEMORY.md               ← project-wide memory for agents
    └── opencode/                      ← OpenCode native config dir
        ├── opencode.jsonc             ← runtime config (providers, plugins, MCP servers, …)
        ├── agents/{zed,harness-reflector}.md
        └── skills/zed-cli/SKILL.md (+ the artifact skill floor)
```

The local coding tools you wire up (`--primary`/`--agents`, default Codex)
receive native discovery links to the canonical `.zed/opencode` source.
OpenCode uses `.opencode`. Claude Code uses `.claude/skills`,
`.claude/agents`, and `.claude/commands`. Codex uses `.agents`. Pi uses
`.pi/skills`. Codex, Pi, and Cursor also get a root `AGENTS.md` pointer.

The public starter uses `zed_version: 2`. Cloud sessions run OpenCode REST.

Create a project with:

```sh
zed init my-project --yes --no-git
```

Agents can retrieve the deployed platform manual from OpenCode:

```sh
zed system-skills
zed system-skills get zed-system --full
```

`zed skills` is a permanent alias.

After the scaffold lands, one commit is made:

```
chore: init zed project
```

Then it's yours. Add a remote, push, open in your coding agent of choice —
or run `zed ship` to create the cloud project and push in one step.

## Self-host

One command surface manages two deployment targets. `docker` ("this machine")
is the backward-compatible default for local and smaller installations; `aws-ec2`
("AWS EC2") is the enterprise target and records only AWS coordinates and release
policy locally. Secrets for AWS deployments are written directly to the customer
account. (The AWS target was previously named `aws-vpc`; existing instance configs
that still say `aws-vpc` on disk keep working — they load as `aws-ec2`.)

### Docker

```sh
pnpm install
./bin/zed --help
./bin/zed self-host init --target docker
./bin/zed self-host plan
./bin/zed self-host start
./bin/zed self-host configure
./bin/zed self-host env set PUBLIC_URL=https://zed.example.com API_PUBLIC_URL=https://api.example.com
./bin/zed hosts ls
./bin/zed hosts use local
./bin/zed hosts use cloud
```

`self-host start` creates the config when needed and only asks for external
connections: GitHub and Pipedream. Run `self-host configure` later
to change those credentials.

The generated Docker distribution embeds a pinned copy of the official full
Supabase stack: PostgreSQL 17, Auth, REST, Realtime, Storage, imgproxy, Meta,
Edge Runtime, Kong, Studio, Supavisor, Logflare, and Vector. Published ports
bind to loopback by default, and all generated secret material is stored in the
owner-only instance `.env`.

### Enterprise AWS EC2

```sh
export AWS_PROFILE=customer

./bin/zed self-host init \
  --target aws-ec2 \
  --instance customer \
  --region us-west-2 \
  --channel stable \
  --yes

./bin/zed self-host doctor --instance customer
./bin/zed self-host plan --instance customer
./bin/zed self-host deploy --instance customer
./bin/zed self-host status --instance customer
./bin/zed self-host reconcile --instance customer --channel stable
```

For AWS, the CLI is the bootstrap and operator remote control. The customer-
owned updater, scheduler, EKS controllers, and recovery automation continue
operating after the CLI exits. `start`, `stop`, and direct environment-file
editing are intentionally Docker-only.
