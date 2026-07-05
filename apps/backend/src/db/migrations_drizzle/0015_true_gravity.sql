CREATE TABLE "exam_results" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "exam_results_workspace_subdomain_idx" ON "exam_results" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "exam_results_custom_data_gin_idx" ON "exam_results" USING gin ("custom_data");--> statement-breakpoint
CREATE INDEX "exams_workspace_subdomain_idx" ON "exams" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "exams_custom_data_gin_idx" ON "exams" USING gin ("custom_data");