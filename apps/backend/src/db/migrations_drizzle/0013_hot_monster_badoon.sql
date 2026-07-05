CREATE TABLE "mujtahid_reps" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mujtahids" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "obligation_collections" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "obligation_distributions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "obligation_types" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wakala_types" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "mujtahid_reps_workspace_subdomain_idx" ON "mujtahid_reps" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "mujtahid_reps_custom_data_gin_idx" ON "mujtahid_reps" USING gin ("custom_data");--> statement-breakpoint
CREATE INDEX "mujtahids_workspace_subdomain_idx" ON "mujtahids" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "mujtahids_custom_data_gin_idx" ON "mujtahids" USING gin ("custom_data");--> statement-breakpoint
CREATE INDEX "obligation_collections_workspace_subdomain_idx" ON "obligation_collections" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "obligation_collections_custom_data_gin_idx" ON "obligation_collections" USING gin ("custom_data");--> statement-breakpoint
CREATE INDEX "obligation_distributions_workspace_subdomain_idx" ON "obligation_distributions" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "obligation_distributions_custom_data_gin_idx" ON "obligation_distributions" USING gin ("custom_data");--> statement-breakpoint
CREATE INDEX "obligation_types_workspace_subdomain_idx" ON "obligation_types" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "obligation_types_custom_data_gin_idx" ON "obligation_types" USING gin ("custom_data");--> statement-breakpoint
CREATE INDEX "wakala_types_workspace_subdomain_idx" ON "wakala_types" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "wakala_types_custom_data_gin_idx" ON "wakala_types" USING gin ("custom_data");