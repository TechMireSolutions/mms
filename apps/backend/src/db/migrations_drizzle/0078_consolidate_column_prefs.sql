-- Custom Data Migration: Move all legacy column preferences into generic system_user_ui_preferences store
-- This runs before Drizzle automatically drops the tables.

DO $$ 
DECLARE
    -- contacts
    rec RECORD;
BEGIN

    -- 1. Contacts
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('contacts.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM contact_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

    -- 2. Students
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('students.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM student_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

    -- 3. Teachers
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('teachers.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM teacher_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

    -- 4. Sessions
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('sessions.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM session_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

    -- 5. Enrollments
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('enrollments.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM enrollment_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

    -- 6. Users
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('users.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM user_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

    -- 7. Attendance
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('attendance.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM attendance_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

    -- 8. Question Bank
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('question-bank.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM question_bank_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

    -- 9. Finance Invoices
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('finance.invoice.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM finance_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

    -- 10. Finance Payments
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('finance.payment.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM finance_payment_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

    -- 11. Accounting Journals
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('accounting.journal.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM accounting_journal_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

    -- 12. Accounting Accounts
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('accounting.account.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM accounting_account_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

    -- 13. Examinations Exam
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('examinations.exam.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM examination_exam_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

    -- 14. Examinations Results
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('examinations.results.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM examination_results_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

    -- 15. Hasanat Distribution
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('hasanat.distribution.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM hasanat_distribution_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

    -- 16. Hasanat Redemption
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('hasanat.redemption.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM hasanat_redemption_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

    -- 17. Obligations
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('obligations.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM obligations_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

    -- 18. Messaging Recipients
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('messaging.recipients.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM messaging_recipients_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

    -- 19. Messaging History
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('messaging.history.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM messaging_history_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

    -- 20. Messaging Templates
    INSERT INTO system_user_ui_preferences (workspace_subdomain, user_id, preferences, created_at, updated_at)
    SELECT workspace_subdomain, user_id, 
        jsonb_build_object('messaging.templates.table.columns', preferences) AS preferences,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM messaging_templates_user_column_prefs
    ON CONFLICT (workspace_subdomain, user_id) 
    DO UPDATE SET preferences = system_user_ui_preferences.preferences || EXCLUDED.preferences, updated_at = CURRENT_TIMESTAMP;

END $$;

-- Drop tables
DROP TABLE IF EXISTS "accounting_account_user_column_prefs";
DROP TABLE IF EXISTS "accounting_journal_user_column_prefs";
DROP TABLE IF EXISTS "attendance_user_column_prefs";
DROP TABLE IF EXISTS "contact_user_column_prefs";
DROP TABLE IF EXISTS "enrollment_user_column_prefs";
DROP TABLE IF EXISTS "examination_exam_user_column_prefs";
DROP TABLE IF EXISTS "examination_results_user_column_prefs";
DROP TABLE IF EXISTS "finance_user_column_prefs";
DROP TABLE IF EXISTS "finance_payment_user_column_prefs";
DROP TABLE IF EXISTS "hasanat_distribution_user_column_prefs";
DROP TABLE IF EXISTS "hasanat_redemption_user_column_prefs";
DROP TABLE IF EXISTS "messaging_recipients_user_column_prefs";
DROP TABLE IF EXISTS "messaging_history_user_column_prefs";
DROP TABLE IF EXISTS "messaging_templates_user_column_prefs";
DROP TABLE IF EXISTS "obligations_user_column_prefs";
DROP TABLE IF EXISTS "question_bank_user_column_prefs";
DROP TABLE IF EXISTS "session_user_column_prefs";
DROP TABLE IF EXISTS "student_user_column_prefs";
DROP TABLE IF EXISTS "teacher_user_column_prefs";
DROP TABLE IF EXISTS "user_user_column_prefs";
