/**
 * Local Session API Endpoints
 * 
 * Provides API endpoints for creating and managing local agent sessions
 * that run on the machine instead of in cloud sandboxes.
 */

import { createRoute, z } from '@hono/zod-openapi';
import { auth, errors, json } from '../../openapi';
import { assertProjectCapability, loadProjectForUser } from '../lib/access';
import { projectsApp } from '../lib/app';
import { PROJECT_ACTIONS } from '../../iam';
import { createLocalSession, getLocalSessionStatus, getLocalSessionOutput, stopLocalSession } from '../../platform/services/local-session-runner';

const CreateLocalSessionBody = z.object({
  agentName: z.string().optional().describe('Agent name to use'),
  prompt: z.string().min(1).max(10000).describe('Prompt to send to the agent'),
  branch: z.string().optional().describe('Branch to work on (defaults to main)'),
});

const LocalSessionResponse = z.object({
  sessionId: z.string(),
  status: z.string(),
  message: z.string(),
});

// Create a local session
projectsApp.openapi(
  createRoute({
    method: 'post',
    path: '/{projectId}/sessions/local',
    tags: ['projects'],
    summary: 'Create a local agent session (runs on this machine)',
    ...auth,
    request: {
      params: z.object({ projectId: z.string() }),
      body: { content: { 'application/json': { schema: CreateLocalSessionBody } } },
    },
    responses: {
      201: json(LocalSessionResponse, 'Local session created'),
      ...errors(400, 403, 404),
    },
  }),
  async (c: any) => {
    const projectId = c.req.param('projectId');
    const loaded = await loadProjectForUser(c, projectId, 'read');
    if (!loaded) return c.json({ error: 'Not found' }, 404);

    await assertProjectCapability(
      c,
      loaded.userId,
      loaded.row.accountId,
      projectId,
      PROJECT_ACTIONS.PROJECT_SESSION_START,
    );

    const parsed = CreateLocalSessionBody.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'Invalid body', details: parsed.error }, 400);

    const { agentName, prompt, branch } = parsed.data;

    // Get repo URL from project
    const repoUrl = loaded.row.repoUrl || loaded.row.gitOriginUrl;
    if (!repoUrl) {
      return c.json({ error: 'Project has no repository' }, 400);
    }

    // Create local session
    const sessionId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    try {
      await createLocalSession({
        sessionId,
        projectId,
        repoUrl,
        branch: branch || loaded.row.defaultBranch || 'main',
        agentName,
        prompt,
        userId: loaded.userId,
      });

      return c.json({
        sessionId,
        status: 'running',
        message: 'Local session created and running',
      }, 201);
    } catch (error: any) {
      return c.json({ error: 'Failed to create local session', details: error.message }, 500);
    }
  },
);

// Get local session status
projectsApp.openapi(
  createRoute({
    method: 'get',
    path: '/{projectId}/sessions/local/{sessionId}',
    tags: ['projects'],
    summary: 'Get local session status and output',
    ...auth,
    request: {
      params: z.object({
        projectId: z.string(),
        sessionId: z.string(),
      }),
    },
    responses: {
      200: json(z.any(), 'Session status'),
      ...errors(404),
    },
  }),
  async (c: any) => {
    const { projectId, sessionId } = c.req.param();
    const loaded = await loadProjectForUser(c, projectId, 'read');
    if (!loaded) return c.json({ error: 'Not found' }, 404);

    await assertProjectCapability(
      c,
      loaded.userId,
      loaded.row.accountId,
      projectId,
      PROJECT_ACTIONS.PROJECT_SESSION_READ,
    );

    const session = getLocalSessionStatus(sessionId);
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }

    return c.json({
      sessionId: session.id,
      status: session.status,
      output: session.output,
      createdAt: session.createdAt,
    });
  },
);

// Stop a local session
projectsApp.openapi(
  createRoute({
    method: 'post',
    path: '/{projectId}/sessions/local/{sessionId}/stop',
    tags: ['projects'],
    summary: 'Stop a running local session',
    ...auth,
    request: {
      params: z.object({
        projectId: z.string(),
        sessionId: z.string(),
      }),
    },
    responses: {
      200: json(z.any(), 'Session stopped'),
      ...errors(404),
    },
  }),
  async (c: any) => {
    const { projectId, sessionId } = c.req.param();
    const loaded = await loadProjectForUser(c, projectId, 'read');
    if (!loaded) return c.json({ error: 'Not found' }, 404);

    await assertProjectCapability(
      c,
      loaded.userId,
      loaded.row.accountId,
      projectId,
      PROJECT_ACTIONS.PROJECT_SESSION_DELETE,
    );

    await stopLocalSession(sessionId);

    return c.json({ message: 'Session stopped' });
  },
);
