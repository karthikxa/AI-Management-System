import { CANONICAL_ORIGIN } from '@/lib/site-metadata';

const CANONICAL_HOSTS = new Set(['zed.com', 'www.zed.com']);

// Local dev serves the production robots policy so the local crawl-verification
// harness exercises exactly what zed.com ships.
function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

export function isCanonicalRobotsHost(host: string | null): boolean {
  if (!host) return false;
  const hostname = host.split(':')[0].toLowerCase();
  return CANONICAL_HOSTS.has(hostname) || isLocalHost(hostname);
}

// The production policy served on zed.com (and localhost). Any other host —
// dev.zed.com, staging.zed.com, Vercel previews, self-hosted deployments
// — gets a blanket Disallow so non-canonical copies of the site never enter a
// search index alongside the canonical one.
const CANONICAL_ROBOTS = `# Zed Robots.txt
User-agent: *
Allow: /
Allow: /api/ai
Content-Signal: ai-train=no, search=yes, ai-input=yes

# Sitemap
Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml

# Disallow sensitive routes
Disallow: /api/
Disallow: /_next/
Disallow: /admin/

# Machine-readable public content is intentionally crawlable.
Allow: /llms.txt
Allow: /llms-full.txt
Allow: /markdown/
Allow: /.well-known/
Allow: /auth.md
Allow: /mcp
`;

const NON_CANONICAL_ROBOTS = `# Non-canonical deployment — the canonical site is ${CANONICAL_ORIGIN}
User-agent: *
Disallow: /
`;

export function renderRobotsTxt(host: string | null): string {
  return isCanonicalRobotsHost(host) ? CANONICAL_ROBOTS : NON_CANONICAL_ROBOTS;
}
