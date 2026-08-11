/**
 * Curated OpenCode event union for building a product chat UI — framework-free.
 *
 * `OpenCodeEvent` (`./event-stream.ts`) is the FULL raw wire union: ~50+
 * variants covering LSP, PTY, worktrees, plugins, projects, MCP, installation,
 * and more. A chat surface only ever cares about a small slice of that —
 * message/part updates, session status, questions, permissions, todos, and
 * connection health. `narrowChatEvent` filters + reshapes the raw stream down
 * to `ZedChatEvent`, so a host's dispatch switch only has to handle events
 * that actually matter to chat, each carrying a purpose-shaped payload
 * instead of the raw untyped `properties` bag.
 *
 * `heartbeat-gap` has no wire representation of its own — `openEventStream`'s
 * `onGapRehydrate(gapMs)` callback fires out-of-band when the SSE stream
 * reconnects after a gap large enough that cached state may be stale. Build
 * it with `heartbeatGapEvent(gapMs)` and dispatch it the same way as
 * `narrowChatEvent`'s output:
 *
 * ```ts
 * openEventStream({
 *   client,
 *   onEvent: (e) => {
 *     const chatEvent = narrowChatEvent(e);
 *     if (chatEvent) dispatch(chatEvent);
 *   },
 *   onGapRehydrate: (gapMs) => dispatch(heartbeatGapEvent(gapMs)),
 * });
 * ```
 */

import type { Message, Part, QuestionAnswer, SessionStatus, Todo } from '../runtime/client';
import type { OpenCodeEvent } from './event-stream';

export interface ZedChatEventMessageUpdated {
  type: 'message.updated';
  sessionID: string;
  message: Message;
}

export interface ZedChatEventMessageRemoved {
  type: 'message.removed';
  sessionID: string;
  messageID: string;
}

export interface ZedChatEventPartUpdated {
  type: 'message.part.updated';
  sessionID: string;
  part: Part;
}

export interface ZedChatEventPartRemoved {
  type: 'message.part.removed';
  sessionID: string;
  messageID: string;
  partID: string;
}

export interface ZedChatEventSessionStatus {
  type: 'session.status';
  sessionID: string;
  status: SessionStatus;
}

export interface ZedChatEventSessionIdle {
  type: 'session.idle';
  sessionID: string;
}

export interface ZedChatEventSessionError {
  type: 'session.error';
  sessionID?: string;
  error?: unknown;
}

export interface ZedChatQuestionOption {
  label: string;
  description: string;
}

export interface ZedChatQuestionInfo {
  question: string;
  header: string;
  options: ZedChatQuestionOption[];
  multiple?: boolean;
  custom?: boolean;
}

export interface ZedChatToolRef {
  messageID: string;
  callID: string;
}

export interface ZedChatEventQuestionAsked {
  type: 'question.asked';
  sessionID: string;
  requestID: string;
  questions: ZedChatQuestionInfo[];
  tool?: ZedChatToolRef;
}

/** Merges the wire's `question.replied` / `question.rejected` events — a host
 *  usually just needs to know "this pending question resolved" plus how. */
export interface ZedChatEventQuestionAnswered {
  type: 'question.answered';
  sessionID: string;
  requestID: string;
  outcome: 'replied' | 'rejected';
  answers?: QuestionAnswer[];
}

export interface ZedChatEventPermissionAsked {
  type: 'permission.asked';
  sessionID: string;
  requestID: string;
  permission: string;
  patterns: string[];
  tool?: ZedChatToolRef;
}

export interface ZedChatEventPermissionReplied {
  type: 'permission.replied';
  sessionID: string;
  requestID: string;
  reply: 'once' | 'always' | 'reject';
}

export interface ZedChatEventTodoUpdated {
  type: 'todo.updated';
  sessionID: string;
  todos: Todo[];
}

/** Fired once per SSE (re)connect — a host can use it to clear a "reconnecting…" banner. */
export interface ZedChatEventConnection {
  type: 'connection';
  status: 'connected';
}

