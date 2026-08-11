DROP INDEX "zed"."idx_service_accounts_account_name";--> statement-breakpoint
ALTER TABLE "zed"."account_tokens" ADD COLUMN "service_account_id" uuid;--> statement-breakpoint
ALTER TABLE "zed"."service_accounts" ADD COLUMN "project_id" uuid;--> statement-breakpoint
ALTER TABLE "zed"."service_accounts" ADD COLUMN "agent_name" text;--> statement-breakpoint
ALTER TABLE "zed"."account_tokens" ADD CONSTRAINT "account_tokens_service_account_id_service_accounts_service_account_id_fk" FOREIGN KEY ("service_account_id") REFERENCES "zed"."service_accounts"("service_account_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zed"."service_accounts" ADD CONSTRAINT "service_accounts_project_id_projects_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "zed"."projects"("project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_service_accounts_agent" ON "zed"."service_accounts" USING btree ("account_id","project_id","agent_name") WHERE agent_name IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_service_accounts_account_name" ON "zed"."service_accounts" USING btree ("account_id","name") WHERE agent_name IS NULL;