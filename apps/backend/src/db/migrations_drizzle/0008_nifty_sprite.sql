CREATE TABLE "students" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "students_workspace_subdomain_idx" ON "students" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "students_custom_data_gin_idx" ON "students" USING gin ("custom_data");