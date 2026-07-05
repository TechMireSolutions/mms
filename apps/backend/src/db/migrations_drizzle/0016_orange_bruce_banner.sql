CREATE TABLE "hasanat_batches" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hasanat_denoms" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hasanat_distributions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hasanat_redemptions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "hasanat_batches_workspace_subdomain_idx" ON "hasanat_batches" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "hasanat_batches_custom_data_gin_idx" ON "hasanat_batches" USING gin ("custom_data");--> statement-breakpoint
CREATE INDEX "hasanat_denoms_workspace_subdomain_idx" ON "hasanat_denoms" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "hasanat_denoms_custom_data_gin_idx" ON "hasanat_denoms" USING gin ("custom_data");--> statement-breakpoint
CREATE INDEX "hasanat_distributions_workspace_subdomain_idx" ON "hasanat_distributions" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "hasanat_distributions_custom_data_gin_idx" ON "hasanat_distributions" USING gin ("custom_data");--> statement-breakpoint
CREATE INDEX "hasanat_redemptions_workspace_subdomain_idx" ON "hasanat_redemptions" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "hasanat_redemptions_custom_data_gin_idx" ON "hasanat_redemptions" USING gin ("custom_data");