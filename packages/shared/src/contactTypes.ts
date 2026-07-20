import { DEFAULT_MODULE_TIER_TAB_LABELS } from './moduleTierTabs.js';

export type WhatsAppStatus = 'PENDING' | 'REGISTERED' | 'NOT_REGISTERED' | 'FAILED';

export interface WhatsAppPreferences {
  autoCheckEnabled: boolean;
  excludedCountryCodes: string[];
  verificationTrigger: 'IMMEDIATE_ON_SAVE' | 'BATCH_NIGHTLY' | 'MANUAL_ONLY';
  uiIndicatorStyle: {
    icon?: string;
    color?: string;
    label?: string;
  };
}

export interface WhatsAppVerificationResult {
  status: WhatsAppStatus;
  checkedAt: string;
  error?: string;
}

export interface WhatsAppProvider {
  verifyPhoneNumber(phoneNumber: string): Promise<WhatsAppVerificationResult>;
}

export type RelationshipType = 
  | 'father'
  | 'mother'
  | 'guardian'
  | 'child'
  | 'spouse'
  | 'sibling'
  | 'colleague'
  | 'other';

export interface PhoneNumber {
  label: string;
  number: string;
  countryCode?: string;
  isPrimary?: boolean;
  whatsappStatus?: 'REGISTERED' | 'NOT_REGISTERED' | 'UNCHECKED' | 'FAILED';
}

export interface EmailAddress {
  label: string;
  address: string;
  isPrimary?: boolean;
  isVerified?: boolean;
}

export interface Address {
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
  label?: string;
  isPrimary?: boolean;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface EmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
  contactId?: string | number;
  inferred?: boolean;
  inferredFromContactId?: string;
  inferenceDepth?: number;
}

export interface ContactRelationship {
  contactId: string | number;
  relationship?: RelationshipType | string;
  notes?: string;
}

export interface ContactActivity {
  id: string;
  type: "note" | "stage_change" | "whatsapp" | "email" | "system" | "task" | "call";
  content: string;
  date: string;
  by?: string;
  metadata?: Record<string, unknown>;
}

export interface ContactAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  date: string;
}

export interface Contact {
  id: string | number;
  name: string;
  firstName: string;
  lastName?: string;
  gender?: string;
  dob?: string;
  cnic?: string;
  isSyed?: boolean;
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: string;
  deletedBy?: string;
  deletionReason?: string;

  // Communication & Preference Extensions
  preferredLanguage?: 'en' | 'ur' | 'ar' | 'fa';
  preferredContactMethod?: 'whatsapp' | 'sms' | 'email' | 'phone_call';
  doNotContact?: boolean;

  phones?: PhoneNumber[];
  emails?: EmailAddress[];
  addresses?: Address[];
  socials?: SocialLink[];
  emergencyContacts?: EmergencyContact[];
  relationships?: ContactRelationship[];
  activities?: ContactActivity[];
  attachments?: ContactAttachment[];
  aiSummary?: string;
  [key: string]: unknown;
}

export interface FieldDefinition {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "datetime" | "select" | "multiselect" | "single_select" | "multi_select" | "tags" | "boolean" | "url" | "email" | "file" | "location" | "ai_summary" | "currency";
  enabled: boolean;
  order: number;
  options?: string[];
  permissions?: string[];
  defaultValue?: unknown;
  required?: boolean;
  unique?: boolean;
  placeholder?: string;
  description?: string;
  group?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  mask?: string;
  precision?: number;
}

export interface FieldGroup {
  id: string;
  label: string;
  description: string;
}

export interface TabDefinition {
  key: string;
  label: string;
  icon?: string;
  enabled: boolean;
  order: number;
  permissions?: string[];
  description?: string;
  color?: string;
  isSystem?: boolean;
}


export interface ColumnRegistryEntry {
  key: string;
  label: string;
  enabled: boolean;
  order: number;
  sortable?: boolean;
  width?: number;        // px, 0 = auto
  sortField?: string;    // field key to sort by
  fixed?: boolean;
}

export interface FieldConfig {
  version: number;
  enabledTabs: string[];
  requiredTabs: string[];
  fields: Record<string, FieldDefinition[]>;
  pageTabs?: TabDefinition[];
  formTabs?: TabDefinition[];
  detailTabs?: TabDefinition[];
  settingsSubTabs?: TabDefinition[];
  defaultRating?: number;
  columnRegistry?: ColumnRegistryEntry[];
}

