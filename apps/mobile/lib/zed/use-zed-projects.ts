/**
 * Zed Projects hooks — ported from apps/web/src/hooks/zed/use-zed-projects.ts
 *
 * Fetches from zed-master's /zed/projects API through the sandbox URL.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthToken } from '@/api/config';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ZedProject {
  id: string;
  name: string;
  path: string;
  description: string;
  created_at: string;
  opencode_id: string | null;
  sessionCount?: number;
  // Extended properties from OpenCode Project
  worktree?: string;
  time?: {
    created: number;
    updated: number;
    initialized?: number;
  };
}

// Task status — aligned with the live Zed task pipeline.
// Pipeline: todo → [START] → in_progress → input_needed/awaiting_review → [APPROVE] → completed
export type ZedTaskStatus =
  | 'todo'
  | 'in_progress'
  | 'input_needed'
  | 'awaiting_review'
  | 'completed'
  | 'cancelled';

const VALID_TASK_STATUSES: ZedTaskStatus[] = [
  'todo',
  'in_progress',
  'input_needed',
  'awaiting_review',
  'completed',
  'cancelled',
];

/** Map legacy statuses from older backends to the new schema */
function normalizeTaskStatus(status: unknown): ZedTaskStatus {
  if (typeof status !== 'string') return 'todo';
  if ((VALID_TASK_STATUSES as string[]).includes(status)) return status as ZedTaskStatus;
  // Back-compat mapping for pre-26cf37f data
  if (status === 'pending') return 'todo';
  if (status === 'done') return 'completed';
  if (status === 'blocked') return 'input_needed';
  return 'todo';
}

