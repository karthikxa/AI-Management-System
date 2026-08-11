export function buildSessionCacheKey(
  userScope: string,
  openCodeSessionId: string,
  zedSessionScope?: string,
): string {
  if (!zedSessionScope) {
    return `${userScope}:session:${openCodeSessionId}`;
  }
  return `${userScope}:zed-session:${encodeURIComponent(zedSessionScope)}`;
}
