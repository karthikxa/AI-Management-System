import { expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(import.meta.dir, '..', 'dist');
const ESM = join(DIST, 'zed.esm.min.js');
const IIFE = join(DIST, 'zed.global.js');

// These tests require `pnpm --filter @zed/sdk run build:bundles` to have run.
const built = existsSync(ESM) && existsSync(IIFE);

test.skipIf(!built)('no browser bundle contains node:child_process', () => {
  for (const file of [ESM, IIFE]) {
    const source = readFileSync(file, 'utf8');
    // @opencode-ai/sdk's dist/process.js imports node:child_process and is reached
    // only from v2/server.js. If it lands here, tsup resolved the wrong entry.
    expect(source.includes('node:child_process') ? `${file} pulls node:child_process` : null).toBeNull();
    expect(source.includes('async_hooks') ? `${file} pulls async_hooks` : null).toBeNull();
  }
});

test.skipIf(!built)('the IIFE bundle assigns a Zed global with the core API', () => {
  const source = readFileSync(IIFE, 'utf8');
  expect(source.length).toBeGreaterThan(1000);
  // `globalName: 'Zed'` makes tsup emit `var Zed=(()=>{…})()`.
  expect(/\bZed\b/.test(source)).toBe(true);
});
