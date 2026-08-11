import { DISCOVERY_CACHE_CONTROL, ZED_PUBLIC_CONTENT_SKILL } from '@/lib/agent-discovery';

export const dynamic = 'force-static';

export function GET() {
  return new Response(ZED_PUBLIC_CONTENT_SKILL, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': DISCOVERY_CACHE_CONTROL,
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export const HEAD = GET;
