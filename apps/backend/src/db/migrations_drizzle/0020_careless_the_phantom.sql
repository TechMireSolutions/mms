ALTER TABLE "assessment_results" DROP CONSTRAINT IF EXISTS "assessment_results_pkey";--> statement-breakpoint
ALTER TABLE "audit_log_entries" DROP CONSTRAINT IF EXISTS "audit_log_entries_pkey";--> statement-breakpoint
ALTER TABLE "questions" DROP CONSTRAINT IF EXISTS "questions_pkey";--> statement-breakpoint
ALTER TABLE "tests" DROP CONSTRAINT IF EXISTS "tests_pkey";--> statement-breakpoint
ALTER TABLE "user_activity_logs" DROP CONSTRAINT IF EXISTS "user_activity_logs_pkey";--> statement-breakpoint
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");--> statement-breakpoint
ALTER TABLE "audit_log_entries" ADD CONSTRAINT "audit_log_entries_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");--> statement-breakpoint
ALTER TABLE "user_activity_logs" ADD CONSTRAINT "user_activity_logs_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");