-- Faculty domain residual cleanup: retire the last legacy "teacher" database objects.
-- The table/column/index/constraint rename shipped in 0112/0119/0120/0122; this migration
-- renames the surviving updated_at trigger and drops the remaining compatibility views.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgname = 'update_teachers_updated_at'
      AND c.relname = 'faculty'
      AND NOT t.tgisinternal
  ) THEN
    ALTER TRIGGER update_teachers_updated_at ON "faculty" RENAME TO update_faculty_updated_at;
  END IF;
END $$;
--> statement-breakpoint

DROP VIEW IF EXISTS teacher_lookups;
--> statement-breakpoint

DROP VIEW IF EXISTS teacher_field_configs;
--> statement-breakpoint

DROP VIEW IF EXISTS teacher_module_preferences;
--> statement-breakpoint

DROP VIEW IF EXISTS teacher_setup_config;
