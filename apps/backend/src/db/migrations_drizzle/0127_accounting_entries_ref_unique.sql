-- 0127_accounting_entries_ref_unique.sql
-- Enforce unique reference numbers for active journal entries per workspace
CREATE UNIQUE INDEX IF NOT EXISTS "accounting_entries_workspace_ref_active_uidx" ON "accounting_entries" USING btree ("workspace_subdomain", "ref") WHERE "deleted_at" IS NULL AND "ref" IS NOT NULL AND "ref" <> '';
