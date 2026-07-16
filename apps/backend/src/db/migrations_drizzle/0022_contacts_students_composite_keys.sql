-- 1. Drop existing foreign key constraint from tenant_users referencing contacts
ALTER TABLE "tenant_users" DROP CONSTRAINT IF EXISTS "tenant_users_contact_id_contacts_id_fk";

-- 2. Drop existing primary key constraints from target tables
ALTER TABLE "contacts" DROP CONSTRAINT IF EXISTS "contacts_pkey";
ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_pkey";
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_pkey";
ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "attendance_pkey";

-- 3. Add composite primary keys
ALTER TABLE "contacts" ADD PRIMARY KEY ("workspace_subdomain", "id");
ALTER TABLE "students" ADD PRIMARY KEY ("workspace_subdomain", "id");
ALTER TABLE "sessions" ADD PRIMARY KEY ("workspace_subdomain", "id");
ALTER TABLE "attendance" ADD PRIMARY KEY ("workspace_subdomain", "id");

-- 4. Add composite foreign key constraint to tenant_users
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_workspace_subdomain_contact_id_contacts_workspace_subdomain_id_fk"
  FOREIGN KEY ("workspace_subdomain", "contact_id")
  REFERENCES "contacts" ("workspace_subdomain", "id")
  ON DELETE SET NULL;
