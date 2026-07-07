/**
 * @file settingsTypes.ts
 * @description Canonical TypeScript interfaces and default values for every domain settings
 * object stored in the application's key-value database.
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
 *   "contact_preferences"   → ContactPreferencesSettings
 *   "accounting_settings"   → AccountingSettings
 */
import {
  formatDateParts,
  formatDatePartsWithMonthName,
} from "./dateFormatUtils.js";
import { normalizeDateFormat, type DateFormatId } from "./dateFormatUtils.js";
import type { AppTranslationKey } from "./appTranslations.js";
import type { TabDefinition, FieldDefinition, ColumnRegistryEntry } from "./contactTypes.js";
import {
  DEFAULT_QUESTION_CATEGORIES,
  DEFAULT_QUESTION_SOURCE_BOOKS,
  QUESTION_DIFFICULTY_IDS,
  QUESTION_SOURCE_FIELD_IDS,
  QUESTION_TYPE_IDS,
} from "./questionBankTypes.js";
import {
  normalizePasswordPolicy,
  normalizeSessionTimeout,
  normalizeThemeMode,
} from "./globalSettingsUtils.js";
import { normalizeTimezone } from "./timezoneUtils.js";
import {
  normalizeAppLanguage,
  getIntlLocaleForLanguage,
  type AppLanguageCode,
} from "./languageUtils.js";

export type { AppLanguageCode };

// ─── Customizable Form Fields Schema ──────────────────────────────────────────

export interface ModuleFieldConfig {
  enabled: boolean;
  required: boolean;
}

export interface ModuleCustomField {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "boolean" | "date" | "url" | "email" | "tags";
  required?: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
  defaultValue?: string;
  showInForm?: boolean;
  unique?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  mask?: string;
}

export interface ModuleFieldDef {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
  enabled?: boolean;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  unique?: boolean;
}

/**
 * Returns a sorted list of all module field definitions (default & custom)
 * based on the saved display sequence order in settings.
 *
 * @param defaultDefs The default field definitions of the module
 * @param fieldOrder The saved sequence of field IDs
 * @param fieldsConfig The toggled enable/required state for default fields
 * @param customFields Custom fields created by the user
 */
export function getSortedFields(
  defaultDefs: ModuleFieldDef[],
  fieldOrder: string[] | undefined,
  fieldsConfig: Record<string, ModuleFieldConfig> | undefined,
  customFields: ModuleCustomField[] | undefined
): ModuleFieldDef[] {
  const defaultFieldDefinitions = defaultDefs.map((fieldDefinition) => {
    const fieldConfig = fieldsConfig?.[fieldDefinition.id] || { enabled: true, required: !!fieldDefinition.required };
    return {
      ...fieldDefinition,
      enabled: fieldConfig.enabled,
      required: fieldConfig.required,
    };
  });

  const customFieldDefinitions = (customFields || []).map((customField) => ({
    id: customField.id,
    label: customField.label,
    type: customField.type,
    required: !!customField.required,
    options: customField.options,
    placeholder: customField.placeholder,
    description: customField.description,
    defaultValue: customField.defaultValue,
    unique: customField.unique,
    enabled: true,
  }));

  const fieldDefinitions = [...defaultFieldDefinitions, ...customFieldDefinitions];
  const order = fieldOrder || defaultDefs.map((fieldDefinition) => fieldDefinition.id);
  const orderIndexByFieldId = Object.fromEntries(order.map((fieldId, index) => [fieldId, index]));

  return fieldDefinitions.sort((leftField, rightField) => {
    const leftOrderIndex = orderIndexByFieldId[leftField.id] ?? 9999;
    const rightOrderIndex = orderIndexByFieldId[rightField.id] ?? 9999;
    return leftOrderIndex - rightOrderIndex;
  });
}

// ─── Global Settings ──────────────────────────────────────────────────────────

/**
 * System-wide, cross-cutting configuration that applies to the whole application.
 * This is intentionally kept lean — domain-specific flags live in their own settings objects.
 */
export interface GlobalSettings {
  /** UI language code — see `APP_LANGUAGES` in `languageUtils`. */
  language: AppLanguageCode;
  /** IANA timezone string, e.g. "Asia/Karachi". */
  timezone: string;
  /** Display date format token, e.g. "DD/MM/YYYY". */
  dateFormat: string;
  /** Master toggle for email-based notifications. */
  emailNotifications: boolean;
  /** Master toggle for SMS-based notifications. */
  smsNotifications: boolean;
  /** Whether two-factor authentication is enforced. */
  twoFactor: boolean;
  /** Session inactivity timeout in minutes. */
  sessionTimeout: string;
  /** Password policy level: "basic" | "medium" | "strong". */
  passwordPolicy: string;
  /** UI colour theme preference. */
  theme: "light" | "dark" | "system";
  /** Map of module IDs to their enabled status. */
  enabledModules: Record<string, boolean>;
  /** The chosen LLM provider. */
  llmProvider: "gemini" | "openai" | "anthropic" | "deepseek" | "openrouter" | "groq" | "alibaba" | "none";
  /** The user's LLM API key. */
  llmApiKey: string;
  /** Dynamic list of multiple LLM configurations. */
  llmConfigs: LlmConfig[];
}

import {
  type LlmConfig,
  type LlmProviderType,
  LLM_PROVIDERS_META,
} from "./llmSettingsTypes.js";


/** Definition for an application module. */
export interface ModuleDefinition {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: "core" | "academic" | "admin" | "finance";
  required?: boolean;
}

/** All toggleable modules — ids align with sidebar `moduleId` in navConfig. */
export const SYSTEM_MODULES: ModuleDefinition[] = [
  { id: "dashboard",   label: "Dashboard",      description: "Central overview and analytics",        icon: "LayoutDashboard", category: "core",     required: true },
  { id: "contacts",    label: "Contacts",       description: "Comprehensive CRM directory",         icon: "Users",           category: "core",     required: true },
  { id: "messaging",   label: "Messaging",      description: "SMS, WhatsApp and announcements",     icon: "MessageSquare",   category: "core",     required: true },
  { id: "students",    label: "Students",       description: "Student directory and records",       icon: "GraduationCap",   category: "academic", required: true },
  { id: "teachers",    label: "Teachers",       description: "Faculty directory and assignments",   icon: "School",          category: "academic" },
  { id: "sessions",    label: "Sessions",       description: "Classes, schedules and timetables",   icon: "Calendar",        category: "academic" },
  { id: "attendance",  label: "Attendance",     description: "Tracking and reporting",              icon: "UserCheck",       category: "academic" },
  { id: "enrollment",  label: "Enrollments",    description: "Student enrollment into sessions",    icon: "ClipboardList",   category: "academic" },
  { id: "hasanat",     label: "Hasanat Cards",  description: "Incentive and reward points",         icon: "Star",            category: "academic" },
  { id: "examination", label: "Examinations",   description: "Testing and grading systems",         icon: "FileText",        category: "academic" },
  { id: "questionBank", label: "Question Bank", description: "Question repository and test papers", icon: "Library",         category: "academic" },
  { id: "finance",     label: "Finance",        description: "Invoicing and fee management",        icon: "DollarSign",      category: "finance" },
  { id: "accounting",  label: "Accounting",     description: "General ledger and reports",          icon: "TrendingUp",      category: "finance" },
  { id: "users",       label: "Users",          description: "Role-based permissions and access",   icon: "UserCog",         category: "admin",    required: true },
];

/** Lookup map for module definitions by id. */
export const SYSTEM_MODULES_BY_ID: Record<string, ModuleDefinition> = Object.fromEntries(
  SYSTEM_MODULES.map((m) => [m.id, m])
);

/** Standalone module entry in the system-modules settings nav. */
export interface SystemModuleNavItem {
  type: "module";
  moduleId: string;
}

/** Grouped modules — mirrors grouped sections in app navigation. */
export interface SystemModuleNavGroup {
  type: "group";
  labelKey: AppTranslationKey;
  icon: string;
  moduleIds: string[];
}

export type SystemModuleNavEntry = SystemModuleNavItem | SystemModuleNavGroup;

/**
 * Settings-page layout for system modules — mirrors `NAV_ITEMS` grouping:
 * standalone items plus an Academics group for academic sub-modules.
 */
export const SYSTEM_MODULE_NAV: SystemModuleNavEntry[] = [
  { type: "module", moduleId: "dashboard" },
  { type: "module", moduleId: "contacts" },
  { type: "module", moduleId: "messaging" },
  {
    type: "group",
    labelKey: "nav.academics",
    icon: "BookOpen",
    moduleIds: ["students", "teachers", "sessions", "attendance", "enrollment", "hasanat", "examination", "questionBank"],
  },
  { type: "module", moduleId: "finance" },
  { type: "module", moduleId: "accounting" },
  { type: "module", moduleId: "users" },
];

/** Authoritative default values for GlobalSettings. */
export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  language: "en",
  timezone: "Asia/Karachi",
  dateFormat: "DD/MM/YYYY",
  emailNotifications: true,
  smsNotifications: false,
  twoFactor: false,
  sessionTimeout: "60",
  passwordPolicy: "strong",
  theme: "system",
  enabledModules: {
    dashboard: true,
    students: true,
    teachers: true,
    contacts: true,
    messaging: true,
    sessions: true,
    enrollment: true,
    attendance: true,
    examination: true,
    questionBank: true,
    finance: true,
    accounting: true,
    hasanat: true,
    users: true,
  },
  llmProvider: "none",
  llmApiKey: "",
  llmConfigs: [],
};

