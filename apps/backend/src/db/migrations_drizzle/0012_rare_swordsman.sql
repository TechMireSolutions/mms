CREATE TABLE "enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "enrollments_workspace_subdomain_idx" ON "enrollments" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "enrollments_custom_data_gin_idx" ON "enrollments" USING gin ("custom_data");