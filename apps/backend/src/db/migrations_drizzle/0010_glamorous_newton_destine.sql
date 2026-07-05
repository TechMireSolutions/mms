CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "sessions_workspace_subdomain_idx" ON "sessions" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "sessions_custom_data_gin_idx" ON "sessions" USING gin ("custom_data");