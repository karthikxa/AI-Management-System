import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import { resolve } from 'node:path';

const dockerAvailable =
  Bun.spawnSync(['docker', 'version'], { stdout: 'ignore', stderr: 'ignore' }).exitCode === 0;

const container = `zed-retired-provider-migration-${crypto.randomUUID().slice(0, 8)}`;

function psql(sql: string, allowFailure = false) {
  const result = Bun.spawnSync(
    [
      'docker',
      'exec',
      '-i',
      container,
      'psql',
      '-U',
      'postgres',
      '-d',
      'testdb',
      '-v',
      'ON_ERROR_STOP=1',
      '-t',
      '-A',
    ],
    { stdin: Buffer.from(sql), stdout: 'pipe', stderr: 'pipe' },
  );
  const output = `${result.stdout.toString()}${result.stderr.toString()}`;
  if (!allowFailure && result.exitCode !== 0) throw new Error(output);
  return { exitCode: result.exitCode, output };
}

const PRE_MIGRATION_SCHEMA = `
  DROP SCHEMA IF EXISTS zed CASCADE;
  CREATE SCHEMA zed;
  CREATE TYPE zed.sandbox_provider AS ENUM
    ('daytona', 'platinum', 'e2b', 'local-docker');

  CREATE TABLE zed.project_sessions (
    session_id text PRIMARY KEY,
    sandbox_provider zed.sandbox_provider NOT NULL DEFAULT 'daytona'
  );
  CREATE TABLE zed.session_sandboxes (
    sandbox_id uuid PRIMARY KEY,
    external_id text,
    provider zed.sandbox_provider NOT NULL DEFAULT 'daytona'
  );
  CREATE FUNCTION zed.guard_session_sandbox_identity()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $$ BEGIN RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END; END $$;
  CREATE TRIGGER trg_session_sandbox_identity_immutable
  BEFORE UPDATE OF external_id, provider OR DELETE
  ON zed.session_sandboxes
  FOR EACH ROW
  EXECUTE FUNCTION zed.guard_session_sandbox_identity();
  CREATE TABLE zed.provider_transitions (
    transition_id uuid PRIMARY KEY,
    source_provider zed.sandbox_provider NOT NULL,
    target_provider zed.sandbox_provider NOT NULL
  );
  CREATE TABLE zed.sandbox_compute_sessions (
    id uuid PRIMARY KEY,
    provider zed.sandbox_provider NOT NULL DEFAULT 'daytona'
  );
  CREATE TABLE zed.app_deployments (
    deployment_id uuid PRIMARY KEY,
    hosting_provider varchar(32)
  );
  CREATE TABLE zed.app_runtimes (
    runtime_id uuid PRIMARY KEY,
    provider varchar(32) NOT NULL
  );
`;

describe.skipIf(!dockerAvailable)('retired local provider migration — real PostgreSQL', () => {
  let migration = '';

  beforeAll(async () => {
    const started = Bun.spawnSync([
      'docker',
      'run',
      '--rm',
      '-d',
      '--name',
      container,
      '-e',
      'POSTGRES_PASSWORD=test',
      '-e',
      'POSTGRES_DB=testdb',
      'postgres:16-alpine',
    ]);
    if (started.exitCode !== 0) throw new Error(started.stderr.toString());

    let ready = false;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const probe = Bun.spawnSync(
        ['docker', 'exec', container, 'psql', '-U', 'postgres', '-d', 'testdb', '-c', 'SELECT 1'],
        { stdout: 'ignore', stderr: 'ignore' },
      );
      if (probe.exitCode === 0) {
        ready = true;
        break;
      }
      await Bun.sleep(250);
    }
    if (!ready) throw new Error('Disposable PostgreSQL did not become ready');

    migration = await Bun.file(
      resolve(
        import.meta.dir,
        '..',
        'migrations',
        '20260807165721291_remove_local_docker_provider.sql',
      ),
    ).text();
  }, 30_000);

  beforeEach(() => {
    psql(PRE_MIGRATION_SCHEMA);
  });

  afterAll(() => {
    Bun.spawnSync(['docker', 'rm', '-f', container], { stdout: 'ignore', stderr: 'ignore' });
  });

  test('removes the enum value when every affected table is empty', () => {
    psql(migration);

    expect(
      psql(`
        SELECT string_agg(enumlabel, ',' ORDER BY enumsortorder)
          FROM pg_enum
         WHERE enumtypid = 'zed.sandbox_provider'::regtype;
      `).output.trim(),
    ).toBe('daytona,platinum,e2b');

    expect(
      psql(`
        SELECT table_name || ':' || column_name || ':' || column_default
          FROM information_schema.columns
         WHERE table_schema = 'zed'
           AND (table_name, column_name) IN (
             ('project_sessions', 'sandbox_provider'),
             ('session_sandboxes', 'provider'),
             ('sandbox_compute_sessions', 'provider')
           )
         ORDER BY table_name;
      `).output.trim(),
    ).toBe(
      "project_sessions:sandbox_provider:'daytona'::zed.sandbox_provider\n" +
        "sandbox_compute_sessions:provider:'daytona'::zed.sandbox_provider\n" +
        "session_sandboxes:provider:'daytona'::zed.sandbox_provider",
    );

    expect(
      psql(`
        SELECT count(*)
          FROM pg_trigger
         WHERE tgrelid = 'zed.session_sandboxes'::regclass
           AND tgname = 'trg_session_sandbox_identity_immutable'
           AND NOT tgisinternal;
      `).output.trim(),
    ).toBe('1');
  });

  test('fails closed and names every table that still contains retired rows', () => {
    psql(`
      INSERT INTO zed.project_sessions VALUES ('session-1', 'local-docker');
      INSERT INTO zed.session_sandboxes VALUES
        ('00000000-0000-4000-a000-000000000001', NULL, 'local-docker');
      INSERT INTO zed.provider_transitions VALUES
        ('10000000-0000-4000-a000-000000000001', 'local-docker', 'daytona');
      INSERT INTO zed.sandbox_compute_sessions VALUES
        ('20000000-0000-4000-a000-000000000001', 'local-docker');
      INSERT INTO zed.app_deployments VALUES
        ('30000000-0000-4000-a000-000000000001', 'local-docker');
      INSERT INTO zed.app_runtimes VALUES
        ('40000000-0000-4000-a000-000000000001', 'local-docker');
    `);

    const result = psql(migration, true);
    expect(result.exitCode).not.toBe(0);
    expect(result.output).toContain(
      'retired sandbox provider still has rows in: project_sessions, session_sandboxes, ' +
        'provider_transitions, sandbox_compute_sessions, app_deployments, app_runtimes; ' +
        'archive or delete them before upgrading',
    );
  });
});
