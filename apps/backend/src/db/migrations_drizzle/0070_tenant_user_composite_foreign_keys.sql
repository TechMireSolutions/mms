-- Forward-only Migration: 0070_tenant_user_composite_foreign_keys
-- Upgrades background_jobs and teachers foreign keys to composite referencing tenant_users(workspace_subdomain, id).

DO $$ BEGIN
  ALTER TABLE "background_jobs" DROP CONSTRAINT IF EXISTS "background_jobs_user_id_tenant_users_id_fk";
  ALTER TABLE "background_jobs" DROP CONSTRAINT IF EXISTS "background_jobs_user_fk";
  ALTER TABLE "background_jobs" ADD CONSTRAINT "background_jobs_user_fk"
    FOREIGN KEY ("tenant_id", "user_id") REFERENCES "tenant_users"("workspace_subdomain", "id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "teachers" DROP CONSTRAINT IF EXISTS "teachers_user_id_tenant_users_id_fk";
  ALTER TABLE "teachers" DROP CONSTRAINT IF EXISTS "teachers_user_fk";
  ALTER TABLE "teachers" ADD CONSTRAINT "teachers_user_fk"
    FOREIGN KEY ("workspace_subdomain", "user_id") REFERENCES "tenant_users"("workspace_subdomain", "id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
