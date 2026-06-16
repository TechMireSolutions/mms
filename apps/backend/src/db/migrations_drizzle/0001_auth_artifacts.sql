CREATE TABLE IF NOT EXISTS "auth_artifacts" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"payload" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "auth_artifacts_kind_expires_idx" ON "auth_artifacts" ("kind", "expires_at");
