-- Migration: secret_consumer_boundary
set lock_timeout = '2s';
set statement_timeout = '30s';

CREATE TYPE "zed"."project_secret_consumer" AS ENUM('sandbox', 'llm_gateway', 'connector', 'executor', 'git_proxy', 'http_broker', 'network');--> statement-breakpoint
ALTER TABLE "zed"."project_secrets" ADD COLUMN "consumer" "zed"."project_secret_consumer" DEFAULT 'sandbox';--> statement-breakpoint

UPDATE "zed"."project_secrets"
SET "consumer" = CASE
  WHEN "scope" = 'connector' THEN 'connector'::"zed"."project_secret_consumer"
  WHEN "strategy" = 'denied' THEN NULL
  WHEN "strategy" = 'egress' THEN 'network'::"zed"."project_secret_consumer"
  WHEN "strategy" = 'broker' AND "egress_policy"->>'backend' = 'llm_gateway' THEN 'llm_gateway'::"zed"."project_secret_consumer"
  WHEN "strategy" = 'broker' AND "egress_policy"->>'backend' = 'executor' THEN 'executor'::"zed"."project_secret_consumer"
  WHEN "strategy" = 'broker' AND "egress_policy"->>'backend' = 'git_proxy' THEN 'git_proxy'::"zed"."project_secret_consumer"
  WHEN "strategy" = 'broker' AND "egress_policy"->>'backend' = 'zed_fetch' THEN 'http_broker'::"zed"."project_secret_consumer"
  ELSE "consumer"
END;
