-- v2 manifests are YAML-only (zed.yaml); TOML (zed.toml) is the v1 legacy
-- format, still resolved as a read fallback. New projects default to the YAML
-- manifest path. Existing rows keep their stored path — resolution prefers a
-- sibling zed.yaml regardless, so v1 repos keep working unchanged.
ALTER TABLE zed.projects ALTER COLUMN manifest_path SET DEFAULT 'zed.yaml';
