CREATE TABLE "contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "contacts_workspace_subdomain_idx" ON "contacts" USING btree ("workspace_subdomain");