SET lock_timeout = '1s';
SET statement_timeout = '5s';

CREATE TABLE "zed"."executor_oauth_applications" (
	"application_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"connector_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"config_enc" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zed"."executor_oauth_sessions" (
	"session_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"initiated_by" uuid NOT NULL,
	"flow" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"state_hash" varchar(64),
	"pkce_verifier_enc" text,
	"device_code_enc" text,
	"success_redirect_uri" text,
	"error_redirect_uri" text,
	"scopes" text[],
	"interval_seconds" integer,
	"next_poll_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"error_code" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "executor_oauth_sessions_flow_check" CHECK ("zed"."executor_oauth_sessions"."flow" IN ('authorization_code', 'device_authorization')),
	CONSTRAINT "executor_oauth_sessions_status_check" CHECK ("zed"."executor_oauth_sessions"."status" IN ('pending', 'active', 'consumed', 'error', 'expired')),
	CONSTRAINT "executor_oauth_sessions_material_check" CHECK (("zed"."executor_oauth_sessions"."flow" = 'authorization_code' AND "zed"."executor_oauth_sessions"."state_hash" IS NOT NULL AND "zed"."executor_oauth_sessions"."pkce_verifier_enc" IS NOT NULL AND "zed"."executor_oauth_sessions"."device_code_enc" IS NULL) OR ("zed"."executor_oauth_sessions"."flow" = 'device_authorization' AND "zed"."executor_oauth_sessions"."state_hash" IS NULL AND "zed"."executor_oauth_sessions"."pkce_verifier_enc" IS NULL AND "zed"."executor_oauth_sessions"."device_code_enc" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "zed"."executor_oauth_applications" ADD CONSTRAINT "executor_oauth_applications_profile_tenant_fk" FOREIGN KEY ("account_id","project_id","connector_id","profile_id") REFERENCES "zed"."executor_connection_profiles"("account_id","project_id","connector_id","profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zed"."executor_oauth_sessions" ADD CONSTRAINT "executor_oauth_sessions_application_fk" FOREIGN KEY ("application_id") REFERENCES "zed"."executor_oauth_applications"("application_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_executor_oauth_applications_profile" ON "zed"."executor_oauth_applications" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_executor_oauth_applications_project" ON "zed"."executor_oauth_applications" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_executor_oauth_sessions_state_hash" ON "zed"."executor_oauth_sessions" USING btree ("state_hash") WHERE "zed"."executor_oauth_sessions"."state_hash" is not null;--> statement-breakpoint
CREATE INDEX "idx_executor_oauth_sessions_profile" ON "zed"."executor_oauth_sessions" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_executor_oauth_sessions_expires" ON "zed"."executor_oauth_sessions" USING btree ("expires_at");
