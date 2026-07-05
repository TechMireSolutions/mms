CREATE TABLE "teachers" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "teachers_workspace_subdomain_idx" ON "teachers" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "teachers_custom_data_gin_idx" ON "teachers" USING gin ("custom_data");