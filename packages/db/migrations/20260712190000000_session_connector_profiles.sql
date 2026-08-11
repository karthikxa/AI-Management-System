-- Phase 2: separate logical connector definitions from concrete connection
-- identities and bind those identities durably to a Zed session.

CREATE TYPE zed.executor_connection_profile_owner_type AS ENUM (
  'project', 'agent', 'member', 'subject', 'external'
);

CREATE TYPE zed.executor_connection_profile_status AS ENUM (
  'active', 'revoked', 'error'
);

CREATE TYPE zed.project_session_connector_binding_source AS ENUM (
  'request', 'default'
);

-- Historical callers accepted an account id alongside the project id. Repair
-- any drift before making the tenant tuple a foreign-key target.
UPDATE zed.project_sessions s
SET account_id = p.account_id
FROM zed.projects p
WHERE p.project_id = s.project_id
  AND s.account_id IS DISTINCT FROM p.account_id;

UPDATE zed.executor_connectors c
SET account_id = p.account_id
FROM zed.projects p
WHERE p.project_id = c.project_id
  AND c.account_id IS DISTINCT FROM p.account_id;

-- Channel install state is control-plane connector material, never runtime
-- environment. Older writes inherited the runtime default; repair them before
-- profile-aware sessions can be provisioned.
UPDATE zed.project_secrets
SET scope = 'connector'
WHERE scope <> 'connector'
  AND (
    name LIKE 'SLACK\_%' ESCAPE '\'
    OR name LIKE 'TELEGRAM\_%' ESCAPE '\'
    OR name LIKE 'AGENTMAIL\_%' ESCAPE '\'
    OR name = 'RECALL_API_KEY'
  );

CREATE UNIQUE INDEX idx_project_sessions_tenant_identity
  ON zed.project_sessions (account_id, project_id, session_id);

CREATE UNIQUE INDEX idx_executor_connectors_tenant_identity
  ON zed.executor_connectors (account_id, project_id, connector_id);
CREATE UNIQUE INDEX idx_executor_connectors_tenant_alias
  ON zed.executor_connectors (account_id, project_id, connector_id, slug);

CREATE TABLE zed.executor_connection_profiles (
  profile_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  project_id uuid NOT NULL,
  connector_id uuid NOT NULL,
  owner_type zed.executor_connection_profile_owner_type NOT NULL DEFAULT 'project',
  owner_id text,
  label varchar(255) NOT NULL,
  status zed.executor_connection_profile_status NOT NULL DEFAULT 'active',
  is_default boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT executor_connection_profiles_connector_tenant_fk
    FOREIGN KEY (account_id, project_id, connector_id)
    REFERENCES zed.executor_connectors (account_id, project_id, connector_id)
    ON DELETE CASCADE,
  CONSTRAINT executor_connection_profiles_owner_check CHECK (
    (owner_type = 'project' AND owner_id IS NULL)
    OR (owner_type <> 'project' AND owner_id IS NOT NULL AND btrim(owner_id) <> '')
  ),
  CONSTRAINT executor_connection_profiles_metadata_check
    CHECK (jsonb_typeof(metadata) = 'object' AND octet_length(metadata::text) <= 16384)
);

CREATE UNIQUE INDEX idx_executor_connection_profiles_tenant_identity
  ON zed.executor_connection_profiles
  (account_id, project_id, connector_id, profile_id);
CREATE UNIQUE INDEX idx_executor_connection_profiles_connector_identity
  ON zed.executor_connection_profiles (connector_id, profile_id);
CREATE UNIQUE INDEX idx_executor_connection_profiles_default
  ON zed.executor_connection_profiles (connector_id)
  WHERE is_default = true;
CREATE UNIQUE INDEX idx_executor_connection_profiles_owner
  ON zed.executor_connection_profiles (connector_id, owner_type, owner_id)
  WHERE owner_id IS NOT NULL;
CREATE INDEX idx_executor_connection_profiles_project
  ON zed.executor_connection_profiles (project_id);
CREATE INDEX idx_executor_connection_profiles_connector
  ON zed.executor_connection_profiles (connector_id);

-- Every legacy logical connector receives one project-owned default profile.
-- Omitted session bindings therefore preserve today's shared connector path.
INSERT INTO zed.executor_connection_profiles (
  account_id, project_id, connector_id, owner_type, owner_id, label,
  status, is_default, metadata
)
SELECT
  c.account_id,
  c.project_id,
  c.connector_id,
  'project',
  NULL,
  c.name,
  'active',
  true,
  jsonb_build_object(
    'migrated_from_legacy', true,
    'connector_slug', c.slug,
    'provider', c.provider_type
  )
