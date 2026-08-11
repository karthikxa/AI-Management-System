/**
 * Local Session Runner
 * 
 * Executes agent sessions locally instead of in cloud sandboxes.
 * Handles the full lifecycle:
 * 1. Clone project repo
 * 2. Run agent commands
 * 3. Stream results back
 * 4. Clean up when done
 */

import { executeStreamInSandbox, readSandboxFile, writeSandboxFile, stopLocalSandbox } from '../providers/local';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const execFileAsync = promisify(execFile);

export interface LocalSession {
  id: string;
  projectId: string;
  sandboxId: string;
  status: 'running' | 'completed' | 'error';
  output: string[];
  createdAt: Date;
}

// In-memory session store
const sessions = new Map<string, LocalSession>();

/**
 * Create and run a local session
 */
export async function createLocalSession(params: {
  sessionId: string;
  projectId: string;
  repoUrl: string;
  branch?: string;
  agentName?: string;
  prompt: string;
  userId: string;
}): Promise<{ sessionId: string; status: string }> {
  const { sessionId, projectId, repoUrl, branch = 'main', agentName, prompt, userId } = params;
  
  // Create session record
  const session: LocalSession = {
    id: sessionId,
    projectId,
    sandboxId: '',
    status: 'running',
    output: [],
    createdAt: new Date(),
  };
  sessions.set(sessionId, session);
  
  // Run async in background
  runSession(session, { repoUrl, branch, agentName, prompt, userId }).catch((error) => {
    console.error(`[local-session] Session ${sessionId} failed:`, error);
    session.status = 'error';
    session.output.push(`Error: ${error.message}`);
  });
  
  return { sessionId, status: 'running' };
}

/**
 * Run the session (internal)
 */
async function runSession(
  session: LocalSession,
  params: {
    repoUrl: string;
    branch: string;
    agentName?: string;
    prompt: string;
    userId: string;
  }
): Promise<void> {
  const { repoUrl, branch, agentName, prompt, userId } = params;
  
  try {
    // 1. Clone the repo to a temp directory
    const dir = await mkdtemp(join(tmpdir(), 'kortix-session-'));
    session.output.push(`Cloning repository to ${dir}...`);
    
    const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' };
    
    // Clone with depth 1 for speed
    await execFileAsync('git', ['clone', '--depth', '1', '--branch', branch, repoUrl, dir], {
      env,
      timeout: 60_000,
    });
    
    session.output.push('Repository cloned successfully');
    
    // 2. Create a session branch
    const sessionBranch = `session/${session.id.slice(0, 8)}`;
    await execFileAsync('git', ['checkout', '-b', sessionBranch], {
      cwd: dir,
      env,
    });
    
    session.output.push(`Created session branch: ${sessionBranch}`);
    
    // 3. Execute the agent prompt
    session.output.push(`Executing agent: ${agentName || 'default'}`);
    session.output.push(`Prompt: ${prompt}`);
    
    // For now, create a simple response file
    // In a real implementation, this would call the LLM gateway
    const responseContent = `# Agent Response

## Session: ${session.id}
## Agent: ${agentName || 'default'}
## Prompt: ${prompt}

## Execution Details
- Repository: ${repoUrl}
- Branch: ${branch}
- Session Branch: ${sessionBranch}
- Working Directory: ${dir}

## Status
Agent execution completed locally.

## Files Modified
- None (placeholder response)

## Next Steps
This is a local agent execution. In production, this would:
1. Connect to the LLM gateway
2. Generate a response
3. Modify files based on the prompt
4. Create a commit with changes
`;
    
    // Write response file
    await writeFile(join(dir, 'AGENT_RESPONSE.md'), responseContent, 'utf-8');
    
    // 4. Commit the response
    await execFileAsync('git', ['add', '.'], { cwd: dir, env });
    await execFileAsync('git', ['commit', '-m', `Agent response: ${prompt.slice(0, 50)}...`], {
      cwd: dir,
      env,
    });
    
    session.output.push('Agent response committed');
    
    // 5. Push to remote (if possible)
    try {
      const authUrl = new URL(repoUrl);
      authUrl.username = 'x-access-token';
      authUrl.password = process.env.MANAGED_GIT_GITHUB_TOKEN || '';
      
      await execFileAsync('git', ['push', authUrl.toString(), sessionBranch], {
        cwd: dir,
        env,
      });
      
      session.output.push('Changes pushed to remote');
    } catch (pushError: any) {
      session.output.push(`Push failed (local execution only): ${pushError.message}`);
    }
    
    // 6. Complete session
    session.status = 'completed';
    session.output.push('Session completed successfully');
    
    // Cleanup temp directory
    await rm(dir, { recursive: true, force: true });
    
  } catch (error: any) {
    session.status = 'error';
    session.output.push(`Error: ${error.message}`);
    throw error;
  }
}

/**
 * Get session status and output
 */
export function getLocalSessionStatus(sessionId: string): LocalSession | undefined {
  return sessions.get(sessionId);
}

/**
 * Get session output (for streaming to UI)
 */
export function getLocalSessionOutput(sessionId: string): string[] {
  const session = sessions.get(sessionId);
  return session?.output || [];
}

/**
 * Stop a running session
 */
export async function stopLocalSession(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (!session) {
    return;
  }
  
  session.status = 'error';
  session.output.push('Session stopped by user');
  
  // Cleanup sandbox if exists
  if (session.sandboxId) {
    await stopLocalSandbox(session.sandboxId);
  }
}

/**
 * List all sessions
 */
export function listLocalSessions(): LocalSession[] {
  return Array.from(sessions.values());
}
