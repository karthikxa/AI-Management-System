import { eq } from 'drizzle-orm';
import { sandboxes, sessionSandboxes } from '@zed/db';
import { db } from '../shared/db';

/**
 * The serviceKey == the sandbox's ZED_TOKEN — the bearer the daemon's
 * `/zed/*` control routes (e.g. git/commit-push) authenticate against.
 *
 * Product sandboxes persist it in `sandboxes.config`; project-session
 * sandboxes persist it in `session_sandboxes.config`. resolveEndpoint must
 * check BOTH, or daemon control calls for session boxes 401 (which silently
 * dropped the working-tree flush on provider migration).
 */
export async function serviceKeyForExternalId(externalId: string): Promise<string | undefined> {
  const [sb] = await db
    .select({ config: sandboxes.config })
    .from(sandboxes)
    .where(eq(sandboxes.externalId, externalId))
    .limit(1);
  const fromSandboxes = (sb?.config as Record<string, unknown> | undefined)?.serviceKey as string | undefined;
  if (fromSandboxes) return fromSandboxes;

  const [ss] = await db
    .select({ config: sessionSandboxes.config })
    .from(sessionSandboxes)
    .where(eq(sessionSandboxes.externalId, externalId))
    .limit(1);
  return (ss?.config as Record<string, unknown> | undefined)?.serviceKey as string | undefined;
}
