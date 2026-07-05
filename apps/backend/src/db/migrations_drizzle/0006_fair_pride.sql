CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_name" text NOT NULL,
	"record_id" text NOT NULL,
	"action" text NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"user_id" text,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audit_logs_table_record_idx" ON "audit_logs" USING btree ("table_name","record_id");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION log_row_change()
RETURNS TRIGGER AS $$
DECLARE
    v_old JSONB := NULL;
    v_new JSONB := NULL;
    v_user_id TEXT := NULL;
BEGIN
    BEGIN
        v_user_id := current_setting('app.current_user_id', true);
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF (TG_OP = 'UPDATE') THEN
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        v_old := to_jsonb(OLD);
    ELSIF (TG_OP = 'INSERT') THEN
        v_new := to_jsonb(NEW);
    END IF;

    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id)
    VALUES (
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
--> statement-breakpoint
CREATE TRIGGER audit_contacts_trigger
AFTER INSERT OR UPDATE OR DELETE ON contacts
FOR EACH ROW EXECUTE FUNCTION log_row_change();
--> statement-breakpoint
CREATE TRIGGER audit_tenant_users_trigger
AFTER INSERT OR UPDATE OR DELETE ON tenant_users
FOR EACH ROW EXECUTE FUNCTION log_row_change();