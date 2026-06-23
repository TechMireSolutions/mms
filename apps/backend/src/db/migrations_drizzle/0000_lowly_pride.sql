CREATE TABLE `auth_artifacts` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_artifacts_kind_expires_idx` ON `auth_artifacts` (`kind`,`expires_at`);--> statement-breakpoint
CREATE TABLE `collections` (
	`name` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `objects` (
	`key` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `platform_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`email_verified_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `platform_users_email_idx` ON `platform_users` (`email`);--> statement-breakpoint
CREATE TABLE `tenant_users` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_subdomain` text NOT NULL,
	`login_email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`role` text DEFAULT 'assistant_teacher' NOT NULL,
	`contact_id` text,
	`email_verified_at` integer,
	`pending_login_email` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`profile_json` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenant_users_workspace_login_email_idx` ON `tenant_users` (`workspace_subdomain`,`login_email`);--> statement-breakpoint
CREATE INDEX `tenant_users_workspace_idx` ON `tenant_users` (`workspace_subdomain`);