/**
 * Merges module visibility flags with defaults; required modules always stay enabled.
 */
export function normalizeEnabledModules(
  partial?: Record<string, boolean> | null
): Record<string, boolean> {
  const merged: Record<string, boolean> = {
    ...DEFAULT_GLOBAL_SETTINGS.enabledModules,
    ...(partial ?? {}),
  };
  for (const mod of SYSTEM_MODULES) {
    if (mod.required) {
      merged[mod.id] = true;
    } else if (!(mod.id in merged)) {
      merged[mod.id] = DEFAULT_GLOBAL_SETTINGS.enabledModules[mod.id] ?? true;
    }
  }
  return merged;
}

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1 || value === "1") return true;
  if (value === "false" || value === 0 || value === "0") return false;
  return fallback;
}

/**
 * Deep-merges stored global settings with defaults (including `enabledModules` keys).
 */
export function mergeGlobalSettings(
  partial?: Partial<GlobalSettings> | null
): GlobalSettings {
  const sessionTimeout = normalizeSessionTimeout(
    partial?.sessionTimeout ?? DEFAULT_GLOBAL_SETTINGS.sessionTimeout
  );
  const passwordPolicy = normalizePasswordPolicy(
    partial?.passwordPolicy ?? DEFAULT_GLOBAL_SETTINGS.passwordPolicy
  );
  const timezone = normalizeTimezone(
    partial?.timezone,
    DEFAULT_GLOBAL_SETTINGS.timezone
  );
  const dateFormat = normalizeDateFormat(
    partial?.dateFormat,
    DEFAULT_GLOBAL_SETTINGS.dateFormat as DateFormatId
  );
  const theme = normalizeThemeMode(partial?.theme ?? DEFAULT_GLOBAL_SETTINGS.theme);

  return {
    ...DEFAULT_GLOBAL_SETTINGS,
    ...partial,
    language: normalizeAppLanguage(partial?.language),
    timezone,
    dateFormat,
    theme,
    emailNotifications: coerceBoolean(
      partial?.emailNotifications,
      DEFAULT_GLOBAL_SETTINGS.emailNotifications
    ),
    smsNotifications: coerceBoolean(
      partial?.smsNotifications,
      DEFAULT_GLOBAL_SETTINGS.smsNotifications
    ),
    twoFactor: coerceBoolean(partial?.twoFactor, DEFAULT_GLOBAL_SETTINGS.twoFactor),
    sessionTimeout,
    passwordPolicy,
    enabledModules: normalizeEnabledModules(partial?.enabledModules),
    llmProvider: partial?.llmProvider ?? DEFAULT_GLOBAL_SETTINGS.llmProvider,
    llmApiKey: partial?.llmApiKey ?? DEFAULT_GLOBAL_SETTINGS.llmApiKey,
    llmConfigs: Array.isArray(partial?.llmConfigs) ? partial.llmConfigs : DEFAULT_GLOBAL_SETTINGS.llmConfigs,
  };
}

// ─── Attendance Module Settings ───────────────────────────────────────────────

export interface AttendanceModuleSettings {
  workingDays: string[];
  cutoffTime: string;
  lateThresholdMins: number;
  autoAbsentAfterMins: number;
  qrEnabled: boolean;
  lowAttendanceThreshold: number;
  notifyParents: boolean;
  requireNoteForAbsent: boolean;
  lockAfterSubmit: boolean;
  trackHalfDay: boolean;
  weeklyReport: boolean;
  attendanceAlerts: boolean;
  allowManualOverride: boolean;
  offlineEnabled: boolean;
  geoTagging: boolean;
  defaultViewLayout?: string;
  fields?: Record<string, any>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
  formTabs?: TabDefinition[];
  enabledTabs?: string[];
  requiredTabs?: string[];
}

export const DEFAULT_ATTENDANCE_SETTINGS: AttendanceModuleSettings = {
  workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  cutoffTime: "09:30",
  lateThresholdMins: 15,
  autoAbsentAfterMins: 30,
  qrEnabled: false,
  lowAttendanceThreshold: 75,
  notifyParents: true,
  requireNoteForAbsent: true,
  lockAfterSubmit: true,
  trackHalfDay: true,
  weeklyReport: true,
  attendanceAlerts: true,
  allowManualOverride: true,
  offlineEnabled: false,
  geoTagging: false,
  defaultViewLayout: "list",
  fields: {
    status: { enabled: true, required: true },
    timeIn: { enabled: true, required: true },
    timeOut: { enabled: true, required: true },
    notes: { enabled: true, required: false },
  },
  customFields: [],
  fieldOrder: ["status", "timeIn", "timeOut", "notes"],
};

export const DEFAULT_ATTENDANCE_FIELD_DEFS: ModuleFieldDef[] = [
  { id: "status", label: "Attendance Status", required: true },
  { id: "timeIn", label: "Time In" },
  { id: "timeOut", label: "Time Out" },
  { id: "notes", label: "Notes / Comments" },
];

// ─── Finance Module Settings ──────────────────────────────────────────────────

export interface FinanceSettings {
  currency: string;
  invoicePrefix: string;
  dueDays: string;
  lateFeePercent: string;
  taxRate: string;
  paymentMethods: string[];
  autoGenerateInvoice: boolean;
  sendInvoiceEmail: boolean;
  allowPartialPayment: boolean;
  requireApproval: boolean;
  overdueReminder: boolean;
  reminderDaysBefore: string;
  feeReminders: boolean;
  defaultViewLayout?: string;
  fields?: Record<string, any>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
  formTabs?: TabDefinition[];
  enabledTabs?: string[];
  requiredTabs?: string[];
}

export const DEFAULT_FINANCE_SETTINGS: FinanceSettings = {
  currency: "PKR",
  invoicePrefix: "INV",
  dueDays: "30",
  lateFeePercent: "5",
  taxRate: "0",
  paymentMethods: ["cash", "bank_transfer"],
  autoGenerateInvoice: true,
  sendInvoiceEmail: true,
  allowPartialPayment: true,
  requireApproval: false,
  overdueReminder: true,
  reminderDaysBefore: "3",
  feeReminders: true,
  defaultViewLayout: "list",
  fields: {
    method: { enabled: true, required: true },
    date: { enabled: true, required: true },
    receivedBy: { enabled: true, required: false },
    note: { enabled: true, required: false },
  },
  customFields: [],
  fieldOrder: ["method", "date", "receivedBy", "note"],
};

export const DEFAULT_FINANCE_FIELD_DEFS: ModuleFieldDef[] = [
  { id: "amount", label: "Amount", required: true },
  { id: "method", label: "Payment Method" },
  { id: "date", label: "Payment Date" },
  { id: "receivedBy", label: "Received By" },
  { id: "note", label: "Note" },
];

// ─── Examinations Module Settings ─────────────────────────────────────────────

/**
 * Configuration for the Examinations module.
 * Stored under the key "examinations_settings".
 */
export interface ExaminationsSettings {
  /** Minimum mark required to pass. */
  passMark: string;
  /** Maximum achievable mark. */
  maxMark: string;
  /** Grading system: "percentage" | "gpa" | "letter" | "custom". */
  gradingSystem: string;
  /** Whether student rankings are displayed on result cards. */
  showRankings: boolean;
  /** Whether students can retake failed exams. */
  allowRetake: boolean;
  /** Whether results are published immediately after grading. */
  autoPublishResults: boolean;
  /** Whether students/guardians receive a notification when results are published. */
  notifyOnResult: boolean;
  /** Certificate template identifier. */
  certificateTemplate: string;
  /** Whether AI-assisted grading is enabled. */
  aiGrading: boolean;
  /** Whether honours/distinction are awarded to high scorers. */
  distinguishHonours: boolean;
  /** Whether exam reminder notifications are sent to students/guardians. */
  examReminders: boolean;
  defaultViewLayout?: string;
  fields?: Record<string, any>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
  formTabs?: TabDefinition[];
  enabledTabs?: string[];
  requiredTabs?: string[];
}

/** Authoritative default values for ExaminationsSettings. */
export const DEFAULT_EXAMINATIONS_SETTINGS: ExaminationsSettings = {
  passMark: "50",
  maxMark: "100",
  gradingSystem: "percentage",
  showRankings: true,
  allowRetake: true,
  autoPublishResults: false,
  notifyOnResult: true,
  certificateTemplate: "default",
  aiGrading: false,
  distinguishHonours: true,
  examReminders: true,
  defaultViewLayout: "list",
  fields: {
    subject: { enabled: true, required: true },
    status: { enabled: true, required: true },
    totalMarks: { enabled: true, required: false },
    passingMarks: { enabled: true, required: false },
    duration: { enabled: true, required: false },
    description: { enabled: true, required: false },
  },
  customFields: [],
  fieldOrder: ["subject", "status", "totalMarks", "passingMarks", "duration", "description"],
};

// ─── Question Bank Module Settings ────────────────────────────────────────────

