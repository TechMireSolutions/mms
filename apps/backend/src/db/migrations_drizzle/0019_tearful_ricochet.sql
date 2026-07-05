CREATE TABLE "audit_log_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_activity_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audit_log_entries_workspace_subdomain_idx" ON "audit_log_entries" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "audit_log_entries_custom_data_gin_idx" ON "audit_log_entries" USING gin ("custom_data");--> statement-breakpoint
CREATE INDEX "user_activity_logs_workspace_subdomain_idx" ON "user_activity_logs" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "user_activity_logs_custom_data_gin_idx" ON "user_activity_logs" USING gin ("custom_data");