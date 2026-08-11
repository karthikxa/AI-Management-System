/**
 * zed-master daemon client — the sandbox's project-management surface:
 * `/zed/tasks`, `/zed/tickets`, `/zed/projects` (+ its
 * columns/fields/templates/agents/pm-session/activity sub-routes),
 * `/zed/projects/:id/milestones`, `/zed/projects/:id/credentials`, and
 * `/zed/services`. Same shape as `./triggers` and `./env`: every call takes
 * an explicit `baseUrl` (never the globally active runtime — a host may be
 * looking at a specific project's owning sandbox that differs from the
 * currently active session), goes through `authenticatedFetch`, and surfaces
 * the daemon's JSON error body on non-2xx responses.
 *
 * Unlike `triggersRequest` (one generic passthrough for a single route
 * family), this module exposes a typed function per endpoint — mirroring
 * `./env`'s per-endpoint shape — because the six former web hooks each had
 * their own hand-rolled fetch helper and locally-defined request/response
 * types; this is those shapes moved down a layer, not a new design.
 *
 * The React Query layer (keys, caching, optimistic updates, `useAuth`-derived
 * actor identity) stays in `apps/web/src/hooks/**` — this module is transport
 * only. Reload (`/zed/services/system/reload`) already has a home in
 * `./client`'s `systemReload`; it is intentionally NOT duplicated here.
 */
import { authenticatedFetch } from '../http/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Request core
// ─────────────────────────────────────────────────────────────────────────────

/**
 * JSON request against `${baseUrl}${path}`, surfacing the daemon's error body
 * on non-2xx responses. Reads the body as text first and parses defensively
 * (falls back to `{}`) rather than assuming every response — success or
 * error, from every one of these routes — is guaranteed valid JSON; some
 * service actions reply with an empty body.
 */
async function zedMasterRequest<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
  fetchOptions?: { retryOnAuthError?: boolean },
): Promise<T> {
  let base = baseUrl;
  while (base.endsWith('/')) base = base.slice(0, -1);

  const response = await authenticatedFetch(
    `${base}${path}`,
    {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers as Record<string, string> | undefined),
      },
    },
    fetchOptions,
  );

  const text = await response.text();
  let body: any = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = {};
  }

  if (!response.ok) {
    throw new Error(
      body?.error || body?.message || body?.details || text.slice(0, 200) || `Request failed with ${response.status}`,
    );
  }
  return body as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tasks — /zed/tasks
// ─────────────────────────────────────────────────────────────────────────────

export type ZedTaskStatus =
  | 'todo'
  | 'in_progress'
  | 'input_needed'
  | 'awaiting_review'
  | 'completed'
  | 'cancelled';

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

export interface ZedTaskEvent {
  id: string;
  task_id: string;
  project_id: string;
  session_id: string | null;
  type:
    | 'progress'
    | 'blocker'
    | 'evidence'
    | 'verification_started'
    | 'verification_passed'
    | 'verification_failed'
    | 'delivered';
  message: string | null;
  payload_json: string | null;
  created_at: string;
}

export interface ZedTaskLiveStatus {
  task_id: string;
  status: ZedTaskStatus;
  latest_run_id: string | null;
  run_status: 'running' | 'input_needed' | 'awaiting_review' | 'completed' | 'cancelled' | 'failed' | null;
  owner_session_id: string | null;
  detail: string;
}

export interface ListTasksParams {
  projectId?: string;
  status?: string;
}

export interface CreateTaskInput {
  project_id: string;
  title: string;
  description?: string;
  verification_condition?: string;
  status?: ZedTaskStatus;
}

/** GET /zed/tasks?project_id=&status=. Returns raw rows — the daemon's
 * `status` isn't schema-validated, so callers normalize it (defaulting to
 * `'todo'`) before trusting `ZedTask['status']`. */
export async function listTasks(baseUrl: string, params: ListTasksParams = {}): Promise<unknown[]> {
  const search = new URLSearchParams();
  if (params.projectId) search.set('project_id', params.projectId);
  if (params.status) search.set('status', params.status);
  const qs = search.toString() ? `?${search}` : '';
  return zedMasterRequest<unknown[]>(baseUrl, `/zed/tasks${qs}`);
}

/** GET /zed/tasks/:id. Same normalization caveat as {@link listTasks}. */
export async function getTask(baseUrl: string, id: string): Promise<unknown> {
  return zedMasterRequest<unknown>(baseUrl, `/zed/tasks/${encodeURIComponent(id)}`);
}

