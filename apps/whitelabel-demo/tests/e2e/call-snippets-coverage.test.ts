/**
 * Every KaaB action this app performs must show its call.
 *
 * The snippet panel is a product surface, not a debug aid: a wrapper author
 * reads Lumen to learn what to call, so an action the app performs with no
 * snippet is a gap in the documentation, not a missing nicety. The failure mode
 * this file exists to prevent is quiet — somebody adds a control, ships it, and
 * the panel simply never mentions it.
 *
 * WHAT KEEPS THIS HONEST, exactly: the list of actions is NOT hand-written.
 * `callSignatures()` below reads the app's own source and extracts every
 * `@zed/sdk` call it makes, normalised to `zed.project().secrets.remove()`
 * form. The hand-maintained part is only the VERDICT on each one — a snippet id,
 * or a reason it needs none — and a call the source contains that the table does
 * not mention fails the run. So adding a new SDK call to this app turns this
 * suite red until somebody decides, in writing, whether wrapper authors are
 * shown it. Deleting one goes red too, so the reasons cannot rot into fiction
 * about calls that no longer exist.
 *
 * Two deliberate limits, both closed rather than ignored:
 *  - `src/lib/call-snippets.ts` is EXCLUDED from the scan. It quotes SDK calls
 *    in its snippet text, and scanning it would let a snippet prove the app
 *    makes a call by being the only thing that mentions it.
 *  - the scanner only sees calls written as `zed.…`. Actions that go through
 *    `@zed/sdk/react` hooks or a hand-built request never appear, so those
 *    are declared in `OFF_CHAIN_ACTIONS` with a source marker that must still
 *    exist — an entry cannot survive the code it describes.
 *
 * TO EXTEND: add your call to `ACTIONS` with either a `CallSnippetId` — a list
 * of them when one call is worth two snippets — and mount `<CallSnippet id="…">`
 * next to the control that performs it, or one of the `REASONS` keys. Add a new
 * reason only if none of the existing ones is true of your call.
 */

import { describe, expect, test } from 'bun:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  CALL_SNIPPET_IDS,
  type CallSnippetId,
  callSnippet,
  callSnippets,
  renderHttp,
} from '../../src/lib/call-snippets';
import { APP_ROOT } from './harness';

const SRC_ROOT = join(APP_ROOT, 'src');
const REMOVED_ATTRIBUTION_PATTERN = new RegExp(
  `${['end', 'user', 'ref'].join('_')}|${['origin', 'ref'].join('_')}`,
);

/** The snippet builder and its renderer quote calls; see the header. */
const NOT_APP_BEHAVIOUR = [
  'src/lib/call-snippets.ts',
  'src/components/dev/call-snippet.tsx',
];

// ── Reading the app's own source ─────────────────────────────────────────────

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry) ? [path] : [];
  });
}

/** Skip a balanced argument list, quotes included, from the `(` at `i`. */
function skipCall(src: string, i: number): number {
  let depth = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      i++;
      while (i < src.length) {
        if (src[i] === '\\') i += 2;
        else if (src[i] === quote) {
          i++;
          break;
        } else i++;
      }
      continue;
    }
    if (c === '(') depth++;
    else if (c === ')') {
      depth--;
      i++;
      if (depth === 0) return i;
      continue;
    }
    i++;
  }
  return i;
}

/** Walk one `.a.b(…).c(…)` chain, collapsing every argument list to `()`. */
function chainFrom(
  src: string,
  start: number,
  base: string,
): { sig: string; end: number } {
  let i = start;
  let sig = base;
  for (;;) {
    if (src[i] === '.') {
      const id = /^[A-Za-z_$][\w$]*/.exec(src.slice(i + 1));
      if (!id) break;
      sig += `.${id[0]}`;
      i += 1 + id[0].length;
      continue;
    }
    const ws = /^\s+/.exec(src.slice(i));
    if (ws) {
      i += ws[0].length;
      continue;
    }
    if (src[i] === '(') {
      i = skipCall(src, i);
      sig += '()';
      continue;
    }
    break;
  }
  return { sig, end: i };
}

