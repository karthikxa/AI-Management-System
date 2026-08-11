import { CliError } from './cli';

export function getEnv(key: string): string | undefined {
  const v = process.env[key];
  return v && v.length > 0 ? v : undefined;
}

export function requireEnv(key: string): string {
  const v = getEnv(key);
  if (!v) {
    throw new CliError(
      `${key} not set. Connect this platform in the Zed dashboard so the token is provisioned to the sandbox.`,
      'MISSING_ENV',
    );
  }
  return v;
}

export function zedProjectId(): string | undefined {
  return getEnv('ZED_PROJECT_ID');
}

export function zedSessionId(): string | undefined {
  return getEnv('ZED_SESSION_ID');
}

export function zedWorkspace(): string {
  return getEnv('ZED_WORKSPACE') ?? '/workspace';
}
