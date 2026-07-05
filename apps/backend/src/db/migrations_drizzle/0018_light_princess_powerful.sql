CREATE TABLE "assessment_results" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "assessment_results_workspace_subdomain_idx" ON "assessment_results" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "assessment_results_custom_data_gin_idx" ON "assessment_results" USING gin ("custom_data");--> statement-breakpoint
CREATE INDEX "questions_workspace_subdomain_idx" ON "questions" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "questions_custom_data_gin_idx" ON "questions" USING gin ("custom_data");--> statement-breakpoint
CREATE INDEX "tests_workspace_subdomain_idx" ON "tests" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "tests_custom_data_gin_idx" ON "tests" USING gin ("custom_data");