/** `const x = zed.session(a, b)` — so what is called on `x` later counts too. */
const HANDLE_ASSIGNMENT =
  /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::\s*[^=]+)?=\s*(?:useMemo\(\s*\([^)]*\)\s*=>\s*)?$/;

/** Promise plumbing is not part of the call being made. */
const PROMISE_TAIL = /(?:\.(?:then|catch|finally)\(\))+$/;

/**
 * Every `@zed/sdk` call one file makes, as `zed.a.b()` signatures.
 *
 * Handles bound to a variable are followed, because `const s = zed.session(…)`
 * then `s.delete()` is the same action as calling it inline — and a coverage
 * check that missed it would be trivially defeated by ordinary refactoring.
 */
export function callSignatures(source: string): string[] {
  // `ctx.zed` is the same client, passed through a server route's context.
  const src = source.replace(/\bctx\.zed\b/g, 'zed');
  const signatures: string[] = [];
  const handles = new Map<string, string>();

  const anchor = /(?<![\w$.])zed(?![\w$])/g;
  let match: RegExpExecArray | null;
  while ((match = anchor.exec(src))) {
    const { sig, end } = chainFrom(
      src,
      match.index + 'zed'.length,
      'zed',
    );
    signatures.push(sig);
    const assignment = HANDLE_ASSIGNMENT.exec(
      src.slice(Math.max(0, match.index - 120), match.index),
    );
    if (assignment) handles.set(assignment[1], sig);
    anchor.lastIndex = Math.max(anchor.lastIndex, end);
  }

  for (const [name, base] of handles) {
    const usage = new RegExp(`(?<![\\w$.])${name}(?![\\w$])`, 'g');
    let use: RegExpExecArray | null;
    while ((use = usage.exec(src))) {
      const { sig, end } = chainFrom(src, use.index + name.length, base);
      if (sig !== base) signatures.push(sig);
      usage.lastIndex = Math.max(usage.lastIndex, end);
    }
  }

  return (
    signatures
      .map((sig) => sig.replace(PROMISE_TAIL, ''))
      // Only actual calls: a bare `zed.project().git` is a doc comment or a
      // property read, not a request.
      .filter((sig) => sig.endsWith('()'))
  );
}

/** Signature -> the files that make that call. */
function scanApp(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  for (const path of sourceFiles(SRC_ROOT)) {
    const file = relative(APP_ROOT, path);
    if (NOT_APP_BEHAVIOUR.includes(file)) continue;
    for (const sig of callSignatures(readFileSync(path, 'utf8'))) {
      const files = found.get(sig) ?? [];
      if (!files.includes(file)) files.push(file);
      found.set(sig, files);
    }
  }
  return found;
}

// ── The verdicts ─────────────────────────────────────────────────────────────

/**
 * Why a call the app makes needs no snippet. Each one is a claim about the
 * call, not about how interesting it is — if none of these is TRUE of a new
 * call, it needs a snippet.
 */
const REASONS = {
  'account-admin':
    'Account administration. `src/server/policy.ts` denies every `/accounts*` route but `accounts/me` in wrapper mode, so this is direct-mode UI a wrapper end user cannot reach at all.',
  'dashboard-parity':
    'Not a KaaB action: Lumen mirrors the Zed dashboard here (project settings, workspace files, git, change requests, previews, and the reads that back those screens). Ownership-gated like everything under `projects/{id}`, but the proxy neither narrows the request nor stamps a field on it, so a wrapper author writes the same call an operator does.',
  'sdk-handle':
    'Builds an SDK handle or resolves the session runtime rather than issuing a REST request a wrapper author writes themselves — `session.prompt` is where that transport is explained.',
} as const;

type Reason = keyof typeof REASONS;

/** The snippet ids a verdict names — none, when the verdict is a reason. */
function snippetIds(
  verdict: CallSnippetId | CallSnippetId[] | Reason,
): CallSnippetId[] {
  if (Array.isArray(verdict)) return verdict;
  return verdict in REASONS ? [] : [verdict as CallSnippetId];
}

