import { cors } from 'hono/cors';

const CLOUD_ORIGINS = [
  'https://www.zed.com',
  'https://zed.com',
  'https://dev.zed.com',
  'https://new-dev.zed.com',
  'https://dev-new.zed.com',
  'https://staging.zed.com',
  'https://zed.cloud',
  'https://www.zed.cloud',
  'https://new.zed.com',
];

const LOCAL_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3010',
  'http://127.0.0.1:3010',
];

const PREVIEW_ORIGIN = /^https:\/\/[a-z0-9-]+\.(vercel\.app|preview\.zed\.com)$/i;

interface CorsMiddlewareOptions {
  internalEnvironment: string;
  extraOrigins: string[];
}

export function createCorsMiddleware(options: CorsMiddlewareOptions) {
  const allowedOrigins = new Set([
    ...CLOUD_ORIGINS,
    ...LOCAL_ORIGINS,
    ...options.extraOrigins.map((origin) => origin.trim()).filter(Boolean),
  ]);
  const allowPreviewOrigins = options.internalEnvironment === 'preview';

  return cors({
    origin: (origin) => {
      if (!origin) return origin;
      if (allowedOrigins.has(origin)) return origin;
      if (allowPreviewOrigins && PREVIEW_ORIGIN.test(origin)) return origin;
      return null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Zed-Token',
      'X-Api-Key',
      'Accept',
      'X-Zed-Signature',
      'X-Hub-Signature-256',
      'traceparent',
      'tracestate',
      'X-Request-Id',
      'Last-Event-ID',
      'X-Zed-Client',
    ],
    exposeHeaders: [
      'X-Next-Cursor',
      'X-Request-Id',
      'X-Audit-Row-Count',
      'X-Audit-Capped',
      'X-Audit-Complete',
      'X-Audit-Next-Cursor',
    ],
    credentials: true,
    maxAge: 600,
  });
}
