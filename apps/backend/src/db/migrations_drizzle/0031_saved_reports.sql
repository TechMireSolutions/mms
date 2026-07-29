CREATE TABLE "saved_reports" (
	"id" text NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"filters" jsonb NOT NULL,
	"last_run_at" timestamp NOT NULL,
	"created_by" text NOT NULL,
	"created_by_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_reports_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id")
);
--> statement-breakpoint
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "saved_reports_workspace_category_creator_idx" ON "saved_reports" USING btree ("workspace_subdomain","category","created_by");--> statement-breakpoint
ALTER TABLE "saved_reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "saved_reports" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_isolation_policy ON "saved_reports" FOR ALL USING (
	current_setting('app.rls_bypass', true) = 'on'
	OR workspace_subdomain = NULLIF(current_setting('app.current_tenant', true), '')
) WITH CHECK (
	current_setting('app.rls_bypass', true) = 'on'
	OR workspace_subdomain = NULLIF(current_setting('app.current_tenant', true), '')
);
