import type { TabDefinition } from "./contactTypes.js";
import type { ModuleCustomField, ModuleFieldDef } from "./moduleFieldSchema.js";

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
  fields?: Record<string, unknown>;
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