/**
 * Every `@zed/sdk` call this app makes, and what the panel does about it.
 *
 * Keys are exactly what `callSignatures()` produces. A key here that the source
 * no longer contains fails, and a call in the source that is missing here fails
 * — the two directions together are what stop this from drifting into a list of
 * things that used to be true.
 */
const ACTIONS: Record<string, CallSnippetId | CallSnippetId[] | Reason> = {
  // ── Shown, with the control that performs it ───────────────────────────────
  'zed.projects.provision()': 'project.provision',
  'zed.projects.list()': 'project.provision',
  'zed.project().connectors.connections.list()': 'connections.list',
  'zed.project().sessions.create()': 'session.create',
  'zed.session().changeModel()': 'session.model',
  'zed.session().scope()': 'session.rescope',
  'zed.session().rescope()': 'session.rescope',
  'zed.project().sessions.list()': 'sessions.list',
  'zed.session().restart()': 'session.delete',
  'zed.session().delete()': 'session.delete',
  'zed.billing.sessionCosts.list()': 'session.costs',
  'zed.project().approvals.resolve()': 'approval.resolve',
  'zed.project().secrets.upsert()': 'secret.upsert',
  'zed.project().secrets.remove()': 'secret.delete',
  'zed.project().setupLinks.requestConnector()': 'connector.connect-link',

  // ── Account administration ────────────────────────────────────────────────
  'zed.accounts.create()': 'account-admin',
  'zed.accounts.get()': 'account-admin',
  'zed.accounts.invite()': 'account-admin',
  'zed.accounts.invites()': 'account-admin',
  'zed.accounts.leave()': 'account-admin',
  'zed.accounts.list()': 'account-admin',
  'zed.accounts.members()': 'account-admin',
  'zed.accounts.removeMember()': 'account-admin',
  'zed.accounts.updateMemberRole()': 'account-admin',
  'zed.accounts.updateName()': 'account-admin',
  'zed.projects.listForAccount()': 'account-admin',

  // ── Project administration + workspace (dashboard parity) ─────────────────
  'zed.project().access.approveRequest()': 'dashboard-parity',
  'zed.project().access.groupGrants()': 'dashboard-parity',
  'zed.project().access.invite()': 'dashboard-parity',
  'zed.project().access.list()': 'dashboard-parity',
  'zed.project().access.pendingInvites()': 'dashboard-parity',
  'zed.project().access.rejectRequest()': 'dashboard-parity',
  'zed.project().access.requests()': 'dashboard-parity',
  'zed.project().access.resendInvite()': 'dashboard-parity',
  'zed.project().access.revoke()': 'dashboard-parity',
  'zed.project().access.revokeInvite()': 'dashboard-parity',
  'zed.project().access.update()': 'dashboard-parity',
  'zed.project().archive()': 'dashboard-parity',
  'zed.project().changeRequests.close()': 'dashboard-parity',
  'zed.project().changeRequests.diff()': 'dashboard-parity',
  'zed.project().changeRequests.get()': 'dashboard-parity',
  'zed.project().changeRequests.list()': 'dashboard-parity',
  'zed.project().changeRequests.merge()': 'dashboard-parity',
  'zed.project().changeRequests.mergePreview()': 'dashboard-parity',
  'zed.project().changeRequests.open()': 'dashboard-parity',
  'zed.project().changeRequests.reopen()': 'dashboard-parity',
  'zed.project().connectors.config()': 'dashboard-parity',
  'zed.project().connectors.create()': 'dashboard-parity',
  'zed.project().connectors.list()': 'dashboard-parity',
  'zed.project().connectors.remove()': 'dashboard-parity',
  'zed.project().connectors.sync()': 'dashboard-parity',
  'zed.project().detail()': 'dashboard-parity',
  'zed.project().files.archive()': 'dashboard-parity',
  'zed.project().files.history()': 'dashboard-parity',
  'zed.project().files.list()': 'dashboard-parity',
  'zed.project().files.read()': 'dashboard-parity',
  'zed.project().files.search()': 'dashboard-parity',
  'zed.project().get()': 'dashboard-parity',
  'zed.project().git.branches()': 'dashboard-parity',
  'zed.project().git.commit()': 'dashboard-parity',
  'zed.project().git.commitDiff()': 'dashboard-parity',
  'zed.project().git.commits()': 'dashboard-parity',
  'zed.project().git.versionDiff()': 'dashboard-parity',
  'zed.project().llmCatalog()': 'dashboard-parity',
  'zed.project().onboardingComplete()': 'dashboard-parity',
  'zed.project().policies.list()': 'dashboard-parity',
  'zed.project().policies.set()': 'dashboard-parity',
  'zed.project().sandboxHealth()': 'dashboard-parity',
  'zed.project().secrets.list()': 'dashboard-parity',
  'zed.project().secrets.removePersonal()': 'dashboard-parity',
  'zed.project().secrets.setGitCredential()': 'dashboard-parity',
  'zed.project().secrets.setPersonal()': 'dashboard-parity',
  'zed.project().tokens.create()': 'dashboard-parity',
  'zed.project().triggers.create()': 'dashboard-parity',
  'zed.project().triggers.fire()': 'dashboard-parity',
  'zed.project().triggers.list()': 'dashboard-parity',
  'zed.project().triggers.remove()': 'dashboard-parity',
  'zed.project().triggers.setActivation()': 'dashboard-parity',
  'zed.project().triggers.update()': 'dashboard-parity',
  'zed.project().update()': 'dashboard-parity',
  'zed.project().updateExperimentalFeature()': 'dashboard-parity',
  'zed.projects.sandboxTemplates()': 'dashboard-parity',
  'zed.session().audit()': 'dashboard-parity',
  'zed.session().commit()': 'dashboard-parity',
  'zed.session().get()': 'dashboard-parity',
  'zed.session().health()': 'dashboard-parity',
  'zed.session().previews()': 'dashboard-parity',
  'zed.session().publicShares.create()': 'dashboard-parity',
  'zed.session().publicShares.list()': 'dashboard-parity',
  'zed.session().publicShares.revoke()': 'dashboard-parity',
  'zed.session().setSharing()': 'dashboard-parity',
  'zed.session().update()': 'dashboard-parity',

  // ── Handles and runtime resolution ────────────────────────────────────────
  'zed.session()': 'sdk-handle',
  'zed.session().ensureReady()': 'sdk-handle',
  'zed.session().previewUrl()': 'sdk-handle',
  'zed.session().proxyUrl()': 'sdk-handle',
};