export interface QuestionBankSettings {
  aiGrading: boolean;
  defaultTestDuration: number;
  categories: import('./questionBankTypes.js').QuestionCategory[];
  sourceBooks?: import('./questionBankTypes.js').QuestionSourceBook[];
  questionTypes?: import('./questionBankTypes.js').QuestionTypeRegistryEntry[];
  difficultyLevels?: import('./questionBankTypes.js').QuestionDifficultyRegistryEntry[];
  defaultViewLayout?: string;
  fields?: Record<string, any>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
  formTabs?: TabDefinition[];
  enabledTabs?: string[];
  requiredTabs?: string[];
}

export const DEFAULT_QUESTION_BANK_SETTINGS: QuestionBankSettings = {
  aiGrading: false,
  defaultTestDuration: 30,
  categories: [],
  sourceBooks: [],
  questionTypes: [
    { id: 'mcq', enabled: true },
    { id: 'true_false', enabled: true },
    { id: 'short', enabled: true },
    { id: 'fill_blank', enabled: true },
    { id: 'matching', enabled: true },
    { id: 'numeric', enabled: true },
    { id: 'ordering', enabled: true },
  ],
  difficultyLevels: [
    { id: 'easy', enabled: true },
    { id: 'medium', enabled: true },
    { id: 'hard', enabled: true },
  ],
  defaultViewLayout: 'list',
  fields: {
    text: { enabled: true, required: true },
    categoryId: { enabled: true, required: true },
    questionLanguage: { enabled: true, required: true },
    type: { enabled: true, required: true },
    difficulty: { enabled: true, required: true },
    options: { enabled: true, required: false },
    answer: { enabled: true, required: false },
  },
  customFields: [],
  fieldOrder: [
    'text',
    'categoryId',
    'questionLanguage',
    'type',
    'difficulty',
    'options',
    'answer',
    ...QUESTION_SOURCE_FIELD_IDS,
  ],
};

export const DEFAULT_QUESTION_BANK_FIELD_DEFS: ModuleFieldDef[] = [
  { id: 'text', label: 'Question text', type: 'textarea', required: true },
  { id: 'categoryId', label: 'Category', type: 'select', required: true },
  { id: 'questionLanguage', label: 'Question language', type: 'select', required: true },
  { id: 'type', label: 'Question type', type: 'select', required: true },
  { id: 'difficulty', label: 'Difficulty', type: 'select', required: true },
  { id: 'options', label: 'Options', type: 'options' },
  { id: 'answer', label: 'Answer', type: 'answer' },
  { id: 'sourceBookName', label: 'Book name', type: 'text' },
  { id: 'sourceSeries', label: 'Book series', type: 'text' },
  { id: 'sourceBookVolume', label: 'Book volume', type: 'text' },
  { id: 'sourceVolumePart', label: 'Volume part', type: 'text' },
  { id: 'sourceEdition', label: 'Edition', type: 'text' },
  { id: 'sourceIsbn', label: 'ISBN', type: 'text' },
  { id: 'sourceAuthor', label: 'Author', type: 'text' },
  { id: 'sourceEditor', label: 'Editor', type: 'text' },
  { id: 'sourceTranslator', label: 'Translator', type: 'text' },
  { id: 'sourcePublisher', label: 'Publisher', type: 'text' },
  { id: 'sourceCityOfPublication', label: 'City of publication', type: 'text' },
  { id: 'sourcePublishDate', label: 'Publishing date', type: 'date' },
  { id: 'sourceYearHijri', label: 'Hijri year', type: 'text' },
  { id: 'sourceLanguage', label: 'Source language', type: 'text' },
  { id: 'sourceChapter', label: 'Chapter / section', type: 'text' },
  { id: 'sourcePageNumber', label: 'Page number', type: 'text' },
  { id: 'sourceParagraph', label: 'Paragraph', type: 'text' },
  { id: 'sourceFootnote', label: 'Footnote', type: 'text' },
  { id: 'sourceSurah', label: 'Surah', type: 'text' },
  { id: 'sourceAyah', label: 'Ayah / verse', type: 'text' },
  { id: 'sourceJuz', label: 'Juz', type: 'text' },
  { id: 'sourceHizb', label: 'Hizb / rub', type: 'text' },
  { id: 'sourceHadithCollection', label: 'Hadith collection', type: 'text' },
  { id: 'sourceHadithNumber', label: 'Hadith number', type: 'text' },
  { id: 'sourceManuscript', label: 'Manuscript', type: 'text' },
  { id: 'sourceCatalogNumber', label: 'Catalog / shelf number', type: 'text' },
  { id: 'sourceQuote', label: 'Quoted excerpt', type: 'textarea' },
  { id: 'sourceNotes', label: 'Source notes', type: 'textarea' },
];

function isTabbedQuestionBankFields(fields: Record<string, any> | undefined): boolean {
  if (!fields) return false;
  return Object.values(fields).some(Array.isArray);
}

function questionBankFieldTypeForEditor(type: ModuleFieldDef['type'] | undefined): FieldDefinition['type'] {
  if (type === 'textarea') return 'textarea';
  if (type === 'number') return 'number';
  if (type === 'date') return 'date';
  if (type === 'select') return 'select';
  if (type === 'boolean') return 'boolean';
  return 'text';
}

function readQuestionBankFlatFieldConfig(
  storedFields: Record<string, any> | undefined,
): Record<string, { enabled: boolean; required: boolean }> {
  const result: Record<string, { enabled: boolean; required: boolean }> = {};
  const fields = {
    ...(DEFAULT_QUESTION_BANK_SETTINGS.fields ?? {}),
    ...(storedFields ?? {}),
  };
  for (const [fieldId, config] of Object.entries(fields)) {
    if (config && typeof config === 'object' && !Array.isArray(config)) {
      result[fieldId] = {
        enabled: (config as { enabled?: boolean }).enabled !== false,
        required: !!(config as { required?: boolean }).required,
      };
    }
  }
  return result;
}

function normalizeQuestionBankFieldsForEditor(
  storedFields: Record<string, any> | undefined,
): Record<string, FieldDefinition[]> {
  if (isTabbedQuestionBankFields(storedFields)) {
    const normalized: Record<string, FieldDefinition[]> = {};
    for (const [tabId, tabFields] of Object.entries(storedFields ?? {})) {
      normalized[tabId] = Array.isArray(tabFields) ? tabFields : [];
    }
    for (const [tabId, seedFields] of Object.entries(INITIAL_QUESTION_BANK_FIELD_SEED)) {
      const current = normalized[tabId] ?? [];
      const currentKeys = new Set(current.map((field) => field.key));
      normalized[tabId] = [
        ...current,
        ...seedFields.filter((field) => !currentKeys.has(field.key)),
      ];
    }
    return normalized;
  }

  const flatConfig = readQuestionBankFlatFieldConfig(storedFields);
  const normalized: Record<string, FieldDefinition[]> = {};
  const assignedKeys = new Set<string>();

  for (const [tabId, seedFields] of Object.entries(INITIAL_QUESTION_BANK_FIELD_SEED)) {
    normalized[tabId] = seedFields.map((field) => {
      assignedKeys.add(field.key);
      const config = flatConfig[field.key];
      return {
        ...field,
        enabled: config?.enabled ?? field.enabled,
        required: config?.required ?? field.required,
      };
    });
  }

  const fieldDefById = new Map(DEFAULT_QUESTION_BANK_FIELD_DEFS.map((field) => [field.id, field]));
  for (const [fieldId, config] of Object.entries(flatConfig)) {
    if (assignedKeys.has(fieldId)) continue;
    const fieldDef = fieldDefById.get(fieldId);
    normalized.options = [
      ...(normalized.options ?? []),
      {
        key: fieldId,
        label: fieldDef?.label ?? fieldId,
        type: questionBankFieldTypeForEditor(fieldDef?.type),
        enabled: config.enabled,
        required: config.required,
        order: normalized.options?.length ?? 0,
      },
    ];
  }

  for (const fieldId of QUESTION_SOURCE_FIELD_IDS) {
    if (assignedKeys.has(fieldId)) continue;
    const fieldDef = fieldDefById.get(fieldId);
    normalized.options = [
      ...(normalized.options ?? []),
      {
        key: fieldId,
        label: fieldDef?.label ?? fieldId,
        type: questionBankFieldTypeForEditor(fieldDef?.type),
        enabled: storedFields?.[fieldId]?.enabled ?? true,
        required: storedFields?.[fieldId]?.required ?? false,
        order: normalized.options?.length ?? 0,
      },
    ];
    assignedKeys.add(fieldId);
  }

  return normalized;
}

/**
 * Merges stored question-bank settings with defaults (categories, type/difficulty registries).
 */
