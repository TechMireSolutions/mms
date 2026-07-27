ALTER TABLE "tenant_users" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD COLUMN IF NOT EXISTS "deleted_by" text;--> statement-breakpoint
DROP INDEX IF EXISTS "tenant_users_workspace_login_email_idx";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_users_workspace_login_email_active_idx" ON "tenant_users" ("workspace_subdomain","login_email") WHERE "deleted_at" is null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tenant_users_workspace_deleted_idx" ON "tenant_users" ("workspace_subdomain","deleted_at");
