-- Add updated_at to collections and objects
ALTER TABLE "collections" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();
ALTER TABLE "objects" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();

-- Add updated_at to platform_users
ALTER TABLE "platform_users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();

-- Add updated_at to tenant_users
ALTER TABLE "tenant_users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();

-- CHECK constraint: tenant_users.role must be a known workspace role
ALTER TABLE "tenant_users"
  ADD CONSTRAINT "tenant_users_role_check"
  CHECK (role IN ('admin', 'teacher', 'assistant_teacher', 'accountant'));

-- CHECK constraint: auth_artifacts.kind must be a known artifact kind
ALTER TABLE "auth_artifacts"
  ADD CONSTRAINT "auth_artifacts_kind_check"
  CHECK (kind IN ('handoff', 'two_factor_challenge', 'refresh_token', 'platform_setup', 'platform_password_reset', 'login_email_change'));

-- Index on collections.name prefix for efficient LIKE 'subdomain::%' batch deletes
CREATE INDEX IF NOT EXISTS "collections_name_prefix_idx"
  ON "collections" ("name" text_pattern_ops);

-- Index on objects.key prefix for efficient LIKE 'subdomain::%' batch deletes
CREATE INDEX IF NOT EXISTS "objects_key_prefix_idx"
  ON "objects" ("key" text_pattern_ops);

-- Auto-update trigger function (idempotent)
CREATE OR REPLACE FUNCTION mms_set_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers on each table
DROP TRIGGER IF EXISTS collections_updated_at ON "collections";
CREATE TRIGGER collections_updated_at
  BEFORE UPDATE ON "collections"
  FOR EACH ROW EXECUTE FUNCTION mms_set_updated_at();

DROP TRIGGER IF EXISTS objects_updated_at ON "objects";
CREATE TRIGGER objects_updated_at
  BEFORE UPDATE ON "objects"
  FOR EACH ROW EXECUTE FUNCTION mms_set_updated_at();

DROP TRIGGER IF EXISTS platform_users_updated_at ON "platform_users";
CREATE TRIGGER platform_users_updated_at
  BEFORE UPDATE ON "platform_users"
  FOR EACH ROW EXECUTE FUNCTION mms_set_updated_at();

DROP TRIGGER IF EXISTS tenant_users_updated_at ON "tenant_users";
CREATE TRIGGER tenant_users_updated_at
  BEFORE UPDATE ON "tenant_users"
  FOR EACH ROW EXECUTE FUNCTION mms_set_updated_at();