/**
 * The actions the scanner cannot see, because they are not written as
 * `zed.…` calls at all. Each carries a marker that must still be in the
 * source, so an entry cannot outlive the thing it claims the app does.
 */
const OFF_CHAIN_ACTIONS: {
  id: CallSnippetId;
  file: string;
  marker: string;
  why: string;
}[] = [
  {
    id: 'session.prompt',
    file: 'src/components/workbench/workbench-tabs.tsx',
    marker: 'onSend={c.send}',
    why: 'A prompt goes through the `useSession` hook, which owns the runtime transport.',
  },
];

// ── The checks ───────────────────────────────────────────────────────────────

describe('every snippet builds', () => {
  test('with nothing filled in, and with everything filled in', () => {
    const full = {
      projectId: 'p1',
      sessionId: 's1',
      projectName: 'Acme workspace',
      executionId: 'exec_1',
      agent: 'support',
      model: 'anthropic/claude-sonnet-4-5',
      secret: { identifier: 'STRIPE_KEY', name: 'STRIPE_SECRET_KEY' },
    };
    for (const id of CALL_SNIPPET_IDS) {
      for (const ctx of [{}, full]) {
        const snippet = callSnippet(id, ctx);
        expect(snippet.id).toBe(id);
        expect(snippet.sdk.trim().length).toBeGreaterThan(0);
        expect(renderHttp(snippet.http).trim().length).toBeGreaterThan(0);
        expect(snippet.notes.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('the panel covers every KaaB action this app performs', () => {
  test('no call in the source is missing from the table', () => {
    const scanned = scanApp();
    const undeclared = [...scanned.entries()]
      .filter(([sig]) => !(sig in ACTIONS))
      .map(([sig, files]) => `${sig}  (${files.join(', ')})`);
    // Read the failure literally: this app gained an SDK call and nothing has
    // decided whether a wrapper author gets shown it. Add it to ACTIONS with a
    // CallSnippetId (and mount the snippet), or with a REASONS key.
    expect(undeclared).toEqual([]);
  });

  test('no entry in the table describes a call the source no longer makes', () => {
    const scanned = scanApp();
    const stale = Object.keys(ACTIONS).filter((sig) => !scanned.has(sig));
    expect(stale).toEqual([]);
  });

  test('a snippet a call is mapped to actually prints that call', () => {
    // The way a coverage table gets defeated is by pointing a new action at a
    // snippet that does not mention it. So the mapped snippet's SDK block is put
    // back through the SAME scanner, and the signature has to come out of it.
    for (const [signature, verdict] of Object.entries(ACTIONS)) {
      for (const id of snippetIds(verdict)) {
        const snippet = callSnippet(id, { projectId: 'p1', sessionId: 's1' });
        expect({
          signature,
          id,
          printed: callSignatures(snippet.sdk).includes(signature),
        }).toEqual({
          signature,
          id,
          printed: true,
        });
      }
    }
  });

  test('the actions written without the SDK are declared, and still exist', () => {
    for (const action of OFF_CHAIN_ACTIONS) {
      expect(CALL_SNIPPET_IDS).toContain(action.id);
      const source = readFileSync(join(APP_ROOT, action.file), 'utf8');
      expect({
        file: action.file,
        present: source.includes(action.marker),
      }).toEqual({
        file: action.file,
        present: true,
      });
    }
  });

  test('every snippet id is claimed by an action', () => {
    // A snippet nobody's action points at describes something this app does not
    // do — the panel drifting the other way.
    const claimed = new Set<string>([
      ...Object.values(ACTIONS).flatMap(snippetIds),
      ...OFF_CHAIN_ACTIONS.map((a) => a.id),
    ]);
    expect(CALL_SNIPPET_IDS.filter((id) => !claimed.has(id))).toEqual([]);
  });

  test('every snippet is mounted somewhere in the app', () => {
    // A snippet that exists but is never rendered teaches nobody. The id has to
    // appear as a literal outside the builder — `<CallSnippet id="…">` or the
    // row-to-call maps that drive it (src/components/workbench/session-scope.tsx).
    const app = sourceFiles(SRC_ROOT)
      .filter((path) => !NOT_APP_BEHAVIOUR.includes(relative(APP_ROOT, path)))
      .map((path) => readFileSync(path, 'utf8'))
      .join('\n');
    const unmounted = CALL_SNIPPET_IDS.filter(
      (id) => !app.includes(`"${id}"`) && !app.includes(`'${id}'`),
    );
    expect(unmounted).toEqual([]);
  });
});

describe('the new coverage does not weaken the two rules', () => {
  test('no snippet renders a bearer that is not the placeholder', () => {
    const text = callSnippets({
      projectId: 'p1',
      secret: { identifier: 'STRIPE_KEY', name: 'STRIPE_SECRET_KEY' },
    })
      .map((s) => `${s.sdk}\n${renderHttp(s.http)}\n${s.notes.join('\n')}`)
      .join('\n');
    expect(text.match(/Bearer (?!\$ZED_API_KEY)\S+/)).toBeNull();
  });

  test('no snippet renders upstream customer attribution fields', () => {
    const text = callSnippets({ projectId: 'p1' })
      .map(
        (snippet) =>
          `${snippet.sdk}\n${renderHttp(snippet.http)}\n${snippet.notes.join('\n')}`,
      )
      .join('\n');
    expect(text).not.toMatch(REMOVED_ATTRIBUTION_PATTERN);
  });
});
