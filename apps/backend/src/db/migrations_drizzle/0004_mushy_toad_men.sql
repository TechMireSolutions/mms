ALTER TABLE "auth_artifacts" ALTER COLUMN "payload" SET DATA TYPE jsonb USING payload::jsonb;--> statement-breakpoint
ALTER TABLE "background_jobs" ALTER COLUMN "payload" SET DATA TYPE jsonb USING payload::jsonb;--> statement-breakpoint
ALTER TABLE "collections" ALTER COLUMN "data" SET DATA TYPE jsonb USING data::jsonb;--> statement-breakpoint
ALTER TABLE "contacts" ALTER COLUMN "custom_data" SET DATA TYPE jsonb USING custom_data::jsonb;--> statement-breakpoint
ALTER TABLE "objects" ALTER COLUMN "data" SET DATA TYPE jsonb USING data::jsonb;--> statement-breakpoint
ALTER TABLE "tenant_users" ALTER COLUMN "profile_json" SET DATA TYPE jsonb USING profile_json::jsonb;