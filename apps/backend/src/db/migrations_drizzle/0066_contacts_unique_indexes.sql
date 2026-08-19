-- Migration 0066: Contacts composite partial unique indexes for CNIC, Phone, and Email
-- Scoped per workspace, ignoring soft-deleted contacts and blank/NULL values.

CREATE UNIQUE INDEX IF NOT EXISTS "contacts_workspace_cnic_active_uidx"
  ON "contacts" (
    "workspace_subdomain",
    (regexp_replace("cnic", '[^0-9]', '', 'g'))
  )
  WHERE "deleted_at" IS NULL
    AND NULLIF(regexp_replace("cnic", '[^0-9]', '', 'g'), '') IS NOT NULL;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "contacts_workspace_phone_active_uidx"
  ON "contacts" (
    "workspace_subdomain",
    (regexp_replace("phone", '[^0-9]', '', 'g'))
  )
  WHERE "deleted_at" IS NULL
    AND NULLIF(regexp_replace("phone", '[^0-9]', '', 'g'), '') IS NOT NULL;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "contacts_workspace_email_active_uidx"
  ON "contacts" (
    "workspace_subdomain",
    (lower(trim("email")))
  )
  WHERE "deleted_at" IS NULL
    AND NULLIF(trim("email"), '') IS NOT NULL;
