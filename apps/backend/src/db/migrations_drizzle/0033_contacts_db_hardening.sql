-- Google Contacts OAuth credentials — tenant-scoped, FORCE RLS (not objects KV).
CREATE TABLE "contact_google_sync_credentials" (
	"workspace_subdomain" text NOT NULL,
	"user_id" text NOT NULL,
	"client_id" text,
	"client_secret" text,
	"access_token" text,
	"refresh_token" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contact_google_sync_credentials_pk" PRIMARY KEY("workspace_subdomain","user_id")
);
--> statement-breakpoint
ALTER TABLE "contact_google_sync_credentials" ADD CONSTRAINT "contact_google_sync_credentials_workspace_fk" FOREIGN KEY ("workspace_subdomain") REFERENCES "public"."workspaces"("subdomain") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_google_sync_credentials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contact_google_sync_credentials" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY tenant_isolation_policy ON "contact_google_sync_credentials" FOR ALL USING (
	current_setting('app.rls_bypass', true) = 'on'
	OR workspace_subdomain = NULLIF(current_setting('app.current_tenant', true), '')
) WITH CHECK (
	current_setting('app.rls_bypass', true) = 'on'
	OR workspace_subdomain = NULLIF(current_setting('app.current_tenant', true), '')
);
--> statement-breakpoint
-- Audit trigger: fill workspace_subdomain + keep reading app.current_user_id.
CREATE OR REPLACE FUNCTION log_row_change()
RETURNS TRIGGER AS $$
DECLARE
    v_old JSONB := NULL;
    v_new JSONB := NULL;
    v_user_id TEXT := NULL;
    v_workspace TEXT := NULL;
BEGIN
    BEGIN
        v_user_id := NULLIF(current_setting('app.current_user_id', true), '');
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    BEGIN
        v_workspace := NULLIF(current_setting('app.current_tenant', true), '');
    EXCEPTION WHEN OTHERS THEN
        v_workspace := NULL;
    END;

    IF v_workspace IS NULL THEN
        IF TG_OP = 'DELETE' THEN
            BEGIN
                v_workspace := OLD.workspace_subdomain;
            EXCEPTION WHEN undefined_column THEN
                v_workspace := NULL;
            END;
        ELSE
            BEGIN
                v_workspace := NEW.workspace_subdomain;
            EXCEPTION WHEN undefined_column THEN
                v_workspace := NULL;
            END;
        END IF;
    END IF;

    IF (TG_OP = 'UPDATE') THEN
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        v_old := to_jsonb(OLD);
    ELSIF (TG_OP = 'INSERT') THEN
        v_new := to_jsonb(NEW);
    END IF;

    INSERT INTO audit_logs (workspace_subdomain, table_name, record_id, action, old_values, new_values, user_id)
    VALUES (
        v_workspace,
        TG_TABLE_NAME::text,
        COALESCE(NEW.id::text, OLD.id::text),
        TG_OP,
        v_old,
        v_new,
        v_user_id
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