export function normalizeQuestionBankSettings(
  stored?: Partial<QuestionBankSettings> | null,
): QuestionBankSettings {
  const merged: QuestionBankSettings = {
    ...DEFAULT_QUESTION_BANK_SETTINGS,
    ...(stored ?? {}),
  };

  merged.categories =
    stored?.categories && stored.categories.length > 0
      ? stored.categories
      : DEFAULT_QUESTION_CATEGORIES;

  merged.sourceBooks =
    stored?.sourceBooks && stored.sourceBooks.length > 0
      ? stored.sourceBooks
      : DEFAULT_QUESTION_SOURCE_BOOKS;

  const typeById = new Map(
    (stored?.questionTypes ?? []).map((questionType) => [questionType.id, questionType]),
  );
  merged.questionTypes = QUESTION_TYPE_IDS.map((questionTypeId) => ({
    id: questionTypeId,
    enabled: typeById.get(questionTypeId)?.enabled ?? true,
  }));

  const diffById = new Map(
    (stored?.difficultyLevels ?? []).map((difficultyLevel) => [difficultyLevel.id, difficultyLevel]),
  );
  merged.difficultyLevels = QUESTION_DIFFICULTY_IDS.map((difficultyLevelId) => ({
    id: difficultyLevelId,
    enabled: diffById.get(difficultyLevelId)?.enabled ?? true,
  }));

  merged.fields = normalizeQuestionBankFieldsForEditor(stored?.fields);
  const defaultOrder = DEFAULT_QUESTION_BANK_SETTINGS.fieldOrder ?? [];
  const storedOrder =
    stored?.fieldOrder && stored.fieldOrder.length > 0 ? stored.fieldOrder : defaultOrder;
  const missingSource = QUESTION_SOURCE_FIELD_IDS.filter((sourceFieldId) => !storedOrder.includes(sourceFieldId));
  merged.fieldOrder = [...storedOrder, ...missingSource];

  return merged;
}

export const DEFAULT_EXAMINATIONS_FIELD_DEFS: ModuleFieldDef[] = [
  { id: "name", label: "Exam Name", required: true },
  { id: "subject", label: "Subject" },
  { id: "status", label: "Status" },
  { id: "totalMarks", label: "Total Marks" },
  { id: "passingMarks", label: "Passing Marks" },
  { id: "duration", label: "Duration (min)" },
  { id: "date", label: "Exam Date", required: true },
  { id: "classIds", label: "Assign to Classes", required: true },
  { id: "description", label: "Description" },
];

// ─── Sessions Module Settings ─────────────────────────────────────────────────

/**
 * Configuration for the Sessions module.
 * Stored under the key "sessions_settings".
 */
export interface SessionsSettings {
  /** Default session duration in months. */
  defaultDuration: string;
  /** Default session type: "annual" | "semester" | "trimester" | "quarterly". */
  defaultSessionType: string;
  /** Whether multiple active sessions can run simultaneously. */
  allowOverlap: boolean;
  /** Whether completed sessions are automatically archived. */
  archiveOldSessions: boolean;
  /** Whether a session must have a budget plan before activation. */
  requireBudget: boolean;
  /** Whether to warn when class schedules overlap. */
  timetableConflictCheck: boolean;
  /** Whether to send a notification when a new session begins. */
  notifyOnSessionStart: boolean;
  /** Current academic year label, e.g. "2025-2026". */
  academicYear: string;
  /** Month in which the academic session starts, e.g. "april". */
  sessionStart: string;
  defaultViewLayout?: string;
  fields?: Record<string, any>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
  formTabs?: TabDefinition[];
  enabledTabs?: string[];
  requiredTabs?: string[];
}

/** Authoritative default values for SessionsSettings. */
export const DEFAULT_SESSIONS_SETTINGS: SessionsSettings = {
  defaultDuration: "12",
  defaultSessionType: "annual",
  allowOverlap: false,
  archiveOldSessions: true,
  requireBudget: false,
  timetableConflictCheck: true,
  notifyOnSessionStart: true,
  academicYear: "2025-2026",
  sessionStart: "april",
  defaultViewLayout: "cards",
  fields: {
    type: { enabled: true, required: true },
    status: { enabled: true, required: true },
    baseFee: { enabled: true, required: true },
    currency: { enabled: true, required: true },
    description: { enabled: true, required: false },
  },
  customFields: [],
  fieldOrder: ["type", "status", "baseFee", "currency", "description"],
};

export const DEFAULT_SESSIONS_FIELD_DEFS: ModuleFieldDef[] = [
  { id: "name", label: "Session Name", required: true },
  { id: "type", label: "Session Type" },
  { id: "status", label: "Status" },
  { id: "startDate", label: "Start Date", required: true },
  { id: "endDate", label: "End Date", required: true },
  { id: "baseFee", label: "Base Fee" },
  { id: "currency", label: "Currency" },
  { id: "description", label: "Description" },
];

// ─── Enrollments Module Settings ──────────────────────────────────────────────

/**
 * Configuration for the Enrollments module.
 * Stored under the key "enrollments_settings".
 */
export interface EnrollmentsSettings {
  /** Maximum students allowed per class. */
  maxStudentsPerClass: string;
  /** Whether a waitlist is available when a class is full. */
  waitlistEnabled: boolean;
  /** Whether eligibility rules run before confirming enrollment. */
  requireEligibilityCheck: boolean;
  /** Whether the system auto-assigns students to the best available class. */
  autoAssignClass: boolean;
  /** Whether admin approval is required before enrollment is confirmed. */
  enrollmentApproval: boolean;
  /** Whether students can be transferred between classes. */
  allowTransfers: boolean;
  /** Days after enrollment within which a student can drop without penalty. */
  dropDeadlineDays: string;
  /** Whether guardians receive a reminder when re-enrollment opens. */
  reenrollmentReminder: boolean;
  defaultViewLayout?: string;
  fields?: Record<string, any>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
  formTabs?: TabDefinition[];
  enabledTabs?: string[];
  requiredTabs?: string[];
}

/** Authoritative default values for EnrollmentsSettings. */
export const DEFAULT_ENROLLMENTS_SETTINGS: EnrollmentsSettings = {
  maxStudentsPerClass: "30",
  waitlistEnabled: true,
  requireEligibilityCheck: true,
  autoAssignClass: false,
  enrollmentApproval: true,
  allowTransfers: true,
  dropDeadlineDays: "14",
  reenrollmentReminder: true,
  defaultViewLayout: "list",
  fields: {
    notes: { enabled: true, required: false },
  },
  customFields: [],
  fieldOrder: ["notes"],
};

export const DEFAULT_ENROLLMENTS_FIELD_DEFS: ModuleFieldDef[] = [
  { id: "studentId", label: "Select Student", required: true },
  { id: "sessionId", label: "Select Session", required: true },
  { id: "classId", label: "Assign Class", required: true },
  { id: "notes", label: "Notes" },
];

// ─── Students Module Settings ─────────────────────────────────────────────────

export interface StudentFieldConfig {
  enabled: boolean;
  required: boolean;
}

export interface StudentCustomField {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "boolean" | "date";
  required?: boolean;
  options?: string[];
}

/**
 * Configuration for the Students module.
 * Stored under the key "students_settings".
 */
export interface StudentsSettings {
  /** Prefix for auto-generated student IDs, e.g. "STU". */
  idPrefix: string;
  /** Whether the system generates student IDs automatically. */
  autoGenerateId: boolean;
  /** Whether every student profile must have a guardian linked. */
  requireGuardian: boolean;
  /** Whether a profile photo is mandatory. */
  requirePhoto: boolean;
  /** Default gender pre-selected on the registration form; empty means no default. */
  defaultGender: string;
  /** Maximum allowed student age. */
  maxAge: string;
  /** Minimum allowed student age. */
  minAge: string;
  /** Whether sibling discounts are enabled in the fee structure. */
  allowSiblingDiscount: boolean;
  /** Format pattern for auto-generated GR Numbers, e.g. "{seq}-{year}" or "GR-{seq}". */
  grNumberTemplate: string;
  /** Zero-padding length for the GR number sequence. */
  grNumberDigits: number;
  /** Whether sequence restarts from 1 at the beginning of each year. */
  grNumberRestartAnnually: boolean;
  defaultViewLayout?: string;
  /** Field level customization visibility/requirement toggles */
  fields?: Record<string, any>;
  /** User defined dynamic custom fields */
  customFields?: StudentCustomField[];
  /** Sequence ordering of the default and custom fields in the form/views */
  fieldOrder?: string[];
  formTabs?: TabDefinition[];
  enabledTabs?: string[];
  requiredTabs?: string[];
  columnRegistry?: ColumnRegistryEntry[];
  version?: number;
}

/** Authoritative default values for StudentsSettings. */
export const DEFAULT_STUDENTS_SETTINGS: StudentsSettings = {
  idPrefix: "STU",
  autoGenerateId: true,
  requireGuardian: true,
  requirePhoto: false,
  defaultGender: "",
  maxAge: "25",
  minAge: "5",
  allowSiblingDiscount: true,
  grNumberTemplate: "{seq}-{year}",
  grNumberDigits: 4,
  grNumberRestartAnnually: true,
  defaultViewLayout: "list",
  fields: {
    gender: { enabled: true, required: true },
    dob: { enabled: true, required: true },
    fatherLink: { enabled: true, required: false },
    motherLink: { enabled: true, required: false },
    guardianLink: { enabled: true, required: false },
    registeredDate: { enabled: true, required: true },
  },
  customFields: [],
  fieldOrder: ["gender", "dob", "fatherLink", "motherLink", "guardianLink", "registeredDate"],
};

export interface StudentFieldDef {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
  enabled?: boolean;
  isCustom?: boolean;
}

export const DEFAULT_STUDENT_FIELD_DEFS: StudentFieldDef[] = [
  { id: "gender", label: "Gender" },
  { id: "dob", label: "Date of Birth" },
  { id: "fatherLink", label: "Father" },
  { id: "motherLink", label: "Mother" },
  { id: "guardianLink", label: "Guardian" },
  { id: "registeredDate", label: "Registration Date" },
];

