CREATE TABLE "accounting_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounting_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounting_fiscal_years" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "accounting_accounts_workspace_subdomain_idx" ON "accounting_accounts" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "accounting_accounts_custom_data_gin_idx" ON "accounting_accounts" USING gin ("custom_data");--> statement-breakpoint
CREATE INDEX "accounting_entries_workspace_subdomain_idx" ON "accounting_entries" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "accounting_entries_custom_data_gin_idx" ON "accounting_entries" USING gin ("custom_data");--> statement-breakpoint
CREATE INDEX "accounting_fiscal_years_workspace_subdomain_idx" ON "accounting_fiscal_years" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "accounting_fiscal_years_custom_data_gin_idx" ON "accounting_fiscal_years" USING gin ("custom_data");