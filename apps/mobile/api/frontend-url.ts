function backendHostname(backendUrl: string): string | null {
  try {
    return new URL(backendUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function inferFrontendUrl(backendUrl: string): string | null {
  const hostname = backendHostname(backendUrl);
  if (hostname === 'api.zed.com') return 'https://zed.com';
  if (hostname === 'staging.api.zed.com' || hostname === 'staging-api.zed.com') {
    return 'https://staging.zed.com';
  }
  return null;
}
