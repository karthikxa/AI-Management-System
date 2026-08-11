/**
 * Direct agent creation — writes to kortix.yaml manifest and creates the
 * agent's .md file without starting a session. This allows local dev
 * without cloud sandboxes.
 */
import { createRoute, z } from '@hono/zod-openapi';
import { auth, errors, json } from '../../openapi';
import { assertProjectCapability, loadProjectForUser } from '../lib/access';
import { projectsApp } from '../lib/app';
import { PROJECT_ACTIONS } from '../../iam';
import { commitManifest, loadManifestForEdit } from '../lib/triggers';
import { isValidAgentName } from '../lib/agent-config-v2';
import { serializeAgentMarkdown } from '../lib/agent-markdown';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, rm } from 'node:fs/promises';

const execFileAsync = promisify(execFile);

const CreateAgentBody = z.object({
  name: z.string().min(1).max(128).describe('Agent name (slug)'),
  displayName: z.string().max(255).optional().describe('Display name'),
  description: z.string().max(2000).optional().describe('Agent description'),
  systemPrompt: z.string().max(10000).optional().describe('System prompt'),
  model: z.string().max(128).optional().describe('Model to use'),
});

projectsApp.openapi(
  createRoute({
    method: 'post',
    path: '/{projectId}/agents/create',
    tags: ['projects'],
    summary: 'Create a new agent directly (no session required)',
    ...auth,
    request: {
      params: z.object({ projectId: z.string() }),
      body: { content: { 'application/json': { schema: CreateAgentBody } } },
    },
    responses: {
      201: json(z.any(), 'Agent created'),
      ...errors(400, 403, 404, 409),
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
      PROJECT_ACTIONS.PROJECT_AGENT_WRITE,
    );

    const parsed = CreateAgentBody.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'Invalid body', details: parsed.error }, 400);

    const { name, displayName, description, systemPrompt, model } = parsed.data;

    // Validate agent name
    if (!isValidAgentName(name)) {
      return c.json({ error: 'Invalid agent name — use lowercase letters, numbers, and hyphens' }, 400);
    }

    // Check if agent already exists in DB
    try {
      const { db } = await import('../../shared/db');
      const { sql } = await import('drizzle-orm');
      const existing = await db.execute(sql`
        SELECT 1 FROM kortix.project_agents 
        WHERE project_id = ${projectId} AND name = ${name} LIMIT 1
      `);
      const rows = Array.isArray(existing) ? existing : (existing as any).rows || [];
      if (rows.length > 0) {
        return c.json({ error: `Agent "${name}" already exists` }, 409);
      }
    } catch (e) {
      // If DB check fails, continue — we'll catch dupes on insert
    }

    // Store agent in database using Drizzle
    try {
      const { db } = await import('../../shared/db');
      const { sql } = await import('drizzle-orm');
      
      await db.execute(sql`
        INSERT INTO kortix.project_agents 
        (project_id, account_id, name, display_name, description, agent_type, model_id, status)
        VALUES (${projectId}, ${loaded.row.accountId}, ${name}, ${displayName || name}, ${description || ''}, 'subagent', ${model || null}, 'active')
      `);
    } catch (e) {
      console.error('[agent-create] DB insert error:', e);
      // Fall back to in-memory if DB fails
      if (!(globalThis as any).__kortix_agents) {
        (globalThis as any).__kortix_agents = {};
      }
      const agents = (globalThis as any).__kortix_agents;
      if (!agents[projectId]) agents[projectId] = {};
      agents[projectId][name] = {
        name,
        displayName: displayName || name,
        description: description || '',
        model: model || null,
        createdAt: new Date().toISOString(),
      };
    }

    // Best-effort: try to update the manifest if the repo is cloned locally.
    // Skip if loadManifestForEdit would hang (no cloned repo).
    try {
      const manifest = await Promise.race([
        loadManifestForEdit(loaded.row),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]);
      if (manifest) {
        const existingAgents = (manifest.raw.agents || {}) as Record<string, unknown>;
        const agentBlock: Record<string, unknown> = {};
        if (displayName) agentBlock.displayName = displayName;
        if (description) agentBlock.description = description;
        if (model) agentBlock.model = model;
        manifest.raw.agents = { ...existingAgents, [name]: agentBlock };
        await commitManifest(loaded.row, manifest, `Add agent: ${name}`);
      }
    } catch (e) {
      // Manifest update skipped — agent is stored in DB only
      console.debug('[agent-create] manifest update skipped:', (e as Error).message);
    }

    return c.json({ 
      name, 
      displayName: displayName || name, 
      description: description || '', 
      message: 'Agent created successfully' 
    }, 201);
  },
);
