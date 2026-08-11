#!/usr/bin/env bash
#
# Zed self-host bootstrap — "get a box, run this, done."
#
#   curl -fsSL https://raw.githubusercontent.com/zed-ai/suna/main/scripts/zed-selfhost-up.sh | bash -s -- --domain zed.example.com --email ops@example.com
#   bash zed-selfhost-up.sh --domain zed.example.com --email ops@example.com
#
# Zed self-host is VPS-first: --domain (a persistent domain, DNS pointed at
# this box) is the recommended, production-ready way to run this script.
# Omitting --domain is for evaluation/testing only, not real use.
#
# What it does, in order, on any bare Linux box (VPS, EC2, bare metal):
#   1. Installs Docker Engine + the Compose plugin if missing.
#   2. Installs the `zed` CLI (the published one-click installer).
#   3. Runs `zed self-host init` to generate docker-compose.yml + .env in
#      ~/.config/zed/self-host/<instance>/.
#   4. If a domain was given, points the stack at it (turns on the bundled
#      Caddy reverse proxy + ACME TLS on 80/443).
#   5. Runs `zed self-host start` (pulls the images, brings the stack up).
#
# This is the SAME docker-compose.yml + .env system `zed self-host` produces
# everywhere — there is no separate "target" here. Re-running this script is
# safe (init/env-set/start are all idempotent) and is a reasonable way to pick
# up config changes.
#
# No domain? Leave --domain unset and the stack binds to loopback ports only —
# that's for evaluation only (e.g. kicking the tyres over an SSH tunnel/VPN),
# NOT recommended for production. For a laptop, skip this script entirely and
# evaluate directly instead: install the CLI and run
# `zed self-host init --tunnel cloudflare && zed self-host start`
# (or omit --tunnel to stay fully local-only — no agent sessions either way).
#
# Required for agent sessions to actually run (set later, any time):
#   zed self-host env set DAYTONA_API_KEY=... MANAGED_GIT_GITHUB_TOKEN=... MANAGED_GIT_GITHUB_OWNER=...
# or interactively: zed self-host configure
#
# Flags (all optional):
#   --domain <domain>          Public domain. Enables Caddy + ACME HTTP-01 TLS
#                               on 80/443. Env: ZED_DOMAIN.
#   --api-domain <domain>      API domain (default: api.<domain>). Env: ZED_API_DOMAIN.
#   --email <email>            ACME contact email (default: admin@<domain>). Env: ZED_ACME_EMAIL.
#   --channel <stable|latest>  Image channel to track (default: stable). Env: ZED_SELFHOST_CHANNEL.
#   --auto-update <on|off>     In-compose auto-updater (default: on). Env: ZED_SELFHOST_AUTO_UPDATE.
#   --update-interval <secs>   Auto-updater poll interval (default: 86400). Env: ZED_SELFHOST_UPDATE_INTERVAL.
#   --instance <name>          Self-host instance name (default: default). Env: ZED_SELFHOST_INSTANCE.
#   --daytona-key <key>        Daytona API key (agent sandbox provider). Env: DAYTONA_API_KEY.
#   -h, --help                 Show this help.
#
# Note on env var naming: ZED_SELFHOST_CHANNEL (not ZED_CHANNEL) is used
# here on purpose — ZED_CHANNEL is already claimed by the CLI installer
# itself (zed.com/install) to mean the CLI's OWN release channel
# (prod/dev), a completely different axis from which app-image channel the
# self-hosted stack tracks (stable/latest). Keeping them distinct avoids the
# installer misreading this script's config as its own.
set -euo pipefail

log()  { printf '\033[1mzed-selfhost-up:\033[0m %s\n' "$*"; }
warn() { printf '\033[33mzed-selfhost-up: %s\033[0m\n' "$*" >&2; }
die()  { printf '\033[31mzed-selfhost-up: %s\033[0m\n' "$*" >&2; exit 1; }

usage() {
  sed -n '2,54p' "$0" | sed 's/^# \{0,1\}//'
}

