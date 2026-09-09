ALTER TABLE "contact_attachments" ALTER COLUMN "size" TYPE bigint;
ALTER TABLE "contact_relationships" ALTER COLUMN "related_contact_id" TYPE text;

DO $$ BEGIN
  ALTER TABLE "contact_relationships"
    ADD CONSTRAINT "contact_relationships_related_fk"
    FOREIGN KEY ("workspace_subdomain", "related_contact_id")
    REFERENCES "contacts"("workspace_subdomain", "id")
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "contacts" ALTER COLUMN "dob" TYPE date USING NULLIF("dob", '')::date;
ALTER TABLE "contacts" ALTER COLUMN "last_checked_at" TYPE timestamp with time zone USING NULLIF("last_checked_at", '')::timestamp with time zone;