/** Contact-owned fields — list/detail display only; never on the registration form. */
export const STUDENT_CONTACT_PROFILE_FIELD_IDS = ["gender", "dob"] as const;

/**
 * Student form fields excluding contact profile fields (gender, DOB).
 */
export function getStudentRegistrationFields(
  fieldOrder: string[] | undefined,
  fieldsConfig: Record<string, StudentFieldConfig> | undefined,
  customFields: StudentCustomField[] | undefined,
): StudentFieldDef[] {
  return getSortedStudentFields(fieldOrder, fieldsConfig, customFields).filter(
    (field) => !STUDENT_CONTACT_PROFILE_FIELD_IDS.includes(
      field.id as (typeof STUDENT_CONTACT_PROFILE_FIELD_IDS)[number],
    ),
  );
}

/**
 * Returns a sorted list of all student field definitions (default & custom)
 * based on the saved display sequence order in StudentsSettings.
 */
export function getSortedStudentFields(
  fieldOrder: string[] | undefined,
  fieldsConfig: Record<string, StudentFieldConfig> | undefined,
  customFields: StudentCustomField[] | undefined
): StudentFieldDef[] {
  const defaultFieldDefinitions = DEFAULT_STUDENT_FIELD_DEFS.map((fieldDefinition) => {
    const studentFieldConfig = fieldsConfig?.[fieldDefinition.id] || { enabled: true, required: false };
    return {
      ...fieldDefinition,
      enabled: studentFieldConfig.enabled,
      required: studentFieldConfig.required,
      isCustom: false,
    };
  });

  const customFieldDefinitions = (customFields || []).map((customField) => ({
    id: customField.id,
    label: customField.label,
    type: customField.type,
    required: customField.required,
    options: customField.options,
    enabled: true,
    isCustom: true,
  }));

  const fieldDefinitions = [...defaultFieldDefinitions, ...customFieldDefinitions];
  const order = fieldOrder || ["gender", "dob", "fatherLink", "motherLink", "guardianLink", "registeredDate"];

  const orderIndexByFieldId = Object.fromEntries(order.map((fieldId, index) => [fieldId, index]));
  return fieldDefinitions.sort((leftField, rightField) => {
    const leftOrderIndex = orderIndexByFieldId[leftField.id] ?? 9999;
    const rightOrderIndex = orderIndexByFieldId[rightField.id] ?? 9999;
    return leftOrderIndex - rightOrderIndex;
  });
}

// ─── Teachers Module Settings ─────────────────────────────────────────────────

export interface TeacherFieldConfig {
  enabled?: boolean;
  required?: boolean;
}

export interface TeacherCustomField {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
}

/**
 * Configuration for the Teachers module.
 * Stored under the key "teachers_settings".
 */
export interface TeachersSettings {
  idPrefix: string;
  autoGenerateId: boolean;
  requireContactLink: boolean;
  defaultSpecialization: string;
  defaultViewLayout?: string;
  fields?: Record<string, any>;
  customFields?: TeacherCustomField[];
  fieldOrder?: string[];
  formTabs?: TabDefinition[];
  enabledTabs?: string[];
  requiredTabs?: string[];
  columnRegistry?: ColumnRegistryEntry[];
}

/** Authoritative default values for TeachersSettings. */
export const DEFAULT_TEACHERS_SETTINGS: TeachersSettings = {
  idPrefix: "TCH",
  autoGenerateId: true,
  requireContactLink: true,
  defaultSpecialization: "General",
  defaultViewLayout: "list",
  fields: {
    specialization: { enabled: true, required: true },
    qualification: { enabled: true, required: false },
    joinDate: { enabled: true, required: true },
  },
  customFields: [],
  fieldOrder: ["specialization", "qualification", "joinDate"],
};

export interface TeacherFieldDef {
  id: string;
  labelKey?: string;
  label?: string;
  type?: string;
  required?: boolean;
  options?: string[];
  enabled?: boolean;
  isCustom?: boolean;
}

export const DEFAULT_TEACHER_FIELD_DEFS: TeacherFieldDef[] = [
  { id: "specialization", labelKey: "teachers.field.specialization" },
  { id: "qualification", labelKey: "teachers.field.qualification" },
  { id: "joinDate", labelKey: "teachers.field.joinDate" },
];

/**
 * Returns sorted teacher field definitions (default & custom) per saved order.
 */
export function getSortedTeacherFields(
  fieldOrder: string[] | undefined,
  fieldsConfig: Record<string, TeacherFieldConfig> | undefined,
  customFields: TeacherCustomField[] | undefined,
): TeacherFieldDef[] {
  const defaultFieldDefinitions = DEFAULT_TEACHER_FIELD_DEFS.map((fieldDefinition) => {
    const teacherFieldConfig = fieldsConfig?.[fieldDefinition.id] || { enabled: true, required: false };
    return {
      ...fieldDefinition,
      enabled: teacherFieldConfig.enabled,
      required: teacherFieldConfig.required,
    };
  });

  const customFieldDefinitions: TeacherFieldDef[] = (customFields || []).map((customField) => ({
    id: customField.id,
    label: customField.label,
    type: customField.type,
    required: customField.required,
    options: customField.options,
    enabled: true,
    isCustom: true,
  }));

  const fieldDefinitions = [...defaultFieldDefinitions, ...customFieldDefinitions];
  const order = fieldOrder || DEFAULT_TEACHERS_SETTINGS.fieldOrder || [];

  const orderIndexByFieldId = Object.fromEntries(order.map((fieldId, index) => [fieldId, index]));
  return fieldDefinitions.sort((leftField, rightField) => {
    const leftOrderIndex = orderIndexByFieldId[leftField.id] ?? 9999;
    const rightOrderIndex = orderIndexByFieldId[rightField.id] ?? 9999;
    return leftOrderIndex - rightOrderIndex;
  });
}

// ─── Contact Preferences ─────────────────────────────────────────────────────

/**
 * Contact module preferences.
 * Stored under the key "contact_preferences".
 */
export interface ContactPreferencesSettings {
  /** Whether contacts with duplicate names/phones are allowed. */
  allowDuplicates: boolean;
  /** Whether a phone number is required when adding a contact. */
  requirePhone: boolean;
  /** Whether the UI offers auto-merge suggestions for likely duplicates. */
  autoMergeSuggestions: boolean;
  /** Pre-populated country for new contacts. */
  defaultCountry: string;
  /** Whether WhatsApp messaging actions are shown in the contacts UI. */
  showWhatsApp: boolean;
  /** Name prefixes to ignore during duplicate detection. */
  namePrefixesToIgnore?: string[];
  /** Fields to display in duplicate detection cards. */
  duplicateDetectionFields?: string[];
}

/** Authoritative default values for ContactPreferencesSettings. */
export const DEFAULT_CONTACT_PREFERENCES_SETTINGS: ContactPreferencesSettings = {
  allowDuplicates: false,
  requirePhone: true,
  autoMergeSuggestions: true,
  defaultCountry: "Pakistan",
  showWhatsApp: true,
  namePrefixesToIgnore: ["syed", "syeda"],
  duplicateDetectionFields: ["name", "phone", "email", "gender", "dob"],
};

// ─── Accounting Settings ─────────────────────────────────────────────────────

export interface AccountingSettings {
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  decimalSeparator: "period" | "comma";
  decimalPlaces: number;
  fyStartMonth: string;
  accountCodeLength: number;
  requireNarration: boolean;
  allowEditPosted: boolean;
  autoPostDrafts: boolean;
  retainedEarningsAccount: string;
  organizationName: string;
  defaultViewLayout?: string;
  fields?: Record<string, any>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
  formTabs?: TabDefinition[];
  enabledTabs?: string[];
  requiredTabs?: string[];
}

export const DEFAULT_ACCOUNTING_SETTINGS: AccountingSettings = {
  currency: "PKR",
  currencySymbol: "₨",
  dateFormat: "DD/MM/YYYY",
  decimalSeparator: "period",
  decimalPlaces: 2,
  fyStartMonth: "July",
  accountCodeLength: 4,
  requireNarration: true,
  allowEditPosted: false,
  autoPostDrafts: false,
  retainedEarningsAccount: "a3100",
  organizationName: "Al-Madrasa Al-Islamiyya",
  defaultViewLayout: "list",
  fields: {
    subtype: { enabled: true, required: false },
    description: { enabled: true, required: false },
  },
  customFields: [],
  fieldOrder: ["subtype", "description"],
};

export const DEFAULT_ACCOUNT_FIELD_DEFS: ModuleFieldDef[] = [
  { id: "code", label: "Account Code", required: true },
  { id: "type", label: "Type", required: true },
  { id: "name", label: "Account Name", required: true },
  { id: "subtype", label: "Sub-type" },
  { id: "description", label: "Description" },
];

// ─── Hasanat Module Settings ──────────────────────────────────────────────────

export interface HasanatSettings {
  pointsPerUnit: number;
  autoApprovePayouts: boolean;
  defaultViewLayout?: string;
  fields?: Record<string, any>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
  formTabs?: TabDefinition[];
  enabledTabs?: string[];
  requiredTabs?: string[];
}

export const DEFAULT_HASANAT_SETTINGS: HasanatSettings = {
  pointsPerUnit: 10,
  autoApprovePayouts: false,
  defaultViewLayout: "list",
  fields: {
    recipientClass: { enabled: true, required: false },
    issuedBy: { enabled: true, required: false },
  },
  customFields: [],
  fieldOrder: ["recipientClass", "issuedBy"],
};

