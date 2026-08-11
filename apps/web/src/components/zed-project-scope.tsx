'use client';

import { ZedProjectProvider } from '@zed/sdk/react';
import { useParams } from 'next/navigation';

/**
 * Bridges Next's router into the router-agnostic SDK: derives the route's
 * project id the same way the hooks did when they read `useParams()` themselves
 * (any `[id]` segment), and injects it once for the whole app.
 */
export function ZedProjectScope({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const projectId = typeof params?.id === 'string' ? params.id : null;
  return <ZedProjectProvider projectId={projectId}>{children}</ZedProjectProvider>;
}
