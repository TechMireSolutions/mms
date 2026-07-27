-- Replace fail-open tenant policies with exact-match (or explicit app.rls_bypass).
-- FORCE ROW LEVEL SECURITY only on messaging tables that always go through
-- withTenantTransaction via genericRepository / softDeleteActiveMessageLogs.
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT c.table_name
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.column_name = 'workspace_subdomain'
          AND c.table_name NOT IN ('tenant_users')
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', tbl);
        EXECUTE format(
            'CREATE POLICY tenant_isolation_policy ON %I FOR ALL USING (
                current_setting(''app.rls_bypass'', true) = ''on''
                OR workspace_subdomain = NULLIF(current_setting(''app.current_tenant'', true), '''')
            ) WITH CHECK (
                current_setting(''app.rls_bypass'', true) = ''on''
                OR workspace_subdomain = NULLIF(current_setting(''app.current_tenant'', true), '''')
            );',
            tbl
        );
    END LOOP;
END $$;
--> statement-breakpoint
ALTER TABLE "message_templates" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "message_logs" FORCE ROW LEVEL SECURITY;