export const DEFAULT_HASANAT_FIELD_DEFS: ModuleFieldDef[] = [
  { id: "denominationId", label: "Denomination", required: true },
  { id: "recipientType", label: "Recipient Type", required: true },
  { id: "recipientName", label: "Recipient", required: true },
  { id: "recipientClass", label: "Class / Department" },
  { id: "quantity", label: "Quantity", required: true },
  { id: "issuedDate", label: "Issued Date", required: true },
  { id: "reason", label: "Reason / Achievement", required: true },
  { id: "issuedBy", label: "Issued By" },
];

// ─── Users Module Settings ───────────────────────────────────────────────────

export interface UsersSettings {
  allowSelfRegistration: boolean;
  requireEmailVerification: boolean;
  defaultViewLayout?: string;
  fields?: Record<string, any>;
  customFields?: ModuleCustomField[];
  fieldOrder?: string[];
  formTabs?: TabDefinition[];
  enabledTabs?: string[];
  requiredTabs?: string[];
  /** Persisted workspace roles (system + custom); falls back to `DEFAULT_WORKSPACE_ROLES`. */
  workspaceRoles?: import("./userTypes.js").WorkspaceRole[];
}

export const DEFAULT_USERS_SETTINGS: UsersSettings = {
  allowSelfRegistration: false,
  requireEmailVerification: true,
  defaultViewLayout: "list",
  fields: {
    role: { enabled: true, required: true },
  },
  customFields: [],
  fieldOrder: ["role"],
};

export const DEFAULT_USERS_FIELD_DEFS: ModuleFieldDef[] = [
  { id: "name", label: "Full Name", required: true },
  { id: "email", label: "Email Address", required: true },
  { id: "role", label: "System Role", required: true },
];

interface StoredGlobalSettings {
  dateFormat: string;
  timezone: string;
  language: AppLanguageCode;
}

/**
 * Retrieves the global settings from localStorage (safe for server rendering).
 */
function getStoredGlobalSettings(): StoredGlobalSettings {
  let dateFormat = "DD/MM/YYYY";
  let timezone = "UTC";
  let language: AppLanguageCode = "en";

  if (typeof window !== "undefined") {
    try {
      let saved: string | null = localStorage.getItem("mms_global_settings");
      if (!saved) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.endsWith(":global_settings")) {
            saved = localStorage.getItem(key);
            break;
          }
        }
      }
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings?.dateFormat) {
          dateFormat = settings.dateFormat;
        }
        if (settings?.timezone) {
          timezone = settings.timezone;
        }
        if (settings?.language) {
          language = normalizeAppLanguage(settings.language);
        }
      }
    } catch {
      // Ignored
    }
  }

  return { dateFormat, timezone, language };
}

/**
 * Formats a Date object or date string according to the active global date format.
 *
 * @param {string | Date | null | undefined} date - The date to format.
 * @param {string | boolean} [dateFormatOrShowMonthName] - Optional explicit format string or showMonthName boolean.
 * @param {boolean} [showMonthName] - Whether to show the short month name instead of numeric.
 * @returns {string} The formatted date string.
 */
