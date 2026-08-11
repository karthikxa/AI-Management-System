-- Migration: remove_local_docker_provider
--
-- SAFETY HEADER (house rules -- see packages/db/MIGRATIONS.md#zero-downtime-rules).
-- Tune these down further for large/hot tables; raise statement_timeout only
-- for an operation you've deliberately reasoned about (e.g. a NOT VALID
-- constraint's later VALIDATE, or a batched backfill with its own paging).
set lock_timeout = '2s';
set statement_timeout = '30s';

-- Fail closed instead of relabelling runtime identity or billing history as a
-- different provider. An operator with rows from the retired provider must
-- archive or delete those rows explicitly before this migration can proceed.
-- The error includes every table whose rows require operator action.
DO $provider_guard$
DECLARE
  offenders text[] := ARRAY[]::text[];
BEGIN
  IF EXISTS (SELECT 1 FROM zed.project_sessions WHERE sandbox_provider::text = 'local-docker') THEN
    offenders := array_append(offenders, 'project_sessions');
  END IF;
  IF EXISTS (SELECT 1 FROM zed.session_sandboxes WHERE provider::text = 'local-docker') THEN
    offenders := array_append(offenders, 'session_sandboxes');
  END IF;
  IF EXISTS (
    SELECT 1 FROM zed.provider_transitions
    WHERE source_provider::text = 'local-docker' OR target_provider::text = 'local-docker'
  ) THEN
    offenders := array_append(offenders, 'provider_transitions');
  END IF;
  IF EXISTS (SELECT 1 FROM zed.sandbox_compute_sessions WHERE provider::text = 'local-docker') THEN
    offenders := array_append(offenders, 'sandbox_compute_sessions');
  END IF;
  IF EXISTS (SELECT 1 FROM zed.app_deployments WHERE hosting_provider = 'local-docker') THEN
    offenders := array_append(offenders, 'app_deployments');
  END IF;
  IF EXISTS (SELECT 1 FROM zed.app_runtimes WHERE provider = 'local-docker') THEN
    offenders := array_append(offenders, 'app_runtimes');
  END IF;

  IF cardinality(offenders) > 0 THEN
    RAISE EXCEPTION
      'retired sandbox provider still has rows in: %; archive or delete them before upgrading',
      array_to_string(offenders, ', ');
  END IF;
END
$provider_guard$;--> statement-breakpoint

-- The immutable-identity trigger names the provider column in its UPDATE
-- event. PostgreSQL therefore blocks the temporary enum-to-text rewrite while
-- the trigger exists. The migration runner wraps this migration in one
-- transaction, so the trigger is either restored before commit or the drop is
-- rolled back with the failed migration.
DROP TRIGGER IF EXISTS trg_session_sandbox_identity_immutable
  ON zed.session_sandboxes;--> statement-breakpoint

-- mixed-version-safe: managed deployments never enable the retired provider,
-- and the guard proves that no durable row uses it. Self-host updates stop the
-- old API before migrations run, so no old process can insert the value after
-- the guard.
ALTER TABLE ONLY zed.project_sessions
  ALTER COLUMN sandbox_provider DROP DEFAULT;--> statement-breakpoint
ALTER TABLE ONLY zed.session_sandboxes
  ALTER COLUMN provider DROP DEFAULT;--> statement-breakpoint
ALTER TABLE ONLY zed.sandbox_compute_sessions
  ALTER COLUMN provider DROP DEFAULT;--> statement-breakpoint

ALTER TABLE ONLY zed.project_sessions
  -- squawk-ignore changing-column-type
  ALTER COLUMN sandbox_provider TYPE text USING sandbox_provider::text;--> statement-breakpoint
ALTER TABLE ONLY zed.session_sandboxes
  -- squawk-ignore changing-column-type
  ALTER COLUMN provider TYPE text USING provider::text;--> statement-breakpoint
ALTER TABLE ONLY zed.provider_transitions
  -- squawk-ignore changing-column-type
  ALTER COLUMN source_provider TYPE text USING source_provider::text,
  -- squawk-ignore changing-column-type
  ALTER COLUMN target_provider TYPE text USING target_provider::text;--> statement-breakpoint
ALTER TABLE ONLY zed.sandbox_compute_sessions
  -- squawk-ignore changing-column-type
  ALTER COLUMN provider TYPE text USING provider::text;--> statement-breakpoint

DROP TYPE zed.sandbox_provider;--> statement-breakpoint
CREATE TYPE zed.sandbox_provider AS ENUM ('daytona', 'platinum', 'e2b');--> statement-breakpoint

ALTER TABLE ONLY zed.project_sessions
  -- squawk-ignore changing-column-type
  ALTER COLUMN sandbox_provider TYPE zed.sandbox_provider
    USING sandbox_provider::zed.sandbox_provider,
  ALTER COLUMN sandbox_provider SET DEFAULT 'daytona'::zed.sandbox_provider;--> statement-breakpoint
ALTER TABLE ONLY zed.session_sandboxes
  -- squawk-ignore changing-column-type
  ALTER COLUMN provider TYPE zed.sandbox_provider
    USING provider::zed.sandbox_provider,
  ALTER COLUMN provider SET DEFAULT 'daytona'::zed.sandbox_provider;--> statement-breakpoint
ALTER TABLE ONLY zed.provider_transitions
  -- squawk-ignore changing-column-type
  ALTER COLUMN source_provider TYPE zed.sandbox_provider
    USING source_provider::zed.sandbox_provider,
  -- squawk-ignore changing-column-type
  ALTER COLUMN target_provider TYPE zed.sandbox_provider
    USING target_provider::zed.sandbox_provider;--> statement-breakpoint
ALTER TABLE ONLY zed.sandbox_compute_sessions
  -- squawk-ignore changing-column-type
  ALTER COLUMN provider TYPE zed.sandbox_provider
    USING provider::zed.sandbox_provider,
  ALTER COLUMN provider SET DEFAULT 'daytona'::zed.sandbox_provider;--> statement-breakpoint

CREATE TRIGGER trg_session_sandbox_identity_immutable
BEFORE UPDATE OF external_id, provider OR DELETE
ON zed.session_sandboxes
FOR EACH ROW
EXECUTE FUNCTION zed.guard_session_sandbox_identity();