function normalizeTask(raw: any): ZedTask {
  return {
    id: raw.id,
    project_id: raw.project_id,
    title: raw.title || '',
    description: raw.description || '',
    verification_condition: raw.verification_condition || '',
    status: normalizeTaskStatus(raw?.status),
    result: raw.result ?? null,
    verification_summary: raw.verification_summary ?? null,
    blocking_question: raw.blocking_question ?? null,
    owner_session_id: raw.owner_session_id ?? null,
    owner_agent: raw.owner_agent ?? null,
    requested_by_session_id: raw.requested_by_session_id ?? null,
    started_at: raw.started_at ?? null,
    completed_at: raw.completed_at ?? null,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export interface ZedTask {
  id: string;
  project_id: string;
  title: string;
  description: string;
  verification_condition: string;
  status: ZedTaskStatus;
  result: string | null;
  verification_summary: string | null;
  blocking_question: string | null;
  owner_session_id: string | null;
  owner_agent: string | null;
  requested_by_session_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ZedAgent {
  id: string;
  project_id: string;
  session_id: string;
  parent_session_id: string;
  agent_type: string;
  description: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  result: string | null;
  verification_summary: string | null;
  blocking_question: string | null;
  owner_session_id: string | null;
  owner_agent: string | null;
  requested_by_session_id?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

// ── Fetch helper ─────────────────────────────────────────────────────────────

async function zedFetch<T>(sandboxUrl: string, path: string, init?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const url = `${sandboxUrl.replace(/\/+$/, '')}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Zed API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ── Query keys ───────────────────────────────────────────────────────────────

export const zedKeys = {
  projects: (url: string) => ['zed', 'projects', url] as const,
  project: (url: string, id: string) => ['zed', 'projects', url, id] as const,
  projectSessions: (url: string, id: string) =>
    ['zed', 'projects', url, id, 'sessions'] as const,
  tasks: (url: string, projectId: string) => ['zed', 'tasks', url, projectId] as const,
  agents: (url: string, projectId: string) => ['zed', 'agents', url, projectId] as const,
  connectors: (url: string) => ['zed', 'connectors', url] as const,
};

// ── Connector types & hooks ──────────────────────────────────────────────────

export interface ZedConnector {
  id: string;
  name: string;
  description: string | null;
  source: string | null;
  pipedream_slug: string | null;
  env_keys: string[] | null;
  notes: string | null;
  auto_generated: boolean;
  created_at: string;
  updated_at: string;
}

export function useZedConnectors(sandboxUrl: string | undefined) {
  return useQuery<ZedConnector[]>({
    queryKey: zedKeys.connectors(sandboxUrl || ''),
    queryFn: async () => {
      const data = await zedFetch<{ connectors?: ZedConnector[] } | ZedConnector[]>(
        sandboxUrl!,
        '/zed/connectors',
      );
      if (Array.isArray(data)) return data;
      return data.connectors ?? [];
    },
    enabled: !!sandboxUrl,
    staleTime: 30_000,
    retry: 2,
  });
}

// ── Project hooks ────────────────────────────────────────────────────────────

export function useZedProjects(sandboxUrl: string | undefined) {
  return useQuery<ZedProject[]>({
    queryKey: zedKeys.projects(sandboxUrl || ''),
    queryFn: () => zedFetch<ZedProject[]>(sandboxUrl!, '/zed/projects'),
    enabled: !!sandboxUrl,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

export function useZedProject(sandboxUrl: string | undefined, id: string) {
  return useQuery<ZedProject>({
    queryKey: zedKeys.project(sandboxUrl || '', id),
    queryFn: () =>
      zedFetch<ZedProject>(sandboxUrl!, `/zed/projects/${encodeURIComponent(id)}`),
    enabled: !!sandboxUrl && !!id,
    staleTime: 15_000,
    retry: 2,
  });
}

export function useZedProjectSessions(sandboxUrl: string | undefined, projectId: string) {
  return useQuery<any[]>({
    queryKey: zedKeys.projectSessions(sandboxUrl || '', projectId),
    queryFn: () =>
      zedFetch<any[]>(sandboxUrl!, `/zed/projects/${encodeURIComponent(projectId)}/sessions`),
    enabled: !!sandboxUrl && !!projectId,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

export function useZedTasks(sandboxUrl: string | undefined, projectId: string | undefined) {
  const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : '';
  return useQuery<ZedTask[]>({
    queryKey: zedKeys.tasks(sandboxUrl || '', projectId || ''),
    queryFn: async () => {
      const rows = await zedFetch<any[]>(sandboxUrl!, `/zed/tasks${qs}`);
      return Array.isArray(rows) ? rows.map(normalizeTask) : [];
    },
    enabled: !!sandboxUrl && !!projectId,
    refetchInterval: 5000,
    retry: 2,
  });
}

/** Fetch a single task by ID (ported from web 26cf37f). */
export function useZedTask(sandboxUrl: string | undefined, id: string | undefined) {
  return useQuery<ZedTask>({
    queryKey: ['zed', 'tasks', sandboxUrl || '', 'detail', id || ''],
    queryFn: async () => {
      const raw = await zedFetch<any>(sandboxUrl!, `/zed/tasks/${encodeURIComponent(id!)}`);
      return normalizeTask(raw);
    },
    enabled: !!sandboxUrl && !!id,
    refetchInterval: 5000,
    retry: 2,
  });
}

export function useZedAgents(sandboxUrl: string | undefined, projectId: string | undefined) {
  const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : '';
  return useQuery<ZedAgent[]>({
    queryKey: zedKeys.agents(sandboxUrl || '', projectId || ''),
    queryFn: async () => {
      try {
        return await zedFetch<ZedAgent[]>(sandboxUrl!, `/zed/agents${qs}`);
      } catch {
        return [];
      }
    },
    enabled: !!sandboxUrl && !!projectId,
    refetchInterval: 5000,
  });
}
// ── Mutation hooks ───────────────────────────────────────────────────────────

export function useUpdateProject(sandboxUrl: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string }) =>
      zedFetch<ZedProject>(sandboxUrl!, `/zed/projects/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, vars) => {
      if (sandboxUrl) {
        qc.invalidateQueries({ queryKey: zedKeys.project(sandboxUrl, vars.id) });
        qc.invalidateQueries({ queryKey: zedKeys.projects(sandboxUrl) });
      }
    },
  });
}

export function useDeleteProject(sandboxUrl: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      zedFetch<{ deleted: boolean; name: string; path: string }>(
        sandboxUrl!,
        `/zed/projects/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
        }
      ),
    onSuccess: () => {
      if (sandboxUrl) {
        qc.invalidateQueries({ queryKey: zedKeys.projects(sandboxUrl) });
      }
    },
  });
}

// ── Task mutation hooks (ported from web 8e1bc7b + 26cf37f) ─────────────────

export function useCreateZedTask(sandboxUrl: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      project_id: string;
      title: string;
      description?: string;
      verification_condition?: string;
      status?: ZedTaskStatus;
    }) => {
      const raw = await zedFetch<any>(sandboxUrl!, `/zed/tasks`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return normalizeTask(raw);
    },
    onSuccess: () => {
      if (sandboxUrl) {
        qc.invalidateQueries({ queryKey: ['zed', 'tasks', sandboxUrl] });
      }
    },
  });
}

export function useUpdateZedTask(sandboxUrl: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<ZedTask>) => {
      const raw = await zedFetch<any>(sandboxUrl!, `/zed/tasks/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return normalizeTask(raw);
    },
    onSuccess: () => {
      if (sandboxUrl) {
        // Invalidate all task queries for this sandbox
        qc.invalidateQueries({ queryKey: ['zed', 'tasks', sandboxUrl] });
      }
    },
  });
}

/** Start a task — transitions it from `todo` → `in_progress` (ported from web 26cf37f) */
export function useStartZedTask(sandboxUrl: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      session_id,
      agent,
    }: {
      id: string;
      session_id?: string;
      agent?: string;
    }) => {
      const raw = await zedFetch<any>(
        sandboxUrl!,
        `/zed/tasks/${encodeURIComponent(id)}/start`,
        {
          method: 'POST',
          body: JSON.stringify({ session_id, agent }),
        }
      );
      return normalizeTask(raw);
    },
    onSuccess: () => {
      if (sandboxUrl) {
        qc.invalidateQueries({ queryKey: ['zed', 'tasks', sandboxUrl] });
      }
    },
  });
}

/** Approve a task waiting for input/review — transitions it to `completed` (ported from web 26cf37f) */
export function useApproveZedTask(sandboxUrl: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const raw = await zedFetch<any>(
        sandboxUrl!,
        `/zed/tasks/${encodeURIComponent(id)}/approve`,
        {
          method: 'POST',
        }
      );
      return normalizeTask(raw);
    },
    onSuccess: () => {
      if (sandboxUrl) {
        qc.invalidateQueries({ queryKey: ['zed', 'tasks', sandboxUrl] });
      }
    },
  });
}

export function useDeleteZedTask(sandboxUrl: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      zedFetch<{ deleted: boolean }>(sandboxUrl!, `/zed/tasks/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      if (sandboxUrl) {
        qc.invalidateQueries({ queryKey: ['zed', 'tasks', sandboxUrl] });
      }
    },
  });
}
