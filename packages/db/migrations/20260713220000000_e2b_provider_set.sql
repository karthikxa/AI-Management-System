-- Establish the active provider set as Daytona, Platinum, and E2B.
--
-- Upgrade-path safety contract
-- ----------------------------
-- Existing environments can contain established session sandboxes whose
-- provider is `managed`. That value was only a short-lived alias for Daytona;
-- it never represented a separate runtime. The session identity trigger is
-- deliberately fail-closed and therefore rejects even that semantic no-op.
--
-- This migration temporarily removes the trigger before normalization. The
-- migration runner wraps the whole pending set in one transaction, so no API
-- process can observe an unguarded committed schema: either every statement
-- below succeeds (including trigger restoration) or PostgreSQL rolls it all
-- back. The regression in e2b-provider-migration.integration.test.ts builds the
-- historical shape in real PostgreSQL and proves this exact upgrade path.
--
-- `zed.sandboxes` is the retired /instances audit table. Its historical
-- Hetzner, JustAVPS, and local provider strings must remain queryable, but the
-- table must not keep obsolete values alive in the active provider enum.

-- The old live warm-pool tables have no runtime consumers and may still exist
-- on long-lived installations.
DROP TABLE IF EXISTS zed.pool_sandboxes;
DROP TABLE IF EXISTS zed.pool_resources;

-- Detach retired audit data from the active enum before replacing that enum.
ALTER TABLE ONLY zed.sandboxes
  ALTER COLUMN provider DROP DEFAULT;

ALTER TABLE ONLY zed.sandboxes
  ALTER COLUMN provider TYPE text
  USING provider::text;

ALTER TABLE ONLY zed.sandboxes
  ALTER COLUMN provider SET DEFAULT 'daytona';

-- Suspend the guard for this transaction's semantic alias normalization and
-- type rewrite. It is recreated before attribution work begins.
DROP TRIGGER IF EXISTS trg_session_sandbox_identity_immutable
  ON zed.session_sandboxes;

UPDATE zed.project_sessions AS session
SET sandbox_provider = 'daytona'
WHERE session.sandbox_provider::text = 'managed';

UPDATE zed.session_sandboxes AS sandbox
SET provider = 'daytona'
WHERE sandbox.provider::text = 'managed';

-- Refuse to discard any truly distinct active provider identity. At this point
-- the pre-E2B enum can validly contain only Daytona and Platinum.
DO $provider_guard$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM zed.project_sessions AS session
    WHERE session.sandbox_provider::text NOT IN ('daytona', 'platinum')
  ) THEN
    RAISE EXCEPTION
      'project sessions contain an unsupported active sandbox provider';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM zed.session_sandboxes AS sandbox
    WHERE sandbox.provider::text NOT IN ('daytona', 'platinum')
  ) THEN
    RAISE EXCEPTION
      'session sandboxes contain an unsupported active sandbox provider';
  END IF;
END
$provider_guard$;

-- Defaults retain dependencies on the old enum and must be released first.
ALTER TABLE ONLY zed.project_sessions
  ALTER COLUMN sandbox_provider DROP DEFAULT;

ALTER TABLE ONLY zed.session_sandboxes
  ALTER COLUMN provider DROP DEFAULT;

-- Move active columns through text so the old enum can be replaced rather than
-- accumulating aliases that the public/provider contract no longer supports.
ALTER TABLE ONLY zed.project_sessions
  ALTER COLUMN sandbox_provider TYPE text
  USING sandbox_provider::text;

ALTER TABLE ONLY zed.session_sandboxes
  ALTER COLUMN provider TYPE text
  USING provider::text;

DROP TYPE zed.sandbox_provider;

CREATE TYPE zed.sandbox_provider AS ENUM (
  'daytona',
  'platinum',
  'e2b'
);

ALTER TABLE ONLY zed.project_sessions
  ALTER COLUMN sandbox_provider TYPE zed.sandbox_provider
  USING sandbox_provider::zed.sandbox_provider;

ALTER TABLE ONLY zed.session_sandboxes
  ALTER COLUMN provider TYPE zed.sandbox_provider
  USING provider::zed.sandbox_provider;

ALTER TABLE ONLY zed.project_sessions
  ALTER COLUMN sandbox_provider
  SET DEFAULT 'daytona'::zed.sandbox_provider;

ALTER TABLE ONLY zed.session_sandboxes
  ALTER COLUMN provider
  SET DEFAULT 'daytona'::zed.sandbox_provider;

-- Restore the same fail-closed identity guard before this transaction can
-- commit. Subsequent provider or external-ID swaps remain impossible.
CREATE TRIGGER trg_session_sandbox_identity_immutable
BEFORE UPDATE OF external_id, provider OR DELETE
ON zed.session_sandboxes
FOR EACH ROW
EXECUTE FUNCTION zed.guard_session_sandbox_identity();

-- Attribute every compute window to its real provider. Historical orphaned
-- windows have no surviving identity to consult and deterministically fall back
-- to Daytona, which was the default provider when those windows were created.
ALTER TABLE ONLY zed.sandbox_compute_sessions
  ADD COLUMN provider zed.sandbox_provider;

UPDATE zed.sandbox_compute_sessions AS compute
SET provider = sandbox.provider
FROM zed.session_sandboxes AS sandbox
WHERE compute.sandbox_id = sandbox.sandbox_id;

UPDATE zed.sandbox_compute_sessions AS compute
SET provider = 'daytona'::zed.sandbox_provider
WHERE compute.provider IS NULL;

ALTER TABLE ONLY zed.sandbox_compute_sessions
  ALTER COLUMN provider
    SET DEFAULT 'daytona'::zed.sandbox_provider,
  ALTER COLUMN provider
    SET NOT NULL;

CREATE INDEX idx_sandbox_compute_sessions_provider_time
  ON zed.sandbox_compute_sessions (provider, started_at DESC);