export interface ContactPreferences {
  defaultCountry: string;
  defaultProvince: string;
  defaultCity: string;
  defaultViewLayout?: string;
  namePrefixesToIgnore?: string[];
  duplicateDetectionFields?: string[];
  duplicateDetectionThresholdHigh?: number;
  duplicateDetectionThresholdMedium?: number;
  duplicateDetectionColorHigh?: string;
  duplicateDetectionColorMedium?: string;
  duplicateDetectionColorLow?: string;
  duplicateDetectionScorePhoneEmail?: number;
  duplicateDetectionScoreNamePhone?: number;
  duplicateDetectionScoreNameEmail?: number;
  duplicateDetectionScorePhone?: number;
  duplicateDetectionScoreEmail?: number;
  duplicateDetectionScoreName?: number;
  duplicateDetectionScoreDefault?: number;
  duplicateDetectionColorWarning?: string;
  duplicateDetectionColorWarningText?: string;
  duplicateDetectionColorSuccess?: string;
  duplicateDetectionColorSuccessText?: string;
  duplicateDetectionColorHighlight?: string;
  showDetailedSolarAge?: boolean;
  showLunarDob?: boolean;
  showDetailedLunarAge?: boolean;
}

export interface WhatsAppTemplate {
  id: string;
  label: string;
  body: string;
}


export const CONFIG_VERSION = 2;


export const DEFAULT_ENABLED_TABS = ["phones", "emails", "addresses", "socials", "emergency"];
export const DEFAULT_REQUIRED_TABS: string[] = [];

export const GENDERS = ["male", "female"];

