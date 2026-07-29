-- custom_tabs: composite tenant PK + FORCE RLS (tenant write invariant)
ALTER TABLE "custom_tabs" DROP CONSTRAINT IF EXISTS "custom_tabs_pkey";--> statement-breakpoint
ALTER TABLE "custom_tabs" ADD CONSTRAINT "custom_tabs_workspace_subdomain_id_pk" PRIMARY KEY("workspace_subdomain","id");--> statement-breakpoint
ALTER TABLE "custom_tabs" FORCE ROW LEVEL SECURITY;
