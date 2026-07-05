DELETE FROM "background_jobs" WHERE "user_id" NOT IN (SELECT "id" FROM "tenant_users");--> statement-breakpoint
UPDATE "tenant_users" SET "contact_id" = NULL WHERE "contact_id" IS NOT NULL AND "contact_id" NOT IN (SELECT "id" FROM "contacts");--> statement-breakpoint
ALTER TABLE "background_jobs" ADD CONSTRAINT "background_jobs_user_id_tenant_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tenant_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contacts_custom_data_gin_idx" ON "contacts" USING gin ("custom_data");