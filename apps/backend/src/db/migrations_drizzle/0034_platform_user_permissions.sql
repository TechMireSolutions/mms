ALTER TABLE "platform_users" ADD COLUMN "permissions" jsonb DEFAULT '{"workspaces":false,"onboard":false}'::jsonb NOT NULL;
