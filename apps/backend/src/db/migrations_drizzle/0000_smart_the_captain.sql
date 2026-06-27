CREATE TABLE "auth_artifacts" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"payload" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"name" text PRIMARY KEY NOT NULL,
	"data" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_migrations" (
	"id" text PRIMARY KEY NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "objects" (
	"key" text PRIMARY KEY NOT NULL,
	"data" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"email_verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_users" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"login_email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"role" text DEFAULT 'assistant_teacher' NOT NULL,
	"contact_id" text,
	"email_verified_at" timestamp,
	"pending_login_email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"profile_json" text
);
--> statement-breakpoint
CREATE INDEX "auth_artifacts_kind_expires_idx" ON "auth_artifacts" USING btree ("kind","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_users_email_idx" ON "platform_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_users_workspace_login_email_idx" ON "tenant_users" USING btree ("workspace_subdomain","login_email");--> statement-breakpoint
CREATE INDEX "tenant_users_workspace_idx" ON "tenant_users" USING btree ("workspace_subdomain");