FROM zed.executor_connectors c;

ALTER TABLE zed.executor_credentials
  ADD COLUMN profile_id uuid;

-- Preserve legacy personal credentials as member-owned profiles. A connector
-- may legitimately have both its shared project credential and one credential
-- per member; treating that supported shape as fatal blocked the 0.9.103 prod
-- migration and left the deployed API ahead of its schema.
INSERT INTO zed.executor_connection_profiles (
  account_id, project_id, connector_id, owner_type, owner_id, label,
  status, is_default, metadata, created_by
)
SELECT
  c.account_id,
  c.project_id,
  c.connector_id,
  'member',
  ec.user_id::text,
  c.name,
  'active',
  false,
  jsonb_build_object(
    'migrated_from_legacy', true,
    'legacy_personal_credential', true,
    'connector_slug', c.slug,
    'provider', c.provider_type
  ),
  ec.user_id
FROM zed.executor_credentials ec
JOIN zed.executor_connectors c ON c.connector_id = ec.connector_id
WHERE ec.user_id IS NOT NULL;

UPDATE zed.executor_credentials ec
SET profile_id = p.profile_id
FROM zed.executor_connection_profiles p
WHERE p.connector_id = ec.connector_id
  AND (
    (ec.user_id IS NULL AND p.is_default = true)
    OR (
      ec.user_id IS NOT NULL
      AND p.owner_type = 'member'
      AND p.owner_id = ec.user_id::text
    )
  );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM zed.executor_credentials WHERE profile_id IS NULL
  ) THEN
    RAISE EXCEPTION 'session connector profile migration left credentials without profiles';
  END IF;
END $$;

ALTER TABLE zed.executor_credentials
  ADD CONSTRAINT executor_credentials_connector_profile_fk
  FOREIGN KEY (connector_id, profile_id)
  REFERENCES zed.executor_connection_profiles (connector_id, profile_id)
  ON DELETE CASCADE;

CREATE INDEX idx_executor_credentials_profile
  ON zed.executor_credentials (profile_id);
CREATE UNIQUE INDEX idx_executor_credentials_profile_unique
  ON zed.executor_credentials (profile_id)
  WHERE profile_id IS NOT NULL;

DROP INDEX zed.idx_executor_credentials_connector_user;
CREATE UNIQUE INDEX idx_executor_credentials_legacy_connector_unique
  ON zed.executor_credentials (connector_id)
  WHERE profile_id IS NULL;

CREATE TABLE zed.project_session_connector_bindings (
  session_id text NOT NULL,
  account_id uuid NOT NULL,
  project_id uuid NOT NULL,
  connector_alias varchar(128) NOT NULL,
  connector_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  source zed.project_session_connector_binding_source NOT NULL DEFAULT 'request',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, connector_alias),
  CONSTRAINT project_session_connector_bindings_session_tenant_fk
    FOREIGN KEY (account_id, project_id, session_id)
    REFERENCES zed.project_sessions (account_id, project_id, session_id)
    ON DELETE CASCADE,
  CONSTRAINT project_session_connector_bindings_profile_tenant_fk
    FOREIGN KEY (account_id, project_id, connector_id, profile_id)
    REFERENCES zed.executor_connection_profiles
      (account_id, project_id, connector_id, profile_id)
    ON DELETE RESTRICT,
  CONSTRAINT project_session_connector_bindings_alias_tenant_fk
    FOREIGN KEY (account_id, project_id, connector_id, connector_alias)
    REFERENCES zed.executor_connectors
      (account_id, project_id, connector_id, slug)
    ON DELETE RESTRICT
);

CREATE INDEX idx_project_session_connector_bindings_profile
  ON zed.project_session_connector_bindings (profile_id);
CREATE INDEX idx_project_session_connector_bindings_project
  ON zed.project_session_connector_bindings (project_id);

ALTER TABLE zed.executor_executions
  ADD COLUMN profile_id uuid;
ALTER TABLE zed.executor_executions
  ADD CONSTRAINT executor_executions_profile_id_fkey
  FOREIGN KEY (profile_id)
  REFERENCES zed.executor_connection_profiles (profile_id)
  ON DELETE SET NULL;
CREATE INDEX idx_executor_executions_profile
  ON zed.executor_executions (profile_id);
