DROP INDEX "zed"."idx_projects_account_repo";

CREATE INDEX "idx_projects_account_repo"
  ON "zed"."projects" USING btree ("account_id", "repo_url");

ALTER TABLE "zed"."project_group_grants"
  DROP COLUMN "default_base_ref";