# ─── Args + env defaults ─────────────────────────────────────────────────────
DOMAIN="${ZED_DOMAIN:-}"
API_DOMAIN="${ZED_API_DOMAIN:-}"
ACME_EMAIL="${ZED_ACME_EMAIL:-}"
CHANNEL="${ZED_SELFHOST_CHANNEL:-stable}"
AUTO_UPDATE="${ZED_SELFHOST_AUTO_UPDATE:-on}"
UPDATE_INTERVAL="${ZED_SELFHOST_UPDATE_INTERVAL:-86400}"
INSTANCE="${ZED_SELFHOST_INSTANCE:-default}"
DAYTONA_KEY="${DAYTONA_API_KEY:-}"

while [ $# -gt 0 ]; do
  case "$1" in
    --domain) DOMAIN="${2:?--domain requires a value}"; shift 2 ;;
    --api-domain) API_DOMAIN="${2:?--api-domain requires a value}"; shift 2 ;;
    --email) ACME_EMAIL="${2:?--email requires a value}"; shift 2 ;;
    --channel) CHANNEL="${2:?--channel requires a value}"; shift 2 ;;
    --auto-update) AUTO_UPDATE="${2:?--auto-update requires a value}"; shift 2 ;;
    --update-interval) UPDATE_INTERVAL="${2:?--update-interval requires a value}"; shift 2 ;;
    --instance) INSTANCE="${2:?--instance requires a value}"; shift 2 ;;
    --daytona-key) DAYTONA_KEY="${2:?--daytona-key requires a value}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown argument: $1 (see --help)" ;;
  esac
done

case "$CHANNEL" in
  stable|latest) ;;
  *) die "--channel must be 'stable' or 'latest', got '$CHANNEL'" ;;
esac
case "$AUTO_UPDATE" in
  on|off) ;;
  *) die "--auto-update must be 'on' or 'off', got '$AUTO_UPDATE'" ;;
esac
case "$UPDATE_INTERVAL" in
  ''|*[!0-9]*) die "--update-interval must be a positive number of seconds" ;;
esac
if [ -n "$DOMAIN" ]; then
  case "$DOMAIN" in
    *[!a-zA-Z0-9.-]*|.*|*.) die "unsafe --domain: $DOMAIN" ;;
  esac
fi

# ─── Preflight ────────────────────────────────────────────────────────────────
UNAME_S="$(uname -s)"
if [ "$UNAME_S" != "Linux" ]; then
  die "this script bootstraps a Linux box. On $UNAME_S (e.g. a laptop), install the CLI (curl -fsSL https://zed.com/install | bash) and run: zed self-host init && zed self-host start"
fi

# SUDO is an array (possibly empty) rather than a string so it expands to zero
# words — not one empty word — when running as root already.
SUDO=()
if [ "$(id -u)" != "0" ]; then
  command -v sudo >/dev/null 2>&1 || die "run as root, or install sudo"
  SUDO=(sudo)
fi

log "domain:       ${DOMAIN:-<none — loopback-only>}"
log "channel:      $CHANNEL (auto-update: $AUTO_UPDATE, every ${UPDATE_INTERVAL}s)"
log "instance:     $INSTANCE"

# Every zed self-host invocation below reads/writes this exact directory,
# no matter which uid the invocation runs under (see the DOCKER_SUDO note in
# step 5) — pinning it here removes any ambiguity from $HOME changing across
# `sudo`.
: "${ZED_SELF_HOST_CONFIG_DIR:=$HOME/.config/zed/self-host}"
export ZED_SELF_HOST_CONFIG_DIR

# ─── 1. Docker + Compose plugin ──────────────────────────────────────────────
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  log "docker + compose plugin already installed ($(docker --version))"
else
  log "installing docker engine + compose plugin"
  curl --fail --silent --show-error --location https://get.docker.com | "${SUDO[@]}" sh
  if command -v systemctl >/dev/null 2>&1; then
    "${SUDO[@]}" systemctl enable --now docker
  fi
fi
docker compose version >/dev/null 2>&1 || die "docker compose plugin is unavailable after install"