export const COLOR_PALETTES = {
  blue: { bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-900/50" },
  emerald: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-900/50" },
  violet: { bg: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/50", text: "text-violet-700 dark:text-violet-400", border: "border-violet-200 dark:border-violet-900/50" },
  amber: { bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-900/50" },
  rose: { bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-900/50" },
  red: { bg: "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50", text: "text-red-600 dark:text-red-400", border: "border-red-100 dark:border-red-900/50" },
  indigo: { bg: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50", text: "text-indigo-700 dark:text-indigo-400", border: "border-indigo-200 dark:border-indigo-900/50" },
  cyan: { bg: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-900/50", text: "text-cyan-700 dark:text-cyan-400", border: "border-cyan-200 dark:border-cyan-900/50" },
  slate: { bg: "bg-muted text-muted-foreground border-border", text: "text-muted-foreground", border: "border-border" },
  /** Semantic aliases — prefer these for status / alert chips (theme-aware). */
  success: { bg: "bg-success/10 text-success border-success/20 dark:bg-success/15 dark:border-success/25", text: "text-success", border: "border-success/20 dark:border-success/25" },
  info: { bg: "bg-info/10 text-info border-info/20 dark:bg-info/15 dark:border-info/25", text: "text-info", border: "border-info/20 dark:border-info/25" },
  warning: { bg: "bg-warning/10 text-warning border-warning/20 dark:bg-warning/15 dark:border-warning/25", text: "text-warning", border: "border-warning/20 dark:border-warning/25" },
  destructive: { bg: "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/15 dark:border-destructive/25", text: "text-destructive", border: "border-destructive/20 dark:border-destructive/25" },
};



export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  { id: "fee", label: "Fee Reminder", body: "Assalamu Alaikum! This is a friendly reminder that your fee payment for this month is due. Please contact us at your earliest convenience. JazakAllah Khair." },
  { id: "event", label: "Event Invitation", body: "Assalamu Alaikum! You are cordially invited to our upcoming event at the madrasa. Please confirm your attendance. JazakAllah Khair." },
  { id: "absence", label: "Absence Notice", body: "Assalamu Alaikum! We noticed your child was absent today. Please inform us if there is an issue. JazakAllah Khair." },
  { id: "custom", label: "Custom Message", body: "" },
];

export const SOCIAL_PLATFORMS = [
  "Facebook", "Twitter / X", "Instagram", "LinkedIn", "TikTok", "YouTube",
  "WhatsApp", "Telegram", "Snapchat",
];

export const COUNTRY_CODES = [
  { country: "Pakistan",              code: "+92"  },
  { country: "United States",         code: "+1"   },
  { country: "United Kingdom",        code: "+44"  },
  { country: "Canada",                code: "+1"   },
  { country: "Australia",             code: "+61"  },
  { country: "India",                 code: "+91"  },
  { country: "Bangladesh",            code: "+880" },
  { country: "Egypt",                 code: "+20"  },
  { country: "Nigeria",               code: "+234" },
  { country: "Ghana",                 code: "+233" },
  { country: "Saudi Arabia",          code: "+966" },
  { country: "United Arab Emirates",  code: "+971" },
  { country: "Qatar",                 code: "+974" },
  { country: "Kuwait",                code: "+965" },
  { country: "Bahrain",               code: "+973" },
  { country: "Oman",                  code: "+968" },
  { country: "Malaysia",              code: "+60"  },
  { country: "Singapore",             code: "+65"  },
  { country: "Thailand",              code: "+66"  },
  { country: "Indonesia",             code: "+62"  },
];

export const RELATIONSHIPS = [
  "Father", "Mother", "Parent", "Son", "Daughter", "Child", "Brother", "Sister", "Sibling",
  "Grandfather", "Grandmother", "Grandparent", "Grandson", "Granddaughter", "Grandchild",
  "Uncle", "Aunt", "Aunt/Uncle", "Nephew", "Niece", "Niece/Nephew", "Cousin",
  "Father-In-Law", "Mother-In-Law", "Parent-In-Law", "Son-In-Law", "Daughter-In-Law", "Child-In-Law",
  "Brother-In-Law", "Sister-In-Law", "Sibling-In-Law",
  "Guardian", "Dependent", "Spouse", "Other",
];

export const TAB_REGISTRY: TabDefinition[] = [
  { key: "basic",     label: "Identity",          description: "Core identity fields + custom fields", enabled: true, order: 0, isSystem: true },
  { key: "phones",    label: "Phone Numbers",     description: "Phone numbers tab", enabled: true, order: 1, isSystem: true },
  { key: "emails",    label: "Email Addresses",   description: "Email addresses tab", enabled: true, order: 2, isSystem: true },
  { key: "addresses", label: "Addresses",         description: "Manage address records", enabled: true, order: 3, isSystem: true },
  { key: "socials",   label: "Social Links",      description: "Social media profiles tab", enabled: true, order: 4, isSystem: true },
  { key: "emergency", label: "Emergency Contacts", description: "Emergency contact links tab", enabled: true, order: 5, isSystem: true },
];

// ── Default seed constants ────────────────────────────────────────────────────
// Single source of truth for all default field, tab, and column definitions.
// Consumed by contactFieldsStore (frontend) and any future DB seed.
// Hardcoding these values anywhere else is banned per mms-fields.md.

export const INITIAL_FIELD_SEED: Record<string, FieldDefinition[]> = {
  basic: [
    { key: "avatar",         label: "Profile Photo",          type: "file",    description: "Avatar upload & display. Personalizes contacts & aids quick visual identification.", defaultValue: null, permissions: [], enabled: true, order: 0, required: false },
    { key: "isSyed",         label: "Is Syed",                type: "boolean", description: "Syed (Hashemite) lineage indicator. Cultural/genealogical indicator.", defaultValue: false, permissions: [], enabled: true, order: 1, required: false },
    { key: "firstName",      label: "First Name",             type: "text",    description: "First name input — required for all contacts.", defaultValue: "", permissions: [], enabled: true, order: 2, required: true },
    { key: "lastName",       label: "Last Name",              type: "text",    description: "Last name input. Combined with first name for full identification.", defaultValue: "", permissions: [], enabled: true, order: 3, required: false },
    { key: "gender",         label: "Gender (Male / Female)", type: "select",  description: "Gender selector. Enables personalization & inclusive communication.", options: ["male", "female"], defaultValue: "", permissions: [], enabled: true, order: 4, required: false },
    { key: "dob",            label: "Date of Birth",          type: "date",    description: "Date of birth for age tracking & milestone events.", defaultValue: "", permissions: [], enabled: true, order: 5, required: false },
  ],
  phones: [
    { key: "label",    label: "Phone Type / Label",               type: "select", description: "Select type of phone number (e.g. Mobile, Home, Work).", options: ["Mobile", "Home", "Work", "Other"], defaultValue: "Mobile", permissions: [], enabled: true, order: 0, required: false },
    { key: "number",   label: "Phone Number",                     type: "text",   description: "Phone number input. Primary channel for direct communication.", defaultValue: "", permissions: [], enabled: true, order: 1, required: true },
  ],
  emails: [
    { key: "label",   label: "Email Type / Label", type: "select", description: "Select type of email address (e.g. Personal, Work, School).", options: ["Personal", "Work", "Other"], defaultValue: "Personal", permissions: [], enabled: true, order: 0, required: false },
    { key: "address", label: "Email Address",      type: "email",  description: "Email input field (unique per contact). Essential for formal communication & bulk outreach.", defaultValue: "", permissions: [], enabled: true, order: 1, required: false, unique: true },
  ],
  addresses: [
    { key: "label",   label: "Address Type / Label", type: "select", description: "Select type of address (e.g. Home, Work, Billing).", options: ["Home", "Work", "Other"], defaultValue: "Home", permissions: [], enabled: true, order: 0, required: false },
    { key: "line1",   label: "Street Address",       type: "text",   description: "Street/building address.", defaultValue: "", permissions: [], enabled: true, order: 1, required: false },
    { key: "city",    label: "City",                 type: "text",   description: "City of residence.",       defaultValue: "", permissions: [], enabled: true, order: 2, required: false },
    { key: "state",   label: "State / Province",     type: "text",   description: "State or province.",       defaultValue: "", permissions: [], enabled: true, order: 3, required: false },
    { key: "country", label: "Country",              type: "text",   description: "Country of residence.",    defaultValue: "", permissions: [], enabled: true, order: 4, required: false },
  ],
  socials: [
    { key: "platform", label: "Platform Selection",  type: "select", description: "Platform selection (Facebook, X, etc.)", options: ["Facebook", "Twitter / X", "Instagram", "LinkedIn", "TikTok", "YouTube", "WhatsApp", "Telegram", "Snapchat"], defaultValue: "Facebook", permissions: [], enabled: true, order: 0, required: false },
    { key: "url",      label: "Social URL / Handle", type: "url",    description: "URL or handle input. Enables social media engagement & verification.", defaultValue: "", permissions: [], enabled: true, order: 1, required: false },
  ],
  emergency: [
    { key: "contactId",    label: "Contact",      type: "text",   description: "Contact picker — links existing contacts as emergency contacts.", defaultValue: "", permissions: [], enabled: true, order: 0, required: true },
    { key: "relationship", label: "Relationship", type: "select", description: "Relationship with the emergency contact (e.g. Father, Mother, Spouse).", options: RELATIONSHIPS, defaultValue: "", permissions: [], enabled: true, order: 1, required: false },
  ],
};

/**
 * Field keys retired from the contact **form** registry. They may still exist on
 * stored `Contact` records and other surfaces (Kanban, table column, detail
 * drawer read them directly), but must never be re-rendered as form inputs.
 * `sanitizeConfig` strips these from any persisted field config.
 */
export const REMOVED_FORM_FIELD_KEYS: readonly string[] = [
  "countryCode",
  "lifecycleStage",
  "rating",
  "notes",
  "occupation",
  "communicationPreference",
  "phone",
  "email"
];

export const DEFAULT_PAGE_TABS: TabDefinition[] = [
  { key: "work",    label: DEFAULT_MODULE_TIER_TAB_LABELS.work,    enabled: true, order: 0, isSystem: true },
  { key: "reports", label: DEFAULT_MODULE_TIER_TAB_LABELS.reports, enabled: true, order: 1, isSystem: true },
  { key: "setup",   label: DEFAULT_MODULE_TIER_TAB_LABELS.setup,   enabled: true, order: 2, isSystem: true },
];

export const DEFAULT_FORM_TABS: TabDefinition[] = [
  { key: "basic",     label: "Identity",   enabled: true, order: 0, isSystem: true },
  { key: "phones",    label: "Phones",     enabled: true, order: 1, isSystem: true },
  { key: "emails",    label: "Emails",     enabled: true, order: 2, isSystem: true },
  { key: "addresses", label: "Addresses",  enabled: true, order: 3, isSystem: true },
  { key: "socials",   label: "Socials",    enabled: true, order: 4, isSystem: true },
  { key: "emergency", label: "Emergency",  enabled: true, order: 5, isSystem: true },
];

export const DEFAULT_DETAIL_TABS: TabDefinition[] = [
  { key: "overview",  label: "Overview",  enabled: true, order: 0, isSystem: true },
  { key: "timeline",  label: "Timeline",  enabled: true, order: 1, isSystem: true },
  { key: "network",   label: "Network",   enabled: true, order: 2, isSystem: true },
  { key: "files",     label: "Files",     enabled: true, order: 3, isSystem: true },
];

export const DEFAULT_SETTINGS_SUB_TABS: TabDefinition[] = [
  { key: "fields",      label: "Fields",             enabled: true, order: 0, isSystem: true },
  { key: "preferences", label: "Preferences",        enabled: true, order: 1, isSystem: true },
  { key: "sync",        label: "Sync (Google / Apple)", enabled: true, order: 2, isSystem: true },
];

export const DEFAULT_COLUMN_REGISTRY: ColumnRegistryEntry[] = [
  { key: "name",           label: "Name",           enabled: true,  order: 0, sortable: true,  width: 0,   fixed: true },
  { key: "gender",         label: "Gender",         enabled: true,  order: 1, sortable: true,  width: 100 },
  { key: "phone",          label: "Phone",          enabled: true,  order: 2, sortable: false, width: 140 },
  { key: "whatsapp",       label: "WhatsApp",       enabled: true,  order: 3, sortable: false, width: 90  },
  { key: "email",          label: "Email",          enabled: false, order: 4, sortable: false, width: 180 },
  { key: "city",           label: "City",           enabled: false, order: 5, sortable: true,  width: 110 },
  { key: "dob",            label: "Date of Birth",  enabled: false, order: 6, sortable: true,  width: 130 },
];

export interface Message {
  id: string;
  userId: string;
  contactId: string | number;
  channel: 'sms' | 'whatsapp' | 'email';
  body: string;
  sentAt: string;
}
