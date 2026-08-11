/**
 * Node-only `AsyncLocalStorage` layer for per-request platform-config
 * isolation. Reachable ONLY through the `@zed/sdk/server` subpath — never
 * imported by the root `@zed/sdk` entry point, `@zed/sdk/react`, or any
 * other browser-safe subpath — so `node:async_hooks` never enters a browser
 * bundle's module graph. If this file's static `import` ever gets pulled into
 * an isomorphic/browser-facing subpath, that's a bug: keep it behind
 * `@zed/sdk/server`.
 *
 * This is the fix for the SDK's single biggest concurrency hazard: the
 * `configureZed()` seam (`./config.ts`) stores the platform config in a
 * process-wide module-global. A "Zed as a Backend" server — any Node/Bun
 * process fronting Zed on behalf of multiple end users/requests
 * concurrently — can't safely call `configureZed()` once per request: two
 * in-flight requests with different tokens race on the same global and the
 * second write wins for both. `runWithZed` fixes that by threading the
 * config through Node's `AsyncLocalStorage`, which — unlike a plain variable —
 * stays correctly scoped to one call's entire async continuation (every
 * `await` inside it) while remaining isolated from any other concurrent call
 * in the same process.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { __setConfigResolver, type ZedPlatformConfig } from '../core/http/config';

const als = new AsyncLocalStorage<ZedPlatformConfig>();
__setConfigResolver(() => als.getStore());

/**
 * Run `fn` (or any synchronous callback) with `config` as the platform config
 * for its entire call tree — every `platformConfig()` read reached from
 * inside it (facade calls, `backendApi`, `authenticatedFetch`, the files
 * client, event streams, …) sees THIS config, including across `await`s,
 * isolated from any other concurrent `runScoped`/`runWithZed` call.
 *
 * Internal primitive: preserves whatever `fn` returns (sync value or Promise)
 * without coercing it, so `@zed/sdk/server`'s `createScopedZed` can wrap
 * both sync (`setModel`) and async (`ensureReady`) facade methods uniformly.
 */
export function runScoped<T>(config: ZedPlatformConfig, fn: () => T): T {
  return als.run(config, fn);
}

/**
 * Run `fn` with `config` as the platform config for its entire async call
 * tree (see `runScoped`). This is the public primitive re-exported from
 * `@zed/sdk/server` — use it to wrap one incoming request's handler body
 * when you're not using the `createScopedZed` facade wrapper.
 *
 *   import { runWithZed } from '@zed/sdk/server';
 *
 *   app.use(async (req, res, next) => {
 *     await runWithZed({ backendUrl, getToken: () => resolveTokenFor(req) }, async () => {
 *       // every Zed call made anywhere in this request's async chain
 *       // (including inside `next()`) sees THIS request's config.
 *       await next();
 *     });
 *   });
 */
export async function runWithZed<T>(
  config: ZedPlatformConfig,
  fn: () => Promise<T>,
): Promise<T> {
  return runScoped(config, fn);
}

/** The config active on the current async context, if any (for diagnostics/tests). */
export function getScopedConfig(): ZedPlatformConfig | undefined {
  return als.getStore();
}
