/**
 * @file settingsTypes.ts
 * @description Barrel for settings contracts and defaults. Domain blocks live in focused modules.
 *
 * Storage key → Interface mapping:
 *   "global_settings"       → GlobalSettings
 *   "attendance_settings"   → AttendanceModuleSettings
 *   "finance_settings"      → FinanceSettings
 *   "examinations_settings" → ExaminationsSettings
 *   "sessions_settings"     → SessionsSettings
 *   "enrollments_settings"  → EnrollmentsSettings
 *   "students_settings"     → StudentsSettings
 *   "teachers_settings"     → TeachersSettings
 *   "contact_preferences"   → ContactPreferences (see contactTypes; not ContactPreferencesSettings)
 *   "accounting_settings"   → AccountingSettings
 */
export * from "./moduleFieldSchema.js";
export * from "./globalSettingsTypes.js";
export * from "./moduleSettingsTypes.js";
export * from "./imageOptimizationUtils.js";
export * from "./moduleFieldConfigUtils.js";
export * from "./settingsDateFormatters.js";
export * from "./dashboardPreferencesTypes.js";
export * from "./moduleFieldSetupDefaults.js";
