CREATE TABLE IF NOT EXISTS "platform_settings" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"sync_tls_on_create" boolean DEFAULT true NOT NULL,
	"tls_extra_sans" text DEFAULT '' NOT NULL,
	"certbot_email" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
