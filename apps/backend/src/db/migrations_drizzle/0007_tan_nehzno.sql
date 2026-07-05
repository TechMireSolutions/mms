CREATE TABLE "custom_tabs" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"module_id" text NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"icon" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"permissions" jsonb,
	"description" text,
	"color" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "custom_tabs_workspace_module_key_idx" ON "custom_tabs" USING btree ("workspace_subdomain","module_id","key");--> statement-breakpoint
CREATE INDEX "custom_tabs_workspace_idx" ON "custom_tabs" USING btree ("workspace_subdomain");