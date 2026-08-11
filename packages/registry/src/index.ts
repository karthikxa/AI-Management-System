/**
 * @zed/registry — the Zed registry + marketplace DISCOVERY primitives.
 *
 * A shadcn-compatible registry format plus the primitives to turn any Zed
 * repo into a registry (`buildRegistry`), resolve an item from GitHub / a URL /
 * disk (`loadItem` / `loadRegistry`), and validate/author items.
 *
 * There is no deterministic install engine here anymore: adding a marketplace
 * item to a project is an AGENT IMPORT (the agent reads the source and merges
 * the files it wants, landing a change request) — see the `zed-marketplace`
 * skill. `zed registry` remains a developer authoring/discovery entrypoint.
 */

export * from './schema';
export * from './validate';
export * from './address';
export * from './manifest';
export * from './paths';
export * from './skills';
export * from './fetch';
export * from './build';
