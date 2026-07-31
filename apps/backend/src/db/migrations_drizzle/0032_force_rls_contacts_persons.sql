-- FORCE RLS on person/entity tables that always write through withTenantTransaction.
ALTER TABLE "contacts" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "students" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "teachers" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sessions" FORCE ROW LEVEL SECURITY;
