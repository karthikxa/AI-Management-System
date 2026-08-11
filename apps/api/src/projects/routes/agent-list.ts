/**
 * List agents from database for a project
 */
import { createRoute, z } from '@hono/zod-openapi';
import { auth, errors, json } from '../../openapi';
import { assertProjectCapability, loadProjectForUser } from '../lib/access';
import { projectsApp } from '../lib/app';
import { PROJECT_ACTIONS } from '../../iam';

const AgentSchema = z.object({
  name: z.string(),
  displayName: z.string().nullable(),
  description: z.string().nullable(),
  agentType: z.string(),
  modelId: z.string().nullable(),
  status: z.string(),
  createdAt: z.string(),
});

projectsApp.openapi(
  createRoute({
    method: 'get',
    path: '/{projectId}/agents/list',
    tags: ['projects'],
    summary: 'List agents from database',
    ...auth,
    request: {
      params: z.object({ projectId: z.string() }),
    },
    responses: {
      200: json(z.object({ agents: z.array(AgentSchema) }), 'List of agents'),
      ...errors(403, 404),
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
      PROJECT_ACTIONS.PROJECT_AGENT_READ,
    );

    try {
      const { db } = await import('../../shared/db');
      const { sql } = await import('drizzle-orm');
      
      const result = await db.execute(sql`
        SELECT name, display_name, description, agent_type, model_id, status, created_at::text as created_at
        FROM kortix.project_agents 
        WHERE project_id = ${projectId}
        ORDER BY created_at DESC
      `);
      
      // Drizzle execute with sql template returns the rows array directly
      const agents = Array.isArray(result) ? result : (result as any).rows || [];
      return c.json({ agents });
    } catch (e) {
      console.error('[agent-list] DB error:', e);
      return c.json({ agents: [] });
    }
  },
);