export async function listTaskEvents(baseUrl: string, id: string): Promise<ZedTaskEvent[]> {
  return zedMasterRequest<ZedTaskEvent[]>(baseUrl, `/zed/tasks/${encodeURIComponent(id)}/events`);
}

export async function getTaskStatus(baseUrl: string, id: string): Promise<ZedTaskLiveStatus> {
  return zedMasterRequest<ZedTaskLiveStatus>(baseUrl, `/zed/tasks/${encodeURIComponent(id)}/status`);
}

export async function createTask(baseUrl: string, data: CreateTaskInput): Promise<ZedTask> {
  return zedMasterRequest<ZedTask>(baseUrl, '/zed/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTask(baseUrl: string, id: string, data: Partial<ZedTask>): Promise<ZedTask> {
  return zedMasterRequest<ZedTask>(baseUrl, `/zed/tasks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function startTask(baseUrl: string, id: string): Promise<ZedTask> {
  return zedMasterRequest<ZedTask>(baseUrl, `/zed/tasks/${encodeURIComponent(id)}/start`, {
    method: 'POST',
  });
}

export async function approveTask(baseUrl: string, id: string): Promise<ZedTask> {
  return zedMasterRequest<ZedTask>(baseUrl, `/zed/tasks/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
  });
}

export async function deleteTask(baseUrl: string, id: string): Promise<{ deleted: boolean }> {
  return zedMasterRequest<{ deleted: boolean }>(baseUrl, `/zed/tasks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Tickets — /zed/tickets
// ─────────────────────────────────────────────────────────────────────────────

export type AssigneeType = 'user' | 'agent';
export type ActorType = 'user' | 'agent' | 'system';
export type ExecutionMode = 'per_ticket' | 'per_assignment' | 'persistent';
export type ToolGroup = 'project_action' | 'project_manage';

export interface TicketAssignee {
  ticket_id: string;
  assignee_type: AssigneeType;
  assignee_id: string;
  assigned_at: string;
}

export interface TicketColumn {
  id: string;
  project_id: string;
  key: string;
  label: string;
  order_index: number;
  default_assignee_type: AssigneeType | null;
  default_assignee_id: string | null;
  is_terminal: number;
  is_off_flow: number;
  icon: string | null;
}

export interface Ticket {
  id: string;
  project_id: string;
  number: number;
  title: string;
  body_md: string;
  status: string;
  template_id: string | null;
  custom_fields_json: string;
  created_by_type: ActorType;
  created_by_id: string | null;
  parent_id: string | null;
  milestone_id: string | null;
  created_at: string;
  updated_at: string;
  assignees: TicketAssignee[];
  column?: TicketColumn | null;
}

export interface TicketEvent {
  id: string;
  ticket_id: string;
  project_id: string;
  actor_type: ActorType;
  actor_id: string | null;
  type: string;
  message: string | null;
  payload_json: string | null;
  created_at: string;
}

export interface ProjectField {
  id: string;
  project_id: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options_json: string | null;
  order_index: number;
}

export interface TicketTemplate {
  id: string;
  project_id: string;
  name: string;
  body_md: string;
  created_at: string;
}

export interface ProjectAgent {
  id: string;
  project_id: string;
  slug: string;
  name: string;
  file_path: string;
  session_id: string | null;
  execution_mode: ExecutionMode;
  tool_groups_json: string;
  default_assignee_columns_json: string;
  default_model: string | null;
  color_hue: number | null;
  icon: string | null;
  created_at: string;
}

export interface TriggeredAgent {
  agent_id: string;
  agent_slug: string;
  reason: string;
}

export interface CreateTicketInput {
  project_id: string;
  title: string;
  body_md?: string;
  status?: string;
  template_id?: string | null;
  custom_fields?: Record<string, unknown>;
  assign_to?: Array<{ type: AssigneeType; id: string }>;
  milestone_id?: string | null;
  parent_id?: string | null;
  actor_type: ActorType;
  actor_id: string;
  created_by_type: ActorType;
  created_by_id: string;
}

export interface UpdateTicketInput {
  title?: string;
  body_md?: string;
  template_id?: string | null;
  custom_fields?: Record<string, unknown>;
  milestone_id?: string | null;
  actor_type: ActorType;
  actor_id: string;
}

export async function listTickets(baseUrl: string, projectId?: string): Promise<Ticket[]> {
  const qs = projectId ? `?project_id=${encodeURIComponent(projectId)}` : '';
  return zedMasterRequest<Ticket[]>(baseUrl, `/zed/tickets${qs}`);
}

export async function getTicket(baseUrl: string, id: string): Promise<Ticket> {
  return zedMasterRequest<Ticket>(baseUrl, `/zed/tickets/${encodeURIComponent(id)}`);
}

export async function listTicketEvents(baseUrl: string, id: string): Promise<TicketEvent[]> {
  return zedMasterRequest<TicketEvent[]>(baseUrl, `/zed/tickets/${encodeURIComponent(id)}/events`);
}

export async function createTicket(
  baseUrl: string,
  body: CreateTicketInput,
): Promise<{ ticket: Ticket; triggered: TriggeredAgent[] }> {
  return zedMasterRequest(baseUrl, '/zed/tickets', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateTicket(baseUrl: string, id: string, body: Partial<UpdateTicketInput>): Promise<Ticket> {
  return zedMasterRequest<Ticket>(baseUrl, `/zed/tickets/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function updateTicketStatus(
  baseUrl: string,
  id: string,
  body: { status: string; actor_type: ActorType; actor_id: string },
): Promise<{ ticket: Ticket; triggered: TriggeredAgent[] }> {
  return zedMasterRequest(baseUrl, `/zed/tickets/${encodeURIComponent(id)}/status`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function assignTicket(
  baseUrl: string,
  id: string,
  body: { assignee_type: AssigneeType; assignee_id: string; actor_type: ActorType; actor_id: string },
): Promise<{ added: boolean; ticket: Ticket }> {
  return zedMasterRequest(baseUrl, `/zed/tickets/${encodeURIComponent(id)}/assign`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function unassignTicket(
  baseUrl: string,
  id: string,
  body: { assignee_type: AssigneeType; assignee_id: string; actor_type: ActorType; actor_id: string },
): Promise<{ removed: boolean; ticket: Ticket }> {
  return zedMasterRequest(baseUrl, `/zed/tickets/${encodeURIComponent(id)}/unassign`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function commentTicket(
  baseUrl: string,
  id: string,
  body: { body: string; actor_type: ActorType; actor_id: string },
): Promise<{ event: TicketEvent; mentions: string[]; triggered: Array<{ agent_slug: string }> }> {
  return zedMasterRequest(baseUrl, `/zed/tickets/${encodeURIComponent(id)}/comments`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function deleteTicket(baseUrl: string, id: string): Promise<{ deleted: true }> {
  return zedMasterRequest(baseUrl, `/zed/tickets/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ─────────────────────────────────────────────────────────────────────────────
// Columns — /zed/projects/:id/columns
// ─────────────────────────────────────────────────────────────────────────────

export interface ReplaceColumnInput {
  key: string;
  label: string;
  default_assignee_type?: AssigneeType | null;
  default_assignee_id?: string | null;
  is_terminal?: boolean;
  is_off_flow?: boolean;
  icon?: string | null;
}

export async function listColumns(baseUrl: string, projectId: string): Promise<TicketColumn[]> {
  return zedMasterRequest<TicketColumn[]>(baseUrl, `/zed/projects/${encodeURIComponent(projectId)}/columns`);
}

export async function replaceColumns(
  baseUrl: string,
  projectId: string,
  columns: ReplaceColumnInput[],
): Promise<TicketColumn[]> {
  return zedMasterRequest<TicketColumn[]>(baseUrl, `/zed/projects/${encodeURIComponent(projectId)}/columns`, {
    method: 'PUT',
    body: JSON.stringify({ columns }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Fields — /zed/projects/:id/fields
// ─────────────────────────────────────────────────────────────────────────────

export interface ReplaceFieldInput {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: string[] | null;
}

export async function listFields(baseUrl: string, projectId: string): Promise<ProjectField[]> {
  return zedMasterRequest<ProjectField[]>(baseUrl, `/zed/projects/${encodeURIComponent(projectId)}/fields`);
}

export async function replaceFields(
  baseUrl: string,
  projectId: string,
  fields: ReplaceFieldInput[],
): Promise<ProjectField[]> {
  return zedMasterRequest<ProjectField[]>(baseUrl, `/zed/projects/${encodeURIComponent(projectId)}/fields`, {
    method: 'PUT',
    body: JSON.stringify({ fields }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Templates — /zed/projects/:id/templates
// ─────────────────────────────────────────────────────────────────────────────

export interface ReplaceTemplateInput {
  name: string;
  body_md: string;
}

export async function listTemplates(baseUrl: string, projectId: string): Promise<TicketTemplate[]> {
  return zedMasterRequest<TicketTemplate[]>(baseUrl, `/zed/projects/${encodeURIComponent(projectId)}/templates`);
}

export async function replaceTemplates(
  baseUrl: string,
  projectId: string,
  templates: ReplaceTemplateInput[],
): Promise<TicketTemplate[]> {
  return zedMasterRequest<TicketTemplate[]>(
    baseUrl,
    `/zed/projects/${encodeURIComponent(projectId)}/templates`,
    { method: 'PUT', body: JSON.stringify({ templates }) },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PM chat session — /zed/projects/:id/pm-session
// ─────────────────────────────────────────────────────────────────────────────

/** Ensure (create-if-missing) a project-level session bound to the Project
 * Manager agent. Idempotent on the daemon — first call creates + binds,
 * subsequent calls return the existing session id. */
export async function ensurePmSession(baseUrl: string, projectId: string): Promise<{ session_id: string; reused: boolean }> {
  return zedMasterRequest(baseUrl, `/zed/projects/${encodeURIComponent(projectId)}/pm-session`, {
    method: 'POST',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Agents (project team) — /zed/projects/:id/agents
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateProjectAgentInput {
  slug: string;
  name: string;
  body_md: string;
  execution_mode?: ExecutionMode;
  tool_groups?: ToolGroup[];
  default_assignee_columns?: string[];
  default_model?: string | null;
  color_hue?: number | null;
  icon?: string | null;
}

export type UpdateProjectAgentInput = Partial<Omit<CreateProjectAgentInput, 'slug'>>;

export async function listProjectAgents(baseUrl: string, projectId: string): Promise<ProjectAgent[]> {
  return zedMasterRequest<ProjectAgent[]>(baseUrl, `/zed/projects/${encodeURIComponent(projectId)}/agents`);
}

export async function createProjectAgent(
  baseUrl: string,
  projectId: string,
  body: CreateProjectAgentInput,
): Promise<ProjectAgent> {
  return zedMasterRequest<ProjectAgent>(baseUrl, `/zed/projects/${encodeURIComponent(projectId)}/agents`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateProjectAgent(
  baseUrl: string,
  projectId: string,
  slug: string,
  body: UpdateProjectAgentInput,
): Promise<ProjectAgent> {
  return zedMasterRequest<ProjectAgent>(
    baseUrl,
    `/zed/projects/${encodeURIComponent(projectId)}/agents/${encodeURIComponent(slug)}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
}

export async function deleteProjectAgent(baseUrl: string, projectId: string, slug: string): Promise<{ deleted: true }> {
  return zedMasterRequest(
    baseUrl,
    `/zed/projects/${encodeURIComponent(projectId)}/agents/${encodeURIComponent(slug)}`,
    { method: 'DELETE' },
  );
}

export async function getAgentPersona(
  baseUrl: string,
  projectId: string,
  slug: string,
): Promise<{ agent: ProjectAgent; body_md: string }> {
  return zedMasterRequest(
    baseUrl,
    `/zed/projects/${encodeURIComponent(projectId)}/agents/${encodeURIComponent(slug)}/persona`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Project activity — /zed/projects/:id/activity
// ─────────────────────────────────────────────────────────────────────────────

export async function getProjectActivity(baseUrl: string, projectId: string, limit = 200): Promise<TicketEvent[]> {
  return zedMasterRequest<TicketEvent[]>(
    baseUrl,
    `/zed/projects/${encodeURIComponent(projectId)}/activity?limit=${limit}`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Projects — /zed/projects
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A project inside the sandbox's zed-master daemon — the `/zed/projects`
 * board surface (tasks, tickets, milestones), NOT the Zed platform project.
 * The platform's project is `ZedProject` in `core/rest/projects-client`.
 */
export interface ZedMasterProject {
  id: string;
  name: string;
  path: string;
  description: string;
  created_at: string;
  opencode_id: string | null;
  /** 1 = legacy tasks layout, 2 = new tickets/board. */
  structure_version?: number;
  sessionCount?: number;
  worktree?: string;
  time?: {
    created: number;
    updated: number;
    initialized?: number;
  };
}

/**
 * @deprecated Renamed to `ZedMasterProject` — it models the zed-master
 * daemon's board project, not the Zed platform project (which keeps the name
 * `ZedProject`, exported from the root barrel). Removed in the next major.
 */
export type ZedProject = ZedMasterProject;

export interface PatchZedMasterProjectInput {
  name?: string;
  description?: string;
  user_handle?: string | null;
}

/** @deprecated Renamed to `PatchZedMasterProjectInput`. Removed in the next major. */
export type PatchZedProjectInput = PatchZedMasterProjectInput;

export async function listZedProjects(baseUrl: string): Promise<ZedMasterProject[]> {
  return zedMasterRequest<ZedMasterProject[]>(baseUrl, '/zed/projects');
}

export async function getZedProject(baseUrl: string, id: string): Promise<ZedMasterProject> {
  return zedMasterRequest<ZedMasterProject>(baseUrl, `/zed/projects/${encodeURIComponent(id)}`);
}

export async function getZedProjectBySession(baseUrl: string, sessionId: string): Promise<ZedMasterProject> {
  return zedMasterRequest<ZedMasterProject>(baseUrl, `/zed/projects/by-session/${encodeURIComponent(sessionId)}`);
}

export async function listZedProjectSessions(baseUrl: string, projectId: string): Promise<unknown[]> {
  return zedMasterRequest<unknown[]>(baseUrl, `/zed/projects/${encodeURIComponent(projectId)}/sessions`);
}

export async function deleteZedProject(
  baseUrl: string,
  id: string,
): Promise<{ deleted: boolean; name: string; path: string }> {
  return zedMasterRequest(baseUrl, `/zed/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function patchZedProject(
  baseUrl: string,
  id: string,
  body: PatchZedMasterProjectInput,
): Promise<ZedMasterProject> {
  return zedMasterRequest<ZedMasterProject>(baseUrl, `/zed/projects/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Milestones — /zed/projects/:id/milestones
// ─────────────────────────────────────────────────────────────────────────────

export type MilestoneStatus = 'open' | 'closed' | 'cancelled';

export interface MilestoneProgress {
  total: number;
  done: number;
  in_progress: number;
  blocked: number;
  review: number;
  other: number;
}

export interface Milestone {
  id: string;
  project_id: string;
  number: number;
  title: string;
  description_md: string;
  acceptance_md: string;
  status: MilestoneStatus;
  due_at: string | null;
  completed_at: string | null;
  closed_by_type: 'user' | 'agent' | 'system' | null;
  closed_by_id: string | null;
  created_by_type: 'user' | 'agent' | 'system';
  created_by_id: string | null;
  color_hue: number | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
  progress: MilestoneProgress;
  percent_complete: number;
}

export interface MilestoneDetail extends Milestone {
  tickets: Ticket[];
}

export interface MilestoneEvent {
  id: string;
  milestone_id: string;
  project_id: string;
  actor_type: 'user' | 'agent' | 'system';
  actor_id: string | null;
  type: string;
  message: string | null;
  payload_json: string | null;
  created_at: string;
}

export interface CreateMilestoneBody {
  title: string;
  description_md?: string;
  acceptance_md?: string;
  due_at?: string | null;
  color_hue?: number | null;
  icon?: string | null;
}

export type UpdateMilestoneBody = Partial<
  Pick<Milestone, 'title' | 'description_md' | 'acceptance_md' | 'due_at' | 'color_hue' | 'icon'>
>;

export async function listMilestones(
  baseUrl: string,
  projectId: string,
  statusFilter: 'open' | 'closed' | 'all' = 'all',
): Promise<Milestone[]> {
  return zedMasterRequest<Milestone[]>(
    baseUrl,
    `/zed/projects/${encodeURIComponent(projectId)}/milestones?status=${statusFilter}`,
  );
}

export async function getMilestone(baseUrl: string, projectId: string, ref: string): Promise<MilestoneDetail> {
  return zedMasterRequest<MilestoneDetail>(
    baseUrl,
    `/zed/projects/${encodeURIComponent(projectId)}/milestones/${encodeURIComponent(ref)}`,
  );
}

export async function listMilestoneEvents(baseUrl: string, projectId: string, ref: string): Promise<MilestoneEvent[]> {
  return zedMasterRequest<MilestoneEvent[]>(
    baseUrl,
    `/zed/projects/${encodeURIComponent(projectId)}/milestones/${encodeURIComponent(ref)}/events`,
  );
}

export async function createMilestone(
  baseUrl: string,
  projectId: string,
  body: CreateMilestoneBody,
): Promise<Milestone> {
  return zedMasterRequest<Milestone>(
    baseUrl,
    `/zed/projects/${encodeURIComponent(projectId)}/milestones`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export async function updateMilestone(
  baseUrl: string,
  projectId: string,
  ref: string,
  patch: UpdateMilestoneBody,
): Promise<Milestone> {
  return zedMasterRequest<Milestone>(
    baseUrl,
    `/zed/projects/${encodeURIComponent(projectId)}/milestones/${encodeURIComponent(ref)}`,
    { method: 'PATCH', body: JSON.stringify(patch) },
  );
}

export async function closeMilestone(
  baseUrl: string,
  projectId: string,
  ref: string,
  body: { summary_md?: string; cancelled?: boolean },
): Promise<Milestone> {
  return zedMasterRequest<Milestone>(
    baseUrl,
    `/zed/projects/${encodeURIComponent(projectId)}/milestones/${encodeURIComponent(ref)}/close`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export async function reopenMilestone(baseUrl: string, projectId: string, ref: string): Promise<Milestone> {
  return zedMasterRequest<Milestone>(
    baseUrl,
    `/zed/projects/${encodeURIComponent(projectId)}/milestones/${encodeURIComponent(ref)}/reopen`,
    { method: 'POST' },
  );
}

export async function deleteMilestone(baseUrl: string, projectId: string, ref: string): Promise<{ ok: boolean }> {
  return zedMasterRequest(
    baseUrl,
    `/zed/projects/${encodeURIComponent(projectId)}/milestones/${encodeURIComponent(ref)}`,
    { method: 'DELETE' },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Credentials — /zed/projects/:id/credentials
// ─────────────────────────────────────────────────────────────────────────────

export interface CredentialItem {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  last_read_at: string | null;
}

export interface CredentialWithValue extends CredentialItem {
  value: string;
}

export interface CredentialEvent {
  id: string;
  project_id: string;
  credential_id: string | null;
  credential_name: string;
  actor_type: 'user' | 'agent' | 'system';
  actor_id: string | null;
  action: string;
  message: string | null;
  created_at: string;
}

export interface UpsertCredentialBody {
  name: string;
  value: string;
  description?: string | null;
}

export async function listCredentials(baseUrl: string, projectId: string): Promise<CredentialItem[]> {
  return zedMasterRequest<CredentialItem[]>(
    baseUrl,
    `/zed/projects/${encodeURIComponent(projectId)}/credentials`,
  );
}

export async function listCredentialEvents(
  baseUrl: string,
  projectId: string,
  name: string,
): Promise<CredentialEvent[]> {
  return zedMasterRequest<CredentialEvent[]>(
    baseUrl,
    `/zed/projects/${encodeURIComponent(projectId)}/credentials/${encodeURIComponent(name)}/events`,
  );
}

export async function upsertCredential(
  baseUrl: string,
  projectId: string,
  body: UpsertCredentialBody,
): Promise<CredentialItem> {
  return zedMasterRequest<CredentialItem>(
    baseUrl,
    `/zed/projects/${encodeURIComponent(projectId)}/credentials`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

/** Reveal returns the decrypted value. Each call is audit-logged as a read
 * by the daemon. */
export async function revealCredential(
  baseUrl: string,
  projectId: string,
  name: string,
): Promise<CredentialWithValue> {
  return zedMasterRequest<CredentialWithValue>(
    baseUrl,
    `/zed/projects/${encodeURIComponent(projectId)}/credentials/${encodeURIComponent(name)}`,
  );
}

export async function deleteCredential(
  baseUrl: string,
  projectId: string,
  name: string,
): Promise<{ ok: boolean }> {
  return zedMasterRequest(
    baseUrl,
    `/zed/projects/${encodeURIComponent(projectId)}/credentials/${encodeURIComponent(name)}`,
    { method: 'DELETE' },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Services — /zed/services
//
// These use a 10s client-side timeout and disable the shared 401-retry (a
// stale token shouldn't turn a 5s-polled services list into a retry storm) —
// both carried over verbatim from the pre-migration `use-sandbox-services.ts`.
// Reload (`/zed/services/system/reload`) is `systemReload` in `./client` —
// reuse that rather than adding a duplicate here.
// ─────────────────────────────────────────────────────────────────────────────

export type SandboxServiceStatus = 'running' | 'stopped' | 'starting' | 'failed' | 'backoff';
export type SandboxServiceAdapter = 'spawn' | 's6';
export type SandboxServiceScope = 'bootstrap' | 'core' | 'project' | 'session';
export type SandboxServiceAction = 'start' | 'stop' | 'restart' | 'delete';

export interface SandboxService {
  id: string;
  name: string;
  port: number;
  pid: number;
  framework: string;
  sourcePath: string;
  startedAt: string;
  status: SandboxServiceStatus;
  managed: boolean;
  adapter?: SandboxServiceAdapter;
  scope?: SandboxServiceScope;
  desiredState?: 'running' | 'stopped';
  builtin?: boolean;
  autoStart?: boolean;
}

export interface SandboxServiceTemplate {
  id: string;
  name: string;
  description: string;
  adapter: SandboxServiceAdapter;
  framework?: string;
  startCommand?: string;
  installCommand?: string | null;
  buildCommand?: string | null;
  defaultPort?: number;
}

export interface RegisterSandboxServicePayload {
  id: string;
  name?: string;
  adapter?: SandboxServiceAdapter;
  scope?: SandboxServiceScope;
  description?: string;
  projectId?: string | null;
  template?: string | null;
  framework?: string | null;
  sourcePath?: string | null;
  startCommand?: string | null;
  installCommand?: string | null;
  buildCommand?: string | null;
  envVarKeys?: string[];
  deps?: string[];
  port?: number | null;
  desiredState?: 'running' | 'stopped';
  autoStart?: boolean;
  restartPolicy?: 'always' | 'on-failure' | 'never';
  restartDelayMs?: number;
  s6ServiceName?: string | null;
  processPatterns?: string[];
  userVisible?: boolean;
  healthCheck?: {
    type?: 'none' | 'tcp' | 'http';
    path?: string;
    timeoutMs?: number;
  };
  startNow?: boolean;
}

const SERVICES_TIMEOUT_MS = 10_000;
const servicesFetchOptions = { retryOnAuthError: false } as const;

function servicesRequest<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  return zedMasterRequest<T>(
    baseUrl,
    path,
    { signal: AbortSignal.timeout(SERVICES_TIMEOUT_MS), ...init },
    servicesFetchOptions,
  );
}

export async function listServices(baseUrl: string, includeAll = false): Promise<SandboxService[]> {
  const query = includeAll ? '?all=true' : '';
  const data = await servicesRequest<{ services?: SandboxService[] }>(baseUrl, `/zed/services${query}`);
  return data.services ?? [];
}

export async function listServiceTemplates(baseUrl: string): Promise<SandboxServiceTemplate[]> {
  const data = await servicesRequest<{ templates?: SandboxServiceTemplate[] }>(baseUrl, '/zed/services/templates');
  return data.templates ?? [];
}

export async function getServiceLogs(baseUrl: string, serviceId: string): Promise<string[]> {
  const data = await servicesRequest<{ logs?: string[] }>(
    baseUrl,
    `/zed/services/${encodeURIComponent(serviceId)}/logs`,
  );
  return data.logs ?? [];
}

/** `start`/`stop`/`restart` POST `/zed/services/:id/:action`; `delete` DELETEs `/zed/services/:id`. */
export async function serviceAction(
  baseUrl: string,
  serviceId: string,
  action: SandboxServiceAction,
): Promise<unknown> {
  const isDelete = action === 'delete';
  const path = isDelete
    ? `/zed/services/${encodeURIComponent(serviceId)}`
    : `/zed/services/${encodeURIComponent(serviceId)}/${action}`;
  return servicesRequest(baseUrl, path, { method: isDelete ? 'DELETE' : 'POST' });
}

export async function reconcileServices(baseUrl: string, reload?: boolean): Promise<unknown> {
  const path = `/zed/services/reconcile${reload ? '?reload=true' : ''}`;
  return servicesRequest(baseUrl, path, { method: 'POST' });
}

export async function registerService(
  baseUrl: string,
  payload: RegisterSandboxServicePayload,
): Promise<{ success: boolean; output?: string; service?: SandboxService }> {
  return servicesRequest(baseUrl, '/zed/services/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
