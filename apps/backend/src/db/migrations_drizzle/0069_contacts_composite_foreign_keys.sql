-- Forward-only Migration: 0069_contacts_composite_foreign_keys
-- Adds DDL composite foreign keys for all 10 contacts child tables with ON DELETE CASCADE.

-- 1. contact_phones
DO $$ BEGIN
  ALTER TABLE "contact_phones" ADD CONSTRAINT "contact_phones_contact_fk"
    FOREIGN KEY ("workspace_subdomain", "contact_id") REFERENCES "contacts"("workspace_subdomain", "id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. contact_emails
DO $$ BEGIN
  ALTER TABLE "contact_emails" ADD CONSTRAINT "contact_emails_contact_fk"
    FOREIGN KEY ("workspace_subdomain", "contact_id") REFERENCES "contacts"("workspace_subdomain", "id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. contact_addresses
DO $$ BEGIN
  ALTER TABLE "contact_addresses" ADD CONSTRAINT "contact_addresses_contact_fk"
    FOREIGN KEY ("workspace_subdomain", "contact_id") REFERENCES "contacts"("workspace_subdomain", "id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. contact_socials
DO $$ BEGIN
  ALTER TABLE "contact_socials" ADD CONSTRAINT "contact_socials_contact_fk"
    FOREIGN KEY ("workspace_subdomain", "contact_id") REFERENCES "contacts"("workspace_subdomain", "id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. contact_educations
DO $$ BEGIN
  ALTER TABLE "contact_educations" ADD CONSTRAINT "contact_educations_contact_fk"
    FOREIGN KEY ("workspace_subdomain", "contact_id") REFERENCES "contacts"("workspace_subdomain", "id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. contact_experiences
DO $$ BEGIN
  ALTER TABLE "contact_experiences" ADD CONSTRAINT "contact_experiences_contact_fk"
    FOREIGN KEY ("workspace_subdomain", "contact_id") REFERENCES "contacts"("workspace_subdomain", "id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. contact_skills
DO $$ BEGIN
  ALTER TABLE "contact_skills" ADD CONSTRAINT "contact_skills_contact_fk"
    FOREIGN KEY ("workspace_subdomain", "contact_id") REFERENCES "contacts"("workspace_subdomain", "id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 8. contact_relationships
DO $$ BEGIN
  ALTER TABLE "contact_relationships" ADD CONSTRAINT "contact_relationships_contact_fk"
    FOREIGN KEY ("workspace_subdomain", "contact_id") REFERENCES "contacts"("workspace_subdomain", "id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 9. contact_activities
DO $$ BEGIN
  ALTER TABLE "contact_activities" ADD CONSTRAINT "contact_activities_contact_fk"
    FOREIGN KEY ("workspace_subdomain", "contact_id") REFERENCES "contacts"("workspace_subdomain", "id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 10. contact_attachments
DO $$ BEGIN
  ALTER TABLE "contact_attachments" ADD CONSTRAINT "contact_attachments_contact_fk"
    FOREIGN KEY ("workspace_subdomain", "contact_id") REFERENCES "contacts"("workspace_subdomain", "id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
