CREATE TABLE "message_templates" (
	"id" text NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "message_templates_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id")
);
--> statement-breakpoint
CREATE TABLE "message_logs" (
	"id" text NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "message_logs_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id")
);
--> statement-breakpoint
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_logs" ADD CONSTRAINT "message_logs_workspace_subdomain_workspaces_subdomain_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "message_templates_workspace_subdomain_idx" ON "message_templates" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "message_templates_custom_data_gin_idx" ON "message_templates" USING gin ("custom_data");--> statement-breakpoint
CREATE INDEX "message_logs_workspace_subdomain_idx" ON "message_logs" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "message_logs_custom_data_gin_idx" ON "message_logs" USING gin ("custom_data");--> statement-breakpoint
ALTER TABLE "message_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "message_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_isolation_policy ON "message_templates" FOR ALL USING (workspace_subdomain = NULLIF(current_setting('app.current_tenant', true), '') OR current_setting('app.current_tenant', true) IS NULL OR current_setting('app.current_tenant', true) = '');--> statement-breakpoint
CREATE POLICY tenant_isolation_policy ON "message_logs" FOR ALL USING (workspace_subdomain = NULLIF(current_setting('app.current_tenant', true), '') OR current_setting('app.current_tenant', true) IS NULL OR current_setting('app.current_tenant', true) = '');
