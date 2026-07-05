CREATE TABLE "attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "attendance_workspace_subdomain_idx" ON "attendance" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "attendance_custom_data_gin_idx" ON "attendance" USING gin ("custom_data");