/** Synthetic — see the module doc comment. Not derived from `narrowChatEvent`;
 *  built directly from `openEventStream`'s `onGapRehydrate(gapMs)`. */
export interface ZedChatEventHeartbeatGap {
  type: 'heartbeat-gap';
  gapMs: number;
}

export type ZedChatEvent =
  | ZedChatEventMessageUpdated
  | ZedChatEventMessageRemoved
  | ZedChatEventPartUpdated
  | ZedChatEventPartRemoved
  | ZedChatEventSessionStatus
  | ZedChatEventSessionIdle
  | ZedChatEventSessionError
  | ZedChatEventQuestionAsked
  | ZedChatEventQuestionAnswered
  | ZedChatEventPermissionAsked
  | ZedChatEventPermissionReplied
  | ZedChatEventTodoUpdated
  | ZedChatEventConnection
  | ZedChatEventHeartbeatGap;

/** Build the synthetic heartbeat-gap chat event from `openEventStream`'s `onGapRehydrate` callback. */
export function heartbeatGapEvent(gapMs: number): ZedChatEventHeartbeatGap {
  return { type: 'heartbeat-gap', gapMs };
}

/**
 * Narrow a raw `OpenCodeEvent` down to the curated `ZedChatEvent` union a
 * chat UI needs, reshaping `properties` into a purpose-built payload.
 *
 * Returns `null` for every event outside the curated set (LSP, PTY,
 * worktrees, plugins, projects, MCP, installation, session lifecycle CRUD,
 * …) — callers should treat `null` as "not a chat event, ignore" rather than
 * an error; this is a deliberate filter, not an exhaustive switch.
 */
export function narrowChatEvent(event: OpenCodeEvent): ZedChatEvent | null {
  switch (event.type) {
    case 'message.updated':
      return {
        type: 'message.updated',
        sessionID: event.properties.sessionID,
        message: event.properties.info,
      };

    case 'message.removed':
      return {
        type: 'message.removed',
        sessionID: event.properties.sessionID,
        messageID: event.properties.messageID,
      };

    case 'message.part.updated':
      return {
        type: 'message.part.updated',
        sessionID: event.properties.sessionID,
        part: event.properties.part,
      };

    case 'message.part.removed':
      return {
        type: 'message.part.removed',
        sessionID: event.properties.sessionID,
        messageID: event.properties.messageID,
        partID: event.properties.partID,
      };

    case 'session.status':
      return {
        type: 'session.status',
        sessionID: event.properties.sessionID,
        status: event.properties.status,
      };

    case 'session.idle':
      return { type: 'session.idle', sessionID: event.properties.sessionID };

    case 'session.error':
      return {
        type: 'session.error',
        sessionID: event.properties.sessionID,
        error: event.properties.error,
      };

    case 'question.asked':
      return {
        type: 'question.asked',
        sessionID: event.properties.sessionID,
        requestID: event.properties.id,
        questions: event.properties.questions,
        tool: event.properties.tool,
      };

    case 'question.replied':
      return {
        type: 'question.answered',
        sessionID: event.properties.sessionID,
        requestID: event.properties.requestID,
        outcome: 'replied',
        answers: event.properties.answers,
      };

    case 'question.rejected':
      return {
        type: 'question.answered',
        sessionID: event.properties.sessionID,
        requestID: event.properties.requestID,
        outcome: 'rejected',
      };

    case 'permission.asked':
      return {
        type: 'permission.asked',
        sessionID: event.properties.sessionID,
        requestID: event.properties.id,
        permission: event.properties.permission,
        patterns: event.properties.patterns,
        tool: event.properties.tool,
      };

    case 'permission.replied':
      return {
        type: 'permission.replied',
        sessionID: event.properties.sessionID,
        requestID: event.properties.requestID,
        reply: event.properties.reply,
      };

    case 'todo.updated':
      return {
        type: 'todo.updated',
        sessionID: event.properties.sessionID,
        todos: event.properties.todos,
      };

    case 'server.connected':
      return { type: 'connection', status: 'connected' };

    default:
      return null;
  }
}
