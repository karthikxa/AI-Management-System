/**
 * Re-export shim. The layer renderer moved to `@zed/shared/sandbox` so the
 * CLI can render it too; this keeps every existing `./dockerfile-layer` import
 * inside apps/api working unchanged.
 */

export * from '@zed/shared/sandbox';