export function formatDate(
  date: string | Date | null | undefined,
  dateFormatOrShowMonthName?: string | boolean,
  showMonthName = false
): string {
  if (!date) return "—";
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  if (isNaN(parsedDate.getTime())) return "—";

  const stored = getStoredGlobalSettings();
  let actualDateFormat = stored.dateFormat;
  let actualShowMonthName = showMonthName;
  let timezone = stored.timezone;
  let language = stored.language;

  if (typeof dateFormatOrShowMonthName === "boolean") {
    actualShowMonthName = dateFormatOrShowMonthName;
  } else if (typeof dateFormatOrShowMonthName === "string") {
    actualDateFormat = dateFormatOrShowMonthName;
  }

  const intlLocale = getIntlLocaleForLanguage(language);
  const parts = new Intl.DateTimeFormat(intlLocale, {
    timeZone: timezone,
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(parsedDate);
  const dayNum = Number(parts.find((part) => part.type === "day")?.value ?? parsedDate.getDate());
  const monthNum = Number(parts.find((part) => part.type === "month")?.value ?? parsedDate.getMonth() + 1);
  const yearNum = Number(parts.find((part) => part.type === "year")?.value ?? parsedDate.getFullYear());

  if (actualShowMonthName) {
    const month =
      new Intl.DateTimeFormat(intlLocale, {
        timeZone: timezone,
        month: "short",
      })
        .formatToParts(parsedDate)
        .find((part) => part.type === "month")?.value ?? String(monthNum);
    return formatDatePartsWithMonthName(dayNum, month, monthNum, yearNum, actualDateFormat);
  }

  return formatDateParts(dayNum, monthNum, yearNum, actualDateFormat);
}

/**
 * Formats a Date object or date string with both date and time parts.
 *
 * @param {string | Date | null | undefined} date - The date to format.
 * @param {boolean} [showMonthName=true] - Whether to show short month name.
 * @returns {string} The formatted date and time string.
 */
export function formatDateTime(
  date: string | Date | null | undefined,
  showMonthName = true
): string {
  if (!date) return "—";
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  if (isNaN(parsedDate.getTime())) return "—";

  const datePart = formatDate(date, showMonthName);
  const stored = getStoredGlobalSettings();
  const timezone = stored.timezone;
  const language = stored.language;

  const intlLocale = getIntlLocaleForLanguage(language);
  const timeFormatter = new Intl.DateTimeFormat(intlLocale, {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  });
  
  return `${datePart} ${timeFormatter.format(parsedDate)}`;
}

/**
 * Formats a Date object or date string as a month and year (e.g. "Jan 2026") using active global settings.
 *
 * @param {string | Date | null | undefined} date - The date to format.
 * @param {"numeric" | "2-digit" | "long" | "short" | "narrow"} [monthStyle="short"] - The style of month.
 * @returns {string} The formatted month and year string.
 */
export function formatMonthYear(
  date: string | Date | null | undefined,
  monthStyle: "numeric" | "2-digit" | "long" | "short" | "narrow" = "short"
): string {
  if (!date) return "—";
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  if (isNaN(parsedDate.getTime())) return "—";

  const stored = getStoredGlobalSettings();
  const timezone = stored.timezone;
  const language = stored.language;

  const intlLocale = getIntlLocaleForLanguage(language);
  return new Intl.DateTimeFormat(intlLocale, {
    timeZone: timezone,
    month: monthStyle,
    year: "numeric",
  }).format(parsedDate);
}

/**
 * Formats a Date object or date string as a short month name (e.g. "Jan") using active global settings.
 *
 * @param {string | Date | null | undefined} date - The date to format.
 * @returns {string} The formatted month name.
 */
export function formatMonthName(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  if (isNaN(parsedDate.getTime())) return "—";

  const stored = getStoredGlobalSettings();
  const timezone = stored.timezone;
  const language = stored.language;

  const intlLocale = getIntlLocaleForLanguage(language);
  return new Intl.DateTimeFormat(intlLocale, {
    timeZone: timezone,
    month: "short",
  }).format(parsedDate);
}

/**
 * Formats a Date object or date string as a weekday (e.g. "Monday") using active global settings.
 *
 * @param {string | Date | null | undefined} date - The date to format.
 * @returns {string} The formatted weekday.
 */
export function formatDayName(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  if (isNaN(parsedDate.getTime())) return "—";

  const stored = getStoredGlobalSettings();
  const timezone = stored.timezone;
  const language = stored.language;

  const intlLocale = getIntlLocaleForLanguage(language);
  return new Intl.DateTimeFormat(intlLocale, {
    timeZone: timezone,
    weekday: "long",
  }).format(parsedDate);
}

/**
 * Formats a Date object or date string as a long date format (e.g. "January 2, 2000") using active global settings.
 *
 * @param {string | Date | null | undefined} date - The date to format.
 * @returns {string} The formatted long date.
 */
export function formatLongDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  if (isNaN(parsedDate.getTime())) return "—";

  const stored = getStoredGlobalSettings();
  const timezone = stored.timezone;
  const language = stored.language;

  const intlLocale = getIntlLocaleForLanguage(language);
  return new Intl.DateTimeFormat(intlLocale, {
    timeZone: timezone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

/**
 * Formats a Date object or date string as a Hijri date using active global settings.
 *
 * @param {string | Date | null | undefined} date - The date to format.
 * @returns {string} The formatted Hijri date.
 */
export function formatHijriDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const parsedDate = typeof date === "string" ? new Date(date) : date;
  if (isNaN(parsedDate.getTime())) return "";

  const stored = getStoredGlobalSettings();
  const timezone = stored.timezone;
  const language = stored.language;

  const intlLocale = getIntlLocaleForLanguage(language);
  try {
    return new Intl.DateTimeFormat(intlLocale + "-u-ca-islamic", {
      timeZone: timezone,
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(parsedDate);
  } catch {
    return "";
  }
}

/**
 * Preferred client-side encode formats, best-first.
 * AVIF gives the smallest files; WebP is the broad-support fallback.
 */
export const IMAGE_ENCODE_FORMATS = ["image/avif", "image/webp"] as const;

const IMAGE_EXT_BY_TYPE: Record<string, string> = {
  "image/avif": ".avif",
  "image/webp": ".webp"
};

/** Max raw picker file size before client-side AVIF encode (bytes). */
export const IMAGE_UPLOAD_MAX_INPUT_BYTES = 2 * 1024 * 1024;

/** Resize/encode presets — AVIF first, WebP fallback; used by every image uploader. */
export const IMAGE_UPLOAD_PRESETS = {
  avatar: { maxWidth: 300, maxHeight: 300, quality: 0.78, formats: IMAGE_ENCODE_FORMATS },
  logo: { maxWidth: 200, maxHeight: 200, quality: 0.82, formats: IMAGE_ENCODE_FORMATS },
  favicon: { maxWidth: 64, maxHeight: 64, quality: 0.82, formats: IMAGE_ENCODE_FORMATS },
  general: { maxWidth: 800, maxHeight: 800, quality: 0.82, formats: IMAGE_ENCODE_FORMATS },
} as const;

export type ImageUploadPurpose = keyof typeof IMAGE_UPLOAD_PRESETS;

export function imageExtensionForMime(mimeType: string): string {
  return IMAGE_EXT_BY_TYPE[mimeType] ?? ".webp";
}

function canvasToBlobAsync(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

/**
 * Encodes a canvas to the best-available modern format (AVIF → WebP), returning
 * the encoded blob and its actual MIME type. Browsers that cannot encode a format
 * silently return a different type, so we verify `blob.type` before accepting it.
 *
 * @param canvas - Source canvas.
 * @param quality - Encode quality 0–1.
 * @returns The encoded blob + type, or `null` if encoding failed entirely.
 */
export async function canvasToOptimizedBlob(
  canvas: HTMLCanvasElement,
  quality = 0.82,
  formats: readonly string[] = IMAGE_ENCODE_FORMATS
): Promise<{ blob: Blob; type: string } | null> {
  for (const type of formats) {
    const blob = await canvasToBlobAsync(canvas, type, quality);
    if (blob && blob.type === type) return { blob, type };
  }
  const fallback = await canvasToBlobAsync(canvas, "image/webp", quality);
  if (fallback) return { blob: fallback, type: fallback.type || "image/webp" };
  return null;
}

/**
 * Encodes a canvas to an optimized data URL (AVIF → WebP). When a format is not
 * supported the browser returns a PNG data URL, which we detect via the prefix
 * and skip in favour of the next candidate.
 *
 * @param canvas - Source canvas.
 * @param quality - Encode quality 0–1.
 * @returns A data URL string in the best available format.
 */
export function canvasToOptimizedDataUrl(canvas: HTMLCanvasElement, quality = 0.82): string {
  for (const type of IMAGE_ENCODE_FORMATS) {
    const url = canvas.toDataURL(type, quality);
    if (url.startsWith(`data:${type}`)) return url;
  }
  return canvas.toDataURL("image/webp", quality);
}

/**
 * Resizes and compresses an image file on the client-side to a modern format,
 * preferring AVIF and falling back to WebP (then the original file) when a
 * format is unsupported or conversion fails.
 *
 * This is the single global entry point for image uploads — every uploader must
 * route files through it so all stored images are optimized client-side.
 *
 * @param file - The input image file.
 * @param options - Configuration for resizing/quality.
 * @returns A promise resolving to the optimized File (or original if failed).
 */
export function optimizeImage(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    formats?: readonly string[];
  } = {}
): Promise<File> {
  const { maxWidth = 800, maxHeight = 800, quality = 0.82, formats = IMAGE_ENCODE_FORMATS } = options;

  if (typeof window === "undefined" || typeof FileReader === "undefined" || !file.type.startsWith("image/")) {
    return Promise.resolve(file);
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = async () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const canvasContext = canvas.getContext("2d");
        if (!canvasContext) {
          resolve(file);
          return;
        }

        canvasContext.drawImage(img, 0, 0, width, height);

        const encoded = await canvasToOptimizedBlob(canvas, quality, formats);
        if (!encoded) {
          resolve(file);
          return;
        }

        const ext = IMAGE_EXT_BY_TYPE[encoded.type] || ".webp";
        const optimizedFile = new File([encoded.blob], file.name.replace(/\.[^/.]+$/, "") + ext, {
          type: encoded.type,
          lastModified: Date.now()
        });
        resolve(optimizedFile);
      };
      img.onerror = () => resolve(file);
      img.src = loadEvent.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

/**
 * Encodes a user-selected image to AVIF (then WebP) using the purpose preset.
 * Call before uploading to the MMS image API.
 */
export function prepareImageForUpload(
  file: File,
  purpose: ImageUploadPurpose = "general"
): Promise<File> {
  return optimizeImage(file, IMAGE_UPLOAD_PRESETS[purpose]);
}

// ─── Fields Setup & Tabbed Fields Utilities ───────────────────────────────────

export function mergeTabbedFields(
  defaults: Record<string, any>,
  input?: Record<string, any>
): Record<string, any> {
  if (!input) return defaults;
  const merged = { ...defaults };
  for (const [tab, fields] of Object.entries(input)) {
    if (Array.isArray(fields)) {
      merged[tab] = fields;
    } else if (fields && typeof fields === "object") {
      merged[tab] = {
        ...(merged[tab] || {}),
        ...fields,
      };
    }
  }
  return merged;
}

export function getFlatFieldsConfig(
  fields?: Record<string, any>
): Record<string, { enabled: boolean; required: boolean }> {
  const result: Record<string, { enabled: boolean; required: boolean }> = {};
  if (!fields) return result;
  for (const [tab, list] of Object.entries(fields)) {
    if (Array.isArray(list)) {
      for (const f of list) {
        if (f && typeof f === "object" && f.key) {
          result[f.key] = {
            enabled: f.enabled !== false,
            required: !!f.required,
          };
        }
      }
    } else if (list && typeof list === "object") {
      for (const [key, moduleFieldConfig] of Object.entries(list)) {
        if (moduleFieldConfig && typeof moduleFieldConfig === "object") {
          result[key] = {
            enabled: (moduleFieldConfig as any).enabled !== false,
            required: !!(moduleFieldConfig as any).required,
          };
        }
      }
    }
  }
  return result;
}

// ─── Default Students Field Setup Constants ───────────────────────────────────

export const DEFAULT_STUDENT_ENABLED_TABS = ["guardian", "academic"];
export const DEFAULT_STUDENT_REQUIRED_TABS: string[] = [];

export const STUDENT_TAB_REGISTRY: TabDefinition[] = [
  { key: "basic", label: "Identity", enabled: true, order: 0, isSystem: true },
  { key: "guardian", label: "Guardian Connections", enabled: true, order: 1, isSystem: true },
  { key: "academic", label: "Enrollment Info", enabled: true, order: 2, isSystem: true },
];

export const INITIAL_STUDENT_FIELD_SEED: Record<string, FieldDefinition[]> = {
  basic: [
    { key: "gender", label: "Gender", type: "select", options: ["Male", "Female"], enabled: true, order: 0, required: true, description: "Must be defined (not empty) on the linked contact profile." },
    { key: "dob", label: "Date of Birth", type: "date", enabled: true, order: 1, required: true, description: "Must be provided (not empty) on the linked contact profile." },
  ],
  guardian: [
    { key: "fatherLink", label: "Father", type: "text", enabled: true, order: 0, required: false, description: "Dropdown linking a Male contact from the database." },
    { key: "motherLink", label: "Mother", type: "text", enabled: true, order: 1, required: false, description: "Dropdown linking a Female contact from the database." },
    { key: "guardianLink", label: "Guardian", type: "text", enabled: true, order: 2, required: false, description: "Dropdown linking any contact from the database (no gender filter)." },
  ],
  academic: [
    { key: "registeredDate", label: "Registration Date", type: "date", enabled: true, order: 0, required: true, description: "Date/Time field indicating when the student profile was registered." },
  ]
};

export const DEFAULT_STUDENT_COLUMN_REGISTRY: ColumnRegistryEntry[] = [
  { key: "name", label: "Name", enabled: true, order: 0, sortable: true, width: 0, fixed: true },
  { key: "grNumber", label: "GR Number", enabled: true, order: 1, sortable: true, width: 120 },
  { key: "gender", label: "Gender", enabled: true, order: 2, sortable: true, width: 100 },
  { key: "status", label: "Status", enabled: true, order: 3, sortable: true, width: 100 },
  { key: "fatherName", label: "Father Name", enabled: true, order: 4, sortable: true, width: 150 },
  { key: "registeredDate", label: "Registered Date", enabled: true, order: 5, sortable: true, width: 130 },
];

// ─── Default Question Bank Field Setup Constants ───────────────────────────────

export const QUESTION_BANK_TAB_REGISTRY: TabDefinition[] = [
  { key: "basic", label: "Basic Setup", enabled: true, order: 0, isSystem: true },
  { key: "options", label: "Options & Metadata", enabled: true, order: 1, isSystem: true },
];

export const INITIAL_QUESTION_BANK_FIELD_SEED: Record<string, FieldDefinition[]> = {
  basic: [
    { key: "text", label: "Question Text", type: "textarea", enabled: true, order: 0, required: true },
    { key: "categoryId", label: "Category", type: "select", enabled: true, order: 1, required: true },
    { key: "questionLanguage", label: "Language", type: "select", options: ["en", "ur", "ar", "fa"], enabled: true, order: 2, required: true },
  ],
  options: [
    { key: "type", label: "Question Type", type: "select", options: ["mcq", "true_false", "short", "fill_blank", "matching", "numeric", "ordering"], enabled: true, order: 0, required: true },
    { key: "difficulty", label: "Difficulty", type: "select", options: ["easy", "medium", "hard"], enabled: true, order: 1, required: true },
  ]
};

// ─── Default Sessions Field Setup Constants ────────────────────────────────────

export const SESSIONS_TAB_REGISTRY: TabDefinition[] = [
  { key: "basic", label: "Basic Info", enabled: true, order: 0, isSystem: true },
  { key: "financial", label: "Financial Setup", enabled: true, order: 1, isSystem: true },
];

export const INITIAL_SESSIONS_FIELD_SEED: Record<string, FieldDefinition[]> = {
  basic: [
    { key: "name", label: "Session Name", type: "text", enabled: true, order: 0, required: true },
    { key: "type", label: "Session Type", type: "select", options: ["annual", "semester", "trimester", "quarterly"], enabled: true, order: 1, required: true },
    { key: "status", label: "Status", type: "select", options: ["draft", "active", "completed", "archived"], enabled: true, order: 2, required: true },
    { key: "startDate", label: "Start Date", type: "date", enabled: true, order: 3, required: true },
    { key: "endDate", label: "End Date", type: "date", enabled: true, order: 4, required: true },
    { key: "description", label: "Description", type: "textarea", enabled: true, order: 5, required: false },
  ],
  financial: [
    { key: "baseFee", label: "Base Fee", type: "number", enabled: true, order: 0, required: true },
    { key: "currency", label: "Currency", type: "select", options: ["PKR", "USD", "GBP", "CAD", "SAR", "AED"], enabled: true, order: 1, required: true },
  ]
};

// ─── Default Teachers Field Setup Constants ────────────────────────────────────

export const TEACHERS_TAB_REGISTRY: TabDefinition[] = [
  { key: "basic", label: "Profile", enabled: true, order: 0, isSystem: true },
  { key: "employment", label: "Employment Details", enabled: true, order: 1, isSystem: true },
];

export const INITIAL_TEACHERS_FIELD_SEED: Record<string, FieldDefinition[]> = {
  basic: [
    { key: "specialization", label: "Specialization", type: "select", options: ["General", "Hifz", "Tajweed", "Arabic", "Islamic Studies", "Hadith", "Fiqh"], enabled: true, order: 0, required: true },
    { key: "qualification", label: "Qualification", type: "text", enabled: true, order: 1, required: false },
  ],
  employment: [
    { key: "joinDate", label: "Joining Date", type: "date", enabled: true, order: 0, required: true },
  ]
};

// ─── Default Users Field Setup Constants ───────────────────────────────────────

export const USERS_TAB_REGISTRY: TabDefinition[] = [
  { key: "basic", label: "Account Info", enabled: true, order: 0, isSystem: true },
  { key: "security", label: "Security & Roles", enabled: true, order: 1, isSystem: true },
];

export const INITIAL_USERS_FIELD_SEED: Record<string, FieldDefinition[]> = {
  basic: [
    { key: "name", label: "Full Name", type: "text", enabled: true, order: 0, required: true },
    { key: "email", label: "Email Address", type: "email", enabled: true, order: 1, required: true },
  ],
  security: [
    { key: "roles", label: "System Roles", type: "multiselect", options: ["admin", "teacher", "student", "guardian", "accountant"], enabled: true, order: 0, required: true },
  ]
};

// ─── Default Enrollments Field Setup Constants ─────────────────────────────────

export const ENROLLMENTS_TAB_REGISTRY: TabDefinition[] = [
  { key: "basic", label: "Basic Setup", enabled: true, order: 0, isSystem: true },
];

export const INITIAL_ENROLLMENTS_FIELD_SEED: Record<string, FieldDefinition[]> = {
  basic: [
    { key: "studentId", label: "Select Student", type: "text", enabled: true, order: 0, required: true },
    { key: "sessionId", label: "Select Session", type: "text", enabled: true, order: 1, required: true },
    { key: "classId", label: "Assign Class", type: "text", enabled: true, order: 2, required: true },
    { key: "notes", label: "Notes", type: "textarea", enabled: true, order: 3, required: false },
  ]
};

// ─── Default Examinations Field Setup Constants ────────────────────────────────

export const EXAMINATIONS_TAB_REGISTRY: TabDefinition[] = [
  { key: "basic", label: "Basic Info", enabled: true, order: 0, isSystem: true },
];

export const INITIAL_EXAMINATIONS_FIELD_SEED: Record<string, FieldDefinition[]> = {
  basic: [
    { key: "name", label: "Exam Name", type: "text", enabled: true, order: 0, required: true },
    { key: "subject", label: "Subject", type: "text", enabled: true, order: 1, required: false },
    { key: "status", label: "Status", type: "select", options: ["draft", "scheduled", "completed"], enabled: true, order: 2, required: false },
    { key: "totalMarks", label: "Total Marks", type: "number", enabled: true, order: 3, required: false },
    { key: "passingMarks", label: "Passing Marks", type: "number", enabled: true, order: 4, required: false },
    { key: "duration", label: "Duration (min)", type: "number", enabled: true, order: 5, required: false },
    { key: "date", label: "Exam Date", type: "date", enabled: true, order: 6, required: true },
    { key: "classIds", label: "Assign to Classes", type: "multiselect", enabled: true, order: 7, required: true },
    { key: "description", label: "Description", type: "textarea", enabled: true, order: 8, required: false },
  ]
};

// ─── Default Finance Field Setup Constants ─────────────────────────────────────

export const FINANCE_TAB_REGISTRY: TabDefinition[] = [
  { key: "basic", label: "Basic Info", enabled: true, order: 0, isSystem: true },
];

export const INITIAL_FINANCE_FIELD_SEED: Record<string, FieldDefinition[]> = {
  basic: [
    { key: "studentId", label: "Student ID", type: "text", enabled: true, order: 0, required: true },
    { key: "amount", label: "Amount", type: "number", enabled: true, order: 1, required: true },
    { key: "dueDate", label: "Due Date", type: "date", enabled: true, order: 2, required: true },
    { key: "status", label: "Status", type: "select", options: ["unpaid", "paid", "partially_paid", "cancelled"], enabled: true, order: 3, required: true },
  ]
};

// ─── Default Hasanat Field Setup Constants ─────────────────────────────────────

export const HASANAT_TAB_REGISTRY: TabDefinition[] = [
  { key: "basic", label: "Basic Info", enabled: true, order: 0, isSystem: true },
];

export const INITIAL_HASANAT_FIELD_SEED: Record<string, FieldDefinition[]> = {
  basic: [
    { key: "denominationId", label: "Denomination", type: "text", enabled: true, order: 0, required: true },
    { key: "recipientType", label: "Recipient Type", type: "select", options: ["student", "teacher"], enabled: true, order: 1, required: true },
    { key: "recipientName", label: "Recipient Name", type: "text", enabled: true, order: 2, required: true },
    { key: "recipientClass", label: "Class / Department", type: "text", enabled: true, order: 3, required: false },
    { key: "quantity", label: "Quantity", type: "number", enabled: true, order: 4, required: true },
    { key: "issuedDate", label: "Issued Date", type: "date", enabled: true, order: 5, required: true },
    { key: "reason", label: "Reason / Achievement", type: "textarea", enabled: true, order: 6, required: true },
    { key: "issuedBy", label: "Issued By", type: "text", enabled: true, order: 7, required: false },
  ]
};

// ─── Default Accounting Field Setup Constants ──────────────────────────────────

export const ACCOUNTING_TAB_REGISTRY: TabDefinition[] = [
  { key: "basic", label: "Basic Setup", enabled: true, order: 0, isSystem: true },
];

export const INITIAL_ACCOUNTING_FIELD_SEED: Record<string, FieldDefinition[]> = {
  basic: [
    { key: "code", label: "Account Code", type: "text", enabled: true, order: 0, required: true },
    { key: "type", label: "Type", type: "select", options: ["asset", "liability", "equity", "revenue", "expense"], enabled: true, order: 1, required: true },
    { key: "name", label: "Account Name", type: "text", enabled: true, order: 2, required: true },
    { key: "subtype", label: "Sub-type", type: "text", enabled: true, order: 3, required: false },
    { key: "description", label: "Description", type: "textarea", enabled: true, order: 4, required: false },
  ]
};

// ─── Default Attendance Field Setup Constants ──────────────────────────────────

export const ATTENDANCE_TAB_REGISTRY: TabDefinition[] = [
  { key: "basic", label: "Basic Setup", enabled: true, order: 0, isSystem: true },
];

export const INITIAL_ATTENDANCE_FIELD_SEED: Record<string, FieldDefinition[]> = {
  basic: [
    { key: "status", label: "Attendance Status", type: "select", options: ["present", "absent", "late", "excused"], enabled: true, order: 0, required: true },
    { key: "timeIn", label: "Time In", type: "text", enabled: true, order: 1, required: false },
    { key: "timeOut", label: "Time Out", type: "text", enabled: true, order: 2, required: false },
    { key: "notes", label: "Notes / Comments", type: "textarea", enabled: true, order: 3, required: false },
  ]
};
