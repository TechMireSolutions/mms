ALTER TABLE "accounting_accounts" DROP CONSTRAINT IF EXISTS "accounting_accounts_pkey";
ALTER TABLE "accounting_entries" DROP CONSTRAINT IF EXISTS "accounting_entries_pkey";
ALTER TABLE "accounting_fiscal_years" DROP CONSTRAINT IF EXISTS "accounting_fiscal_years_pkey";
ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "enrollments_pkey";
ALTER TABLE "exam_results" DROP CONSTRAINT IF EXISTS "exam_results_pkey";
ALTER TABLE "exams" DROP CONSTRAINT IF EXISTS "exams_pkey";
ALTER TABLE "finance_invoices" DROP CONSTRAINT IF EXISTS "finance_invoices_pkey";
ALTER TABLE "finance_payments" DROP CONSTRAINT IF EXISTS "finance_payments_pkey";
ALTER TABLE "hasanat_batches" DROP CONSTRAINT IF EXISTS "hasanat_batches_pkey";
ALTER TABLE "hasanat_denoms" DROP CONSTRAINT IF EXISTS "hasanat_denoms_pkey";
ALTER TABLE "hasanat_distributions" DROP CONSTRAINT IF EXISTS "hasanat_distributions_pkey";
ALTER TABLE "hasanat_redemptions" DROP CONSTRAINT IF EXISTS "hasanat_redemptions_pkey";
ALTER TABLE "mujtahid_reps" DROP CONSTRAINT IF EXISTS "mujtahid_reps_pkey";
ALTER TABLE "mujtahids" DROP CONSTRAINT IF EXISTS "mujtahids_pkey";
ALTER TABLE "obligation_collections" DROP CONSTRAINT IF EXISTS "obligation_collections_pkey";
ALTER TABLE "obligation_distributions" DROP CONSTRAINT IF EXISTS "obligation_distributions_pkey";
ALTER TABLE "obligation_types" DROP CONSTRAINT IF EXISTS "obligation_types_pkey";
ALTER TABLE "teachers" DROP CONSTRAINT IF EXISTS "teachers_pkey";
ALTER TABLE "wakala_types" DROP CONSTRAINT IF EXISTS "wakala_types_pkey";

ALTER TABLE "accounting_accounts" ADD CONSTRAINT "accounting_accounts_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");
ALTER TABLE "accounting_fiscal_years" ADD CONSTRAINT "accounting_fiscal_years_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");
ALTER TABLE "exams" ADD CONSTRAINT "exams_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");
ALTER TABLE "finance_invoices" ADD CONSTRAINT "finance_invoices_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");
ALTER TABLE "finance_payments" ADD CONSTRAINT "finance_payments_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");
ALTER TABLE "hasanat_batches" ADD CONSTRAINT "hasanat_batches_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");
ALTER TABLE "hasanat_denoms" ADD CONSTRAINT "hasanat_denoms_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");
ALTER TABLE "hasanat_distributions" ADD CONSTRAINT "hasanat_distributions_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");
ALTER TABLE "hasanat_redemptions" ADD CONSTRAINT "hasanat_redemptions_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");
ALTER TABLE "mujtahid_reps" ADD CONSTRAINT "mujtahid_reps_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");
ALTER TABLE "mujtahids" ADD CONSTRAINT "mujtahids_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");
ALTER TABLE "obligation_collections" ADD CONSTRAINT "obligation_collections_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");
ALTER TABLE "obligation_distributions" ADD CONSTRAINT "obligation_distributions_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");
ALTER TABLE "obligation_types" ADD CONSTRAINT "obligation_types_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");
ALTER TABLE "wakala_types" ADD CONSTRAINT "wakala_types_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");

ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "workspace_subdomain" text;
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;

CREATE INDEX IF NOT EXISTS "audit_logs_workspace_changed_idx" ON "audit_logs" USING btree ("workspace_subdomain","changed_at");
CREATE INDEX IF NOT EXISTS "contacts_workspace_deleted_idx" ON "contacts" USING btree ("workspace_subdomain","deleted_at");
CREATE INDEX IF NOT EXISTS "sessions_workspace_deleted_idx" ON "sessions" USING btree ("workspace_subdomain","deleted_at");
CREATE INDEX IF NOT EXISTS "students_workspace_deleted_idx" ON "students" USING btree ("workspace_subdomain","deleted_at");
CREATE INDEX IF NOT EXISTS "teachers_workspace_deleted_idx" ON "teachers" USING btree ("workspace_subdomain","deleted_at");

DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name = 'workspace_subdomain'
          AND table_name NOT IN ('tenant_users')
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', tbl);
        EXECUTE format('CREATE POLICY tenant_isolation_policy ON %I FOR ALL USING (workspace_subdomain = NULLIF(current_setting(''app.current_tenant'', true), '''') OR current_setting(''app.current_tenant'', true) IS NULL OR current_setting(''app.current_tenant'', true) = '''');', tbl);
    END LOOP;
END $$;
