CREATE TABLE "background_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"module_id" text NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"label" text NOT NULL,
	"payload" text NOT NULL,
	"progress_current" integer,
	"progress_total" integer,
	"artifact_id" text,
	"has_download" boolean DEFAULT false NOT NULL,
	"error" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "background_jobs_tenant_user_idx" ON "background_jobs" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "background_jobs_status_idx" ON "background_jobs" USING btree ("status");