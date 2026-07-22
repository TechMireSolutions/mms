CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"subdomain" text NOT NULL,
	"madrasa_name" text NOT NULL,
	"tagline" text,
	"country" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_subdomain_unique" UNIQUE("subdomain")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_subdomain_idx" ON "workspaces" USING btree ("subdomain");--> statement-breakpoint
INSERT INTO "workspaces" ("id", "subdomain", "madrasa_name", "tagline", "country", "enabled", "created_at", "updated_at")
SELECT 
  (elem->>'id')::text,
  (elem->>'subdomain')::text,
  (elem->>'madrasaName')::text,
  (elem->>'tagline')::text,
  (elem->>'country')::text,
  coalesce((elem->>'enabled')::boolean, true),
  coalesce((elem->>'createdAt')::timestamp, now()),
  coalesce((elem->>'updatedAt')::timestamp, now())
FROM "collections", jsonb_array_elements("data") AS elem
WHERE "name" = 'workspaces'
ON CONFLICT ("subdomain") DO NOTHING;--> statement-breakpoint
ALTER TABLE "accounting_accounts" ADD CONSTRAINT "accounting_accounts_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounting_fiscal_years" ADD CONSTRAINT "accounting_fiscal_years_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log_entries" ADD CONSTRAINT "audit_log_entries_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_tabs" ADD CONSTRAINT "custom_tabs_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_invoices" ADD CONSTRAINT "finance_invoices_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_payments" ADD CONSTRAINT "finance_payments_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hasanat_batches" ADD CONSTRAINT "hasanat_batches_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hasanat_denoms" ADD CONSTRAINT "hasanat_denoms_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hasanat_distributions" ADD CONSTRAINT "hasanat_distributions_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hasanat_redemptions" ADD CONSTRAINT "hasanat_redemptions_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mujtahid_reps" ADD CONSTRAINT "mujtahid_reps_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mujtahids" ADD CONSTRAINT "mujtahids_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligation_collections" ADD CONSTRAINT "obligation_collections_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligation_distributions" ADD CONSTRAINT "obligation_distributions_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligation_types" ADD CONSTRAINT "obligation_types_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_logs" ADD CONSTRAINT "user_activity_logs_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wakala_types" ADD CONSTRAINT "wakala_types_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;