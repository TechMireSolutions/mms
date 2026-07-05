CREATE TABLE "finance_invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_subdomain" text NOT NULL,
	"custom_data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "finance_invoices_workspace_subdomain_idx" ON "finance_invoices" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "finance_invoices_custom_data_gin_idx" ON "finance_invoices" USING gin ("custom_data");--> statement-breakpoint
CREATE INDEX "finance_payments_workspace_subdomain_idx" ON "finance_payments" USING btree ("workspace_subdomain");--> statement-breakpoint
CREATE INDEX "finance_payments_custom_data_gin_idx" ON "finance_payments" USING gin ("custom_data");