DOCKER_SUDO=()
if [ "$(id -u)" != "0" ] && ! docker info >/dev/null 2>&1; then
  if ! id -nG "$USER" 2>/dev/null | grep -qw docker; then
    log "adding $USER to the docker group (log out/in — or start a new shell — to pick it up)"
    "${SUDO[@]}" usermod -aG docker "$USER"
  fi
  warn "docker isn't usable by the current shell yet; re-running docker-touching commands with sudo for this run"
  DOCKER_SUDO=(sudo -E env "ZED_SELF_HOST_CONFIG_DIR=$ZED_SELF_HOST_CONFIG_DIR")
fi

# ─── 2. Install the zed CLI ───────────────────────────────────────────────
# This is the published one-click installer (scripts/install.sh in this repo,
# served at https://zed.com/install): downloads the prebuilt binary for this
# OS/arch from GitHub Releases and symlinks it onto PATH. Re-run any time to
# update, or use `zed update`.
if command -v zed >/dev/null 2>&1; then
  log "zed CLI already installed ($(zed version 2>/dev/null | head -1 || echo present))"
else
  log "installing the zed CLI"
  curl -fsSL https://zed.com/install | bash
fi

ZED_BIN="$(command -v zed || true)"
if [ -z "$ZED_BIN" ]; then
  # install.sh falls back to ~/.zed/zed when it can't put a symlink on
  # PATH (e.g. no writable /usr/local/bin and no sudo).
  [ -x "$HOME/.zed/zed" ] || die "zed CLI install did not produce a runnable binary"
  ZED_BIN="$HOME/.zed/zed"
  warn "zed isn't on PATH yet; using $ZED_BIN directly for this run"
fi

zed() { "$ZED_BIN" "$@"; }

# ─── 3. Generate the self-host config ────────────────────────────────────────
log "running zed self-host init"
zed self-host init \
  --instance "$INSTANCE" \
  --channel "$CHANNEL" \
  --auto-update "$AUTO_UPDATE" \
  --update-interval "$UPDATE_INTERVAL" \
  --yes

# ─── 4. Domain + TLS (opt-in) ─────────────────────────────────────────────────
if [ -n "$DOMAIN" ]; then
  ENV_ARGS=("ZED_DOMAIN=$DOMAIN")
  [ -n "$API_DOMAIN" ] && ENV_ARGS+=("ZED_API_DOMAIN=$API_DOMAIN")
  [ -n "$ACME_EMAIL" ] && ENV_ARGS+=("ZED_ACME_EMAIL=$ACME_EMAIL")
  log "configuring domain: $DOMAIN (make sure its A/AAAA record — and ${API_DOMAIN:-api.$DOMAIN}'s — already point at this box's public IP before continuing; Caddy needs them for ACME HTTP-01)"
  zed self-host env set --instance "$INSTANCE" "${ENV_ARGS[@]}"
fi

# ─── Optional: sandbox provider now, instead of later ────────────────────────
if [ -n "$DAYTONA_KEY" ]; then
  log "configuring Daytona sandbox key"
  zed self-host env set --instance "$INSTANCE" "DAYTONA_API_KEY=$DAYTONA_KEY"
fi

# ─── 5. Start ─────────────────────────────────────────────────────────────────
# `start` is the one subcommand that actually talks to the Docker daemon
# (pull/up), so it's the only one that needs DOCKER_SUDO when the current
# shell can't reach the socket yet (fresh docker-group membership needs a new
# login to take effect). init/env-set above only ever touch the config files.
log "starting the stack (pulling images — this can take a few minutes on first run)"
"${DOCKER_SUDO[@]}" "$ZED_BIN" self-host start --instance "$INSTANCE" --yes

cat <<SUMMARY

zed self-host is up.

  Instance   $INSTANCE
  Status     zed self-host status --instance $INSTANCE
  Logs       zed self-host logs --instance $INSTANCE
  Doctor     zed self-host doctor --instance $INSTANCE
  Configure  zed self-host configure --instance $INSTANCE   (Daytona sandbox key, GitHub, Pipedream)
  Update     zed self-host update --instance $INSTANCE      (or let the in-compose updater do it — on by default)

SUMMARY
