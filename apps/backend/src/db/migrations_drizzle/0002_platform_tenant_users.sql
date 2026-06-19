CREATE TABLE IF NOT EXISTS "platform_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "platform_users_email_idx" ON "platform_users" ("email");

CREATE TABLE IF NOT EXISTS "tenant_users" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"login_email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"role" text DEFAULT 'assistant_teacher' NOT NULL,
	"contact_id" text,
	"email_verified_at" timestamp with time zone,
	"pending_login_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"profile_json" text
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_users_workspace_login_email_idx" ON "tenant_users" ("workspace_subdomain", "login_email");
CREATE INDEX IF NOT EXISTS "tenant_users_workspace_idx" ON "tenant_users" ("workspace_subdomain");
