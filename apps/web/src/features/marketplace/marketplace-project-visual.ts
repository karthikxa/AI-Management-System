/** Deterministic per-project banner gradient — zed-* tokens only, no raw
 *  palette. Shared by the card and the detail page so the same project gets
 *  the same identity everywhere. */
const BANNER_TOKENS = [
  'from-zed-blue/30 via-zed-blue/5',
  'from-zed-purple/30 via-zed-purple/5',
  'from-zed-green/30 via-zed-green/5',
  'from-zed-orange/30 via-zed-orange/5',
  'from-zed-yellow/30 via-zed-yellow/5',
] as const;

function hashOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function projectBannerClass(seed: string): string {
  return BANNER_TOKENS[hashOf(seed) % BANNER_TOKENS.length];
}
