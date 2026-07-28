import type { AppTranslationKey } from './appTranslations.js';
import { DEFAULT_MODULE_TIER_TAB_LABELS } from './moduleTierTabs.js';

/** Status of WhatsApp registration checks for phone numbers. */
export type WhatsAppStatus = 'PENDING' | 'REGISTERED' | 'NOT_REGISTERED' | 'FAILED';

/** Preferences governing automated WhatsApp verification triggers and UI presentation. */
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

/** Verification response payload for WhatsApp phone status lookups. */
export interface WhatsAppVerificationResult {
  status: WhatsAppStatus;
  checkedAt: string;
  error?: string;
}

/** Service interface for verifying WhatsApp capabilities on phone numbers. */
export interface WhatsAppProvider {
  verifyPhoneNumber(phoneNumber: string): Promise<WhatsAppVerificationResult>;
}

/** Supported interpersonal relationship types. */
export type RelationshipType = 
  | 'father'
  | 'mother'
  | 'guardian'
  | 'child'
  | 'spouse'
  | 'sibling'
  | 'colleague'
  | 'other';

/** Phone number model for contacts with label, country code, and verification status. */
export interface PhoneNumber {
  label: string;
  number: string;
  countryCode?: string;
  isPrimary?: boolean;
  whatsappStatus?: WhatsAppStatus;
}

/** Email address model for contacts with verification state and primary flag. */
export interface EmailAddress {
  label: string;
  address: string;
  isPrimary?: boolean;
  isVerified?: boolean;
}

/** Physical address model for contacts. */
export interface Address {
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
  label?: string;
  isPrimary?: boolean;
}

/** Social profile link model for contacts. */
export interface SocialLink {
  platform: string;
  url: string;
}

/** Emergency contact entry for a contact entity. */
export interface EmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
  contactId?: string | number;
  inferred?: boolean;
  inferredFromContactId?: string;
  inferenceDepth?: number;
}

/** Inter-contact relationship reference link. */
export interface ContactRelationship {
  contactId: string | number;
  relationship?: RelationshipType | string;
  notes?: string;
}

/** Audit log activity item recorded on a contact timeline. */
export interface ContactActivity {
  id: string;
  type: "note" | "stage_change" | "whatsapp" | "email" | "system" | "task" | "call";
  content: string;
  date: string;
  by?: string;
  metadata?: Record<string, unknown>;
}

/** Document attachment associated with a contact record. */
export interface ContactAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  date: string;
}

/** Primary domain model representing a Contact entity across the monorepo. */
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

/** Schema metadata for dynamic custom and standard contact fields. */
export interface FieldDefinition {
  key: string;
  label: string;
  /** i18n key for system fields; custom fields use `label` directly. */
  labelKey?: AppTranslationKey;
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
  /** i18n key for system field descriptions; custom fields use `description` directly. */
  descriptionKey?: AppTranslationKey;
  group?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  mask?: string;
  precision?: number;
}

/** Field grouping container for layout organization. */
export interface FieldGroup {
  id: string;
  label: string;
  description: string;
}

/** Tab specification entry for module layout customization. */
export interface TabDefinition {
  key: string;
  label: string;
  /** i18n key for system tabs; custom tabs use `label` directly. */
  labelKey?: AppTranslationKey;
  icon?: string;
  enabled: boolean;
  order: number;
  permissions?: string[];
  description?: string;
  color?: string;
  isSystem?: boolean;
}

/** Column registry configuration for contact directory tables. */
export interface ColumnRegistryEntry {
  key: string;
  label: string;
  /** i18n key for system columns; custom columns use `label` directly. */
  labelKey?: AppTranslationKey;
  enabled: boolean;
  order: number;
  sortable?: boolean;
  width?: number;        // px, 0 = auto
  sortField?: string;    // field key to sort by
  fixed?: boolean;
}

/** Complete field configuration envelope governing standard and custom field definitions. */
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

/** Tenant and user preferences for contact views, defaults, and duplicate scoring thresholds. */
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

/** WhatsApp quick template preset for campaign messaging. */
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

export const DEFAULT_CONTACT_PREFERENCES: ContactPreferences = {
  defaultCountry: "Pakistan",
  defaultProvince: "Punjab",
  defaultCity: "Lahore",
  defaultViewLayout: "list",
  duplicateDetectionFields: ["name", "phone", "email"],
  duplicateDetectionThresholdHigh: 90,
  duplicateDetectionThresholdMedium: 75,
  duplicateDetectionColorHigh: COLOR_PALETTES.destructive.bg,
  duplicateDetectionColorMedium: COLOR_PALETTES.warning.bg,
  duplicateDetectionColorLow: COLOR_PALETTES.slate.bg,
  duplicateDetectionScorePhoneEmail: 99,
  duplicateDetectionScoreNamePhone: 95,
  duplicateDetectionScoreNameEmail: 95,
  duplicateDetectionScorePhone: 80,
  duplicateDetectionScoreEmail: 80,
  duplicateDetectionScoreName: 75,
  duplicateDetectionScoreDefault: 70,
  duplicateDetectionColorWarning: COLOR_PALETTES.warning.bg,
  duplicateDetectionColorWarningText: COLOR_PALETTES.warning.text,
  duplicateDetectionColorSuccess: COLOR_PALETTES.success.bg,
  duplicateDetectionColorSuccessText: COLOR_PALETTES.success.text,
  duplicateDetectionColorHighlight: COLOR_PALETTES.info.bg,
  showDetailedSolarAge: true,
  showLunarDob: false,
  showDetailedLunarAge: false,
  namePrefixesToIgnore: ["syed", "syeda"],
};



export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  { id: "fee", label: "Fee Reminder", body: "Assalamu Alaikum! This is a friendly reminder that your fee payment for this month is due. Please contact us at your earliest convenience. JazakAllah Khair." },
  { id: "event", label: "Event Invitation", body: "Assalamu Alaikum! You are cordially invited to our upcoming event at the madrasa. Please confirm your attendance. JazakAllah Khair." },
  { id: "absence", label: "Absence Notice", body: "Assalamu Alaikum! We noticed your child was absent today. Please inform us if there is an issue. JazakAllah Khair." },
  { id: "custom", label: "Custom Message", body: "" },
];

export const DEFAULT_PHONE_LABELS = ["Mobile", "Home", "Work", "WhatsApp", "Other"];
export const DEFAULT_EMAIL_LABELS = ["Personal", "Work", "Other"];
export const DEFAULT_ADDRESS_LABELS = ["Home", "Work", "Billing", "Other"];

export const SOCIAL_PLATFORMS = [
  "Facebook", "Twitter / X", "Instagram", "LinkedIn", "TikTok", "YouTube",
  "WhatsApp", "Telegram", "Snapchat",
];

export const DEFAULT_SOCIAL_PLATFORMS = SOCIAL_PLATFORMS;

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

// ── Default seed constants ────────────────────────────────────────────────────
// Single source of truth for all default field, tab, and column definitions.
// Consumed by contactFieldsStore (frontend) and any future DB seed.
// Hardcoding these values anywhere else is banned per mms-fields.md.

export const INITIAL_FIELD_SEED: Record<string, FieldDefinition[]> = {
  basic: [
    { key: "avatar",         label: "Profile Photo",          labelKey: "contacts.fields.avatar",         type: "file",    description: "Avatar upload & display. Personalizes contacts & aids quick visual identification.", descriptionKey: "contacts.fields.avatarDesc", defaultValue: null, permissions: [], enabled: true, order: 0, required: false },
    { key: "isSyed",         label: "Is Syed",                labelKey: "contacts.fields.isSyed",         type: "boolean", description: "Syed (Hashemite) lineage indicator. Cultural/genealogical indicator.", descriptionKey: "contacts.fields.isSyedDesc", defaultValue: false, permissions: [], enabled: true, order: 1, required: false },
    { key: "firstName",      label: "First Name",             labelKey: "contacts.fields.firstName",      type: "text",    description: "First name input — required for all contacts.", descriptionKey: "contacts.fields.firstNameDesc", defaultValue: "", permissions: [], enabled: true, order: 2, required: true },
    { key: "lastName",       label: "Last Name",              labelKey: "contacts.fields.lastName",       type: "text",    description: "Last name input. Combined with first name for full identification.", descriptionKey: "contacts.fields.lastNameDesc", defaultValue: "", permissions: [], enabled: true, order: 3, required: false },
    { key: "gender",         label: "Gender (Male / Female)", labelKey: "contacts.fields.gender",         type: "select",  description: "Gender selector. Enables personalization & inclusive communication.", descriptionKey: "contacts.fields.genderDesc", options: GENDERS, defaultValue: "", permissions: [], enabled: true, order: 4, required: false },
    { key: "dob",            label: "Date of Birth",          labelKey: "contacts.fields.dob",            type: "date",    description: "Date of birth for age tracking & milestone events.", descriptionKey: "contacts.fields.dobDesc", defaultValue: "", permissions: [], enabled: true, order: 5, required: false },
  ],
  phones: [
    { key: "label",    label: "Phone Type / Label",               labelKey: "contacts.fields.phoneLabel",    type: "select", description: "Select type of phone number (e.g. Mobile, Home, Work).", descriptionKey: "contacts.fields.phoneLabelDesc", options: DEFAULT_PHONE_LABELS, defaultValue: "Mobile", permissions: [], enabled: true, order: 0, required: false },
    { key: "number",   label: "Phone Number",                     labelKey: "contacts.fields.phoneNumber",   type: "text",   description: "Phone number input. Primary channel for direct communication.", descriptionKey: "contacts.fields.phoneNumberDesc", defaultValue: "", permissions: [], enabled: true, order: 1, required: true },
  ],
  emails: [
    { key: "label",   label: "Email Type / Label", labelKey: "contacts.fields.emailLabel",   type: "select", description: "Select type of email address (e.g. Personal, Work, School).", descriptionKey: "contacts.fields.emailLabelDesc", options: DEFAULT_EMAIL_LABELS, defaultValue: "Personal", permissions: [], enabled: true, order: 0, required: false },
    { key: "address", label: "Email Address",      labelKey: "contacts.fields.emailAddress", type: "email",  description: "Email input field (unique per contact). Essential for formal communication & bulk outreach.", descriptionKey: "contacts.fields.emailAddressDesc", defaultValue: "", permissions: [], enabled: true, order: 1, required: false, unique: true },
  ],
  addresses: [
    { key: "label",   label: "Address Type / Label", labelKey: "contacts.fields.addressLabel",  type: "select", description: "Select type of address (e.g. Home, Work, Billing).", descriptionKey: "contacts.fields.addressLabelDesc", options: DEFAULT_ADDRESS_LABELS, defaultValue: "Home", permissions: [], enabled: true, order: 0, required: false },
    { key: "line1",   label: "Street Address",       labelKey: "contacts.fields.streetAddress", type: "text",   description: "Street/building address.", descriptionKey: "contacts.fields.streetAddressDesc", defaultValue: "", permissions: [], enabled: true, order: 1, required: false },
    { key: "city",    label: "City",                 labelKey: "contacts.fields.city",          type: "text",   description: "City of residence.",       descriptionKey: "contacts.fields.cityDesc", defaultValue: "", permissions: [], enabled: true, order: 2, required: false },
    { key: "state",   label: "State / Province",     labelKey: "contacts.fields.state",         type: "text",   description: "State or province.",       descriptionKey: "contacts.fields.stateDesc", defaultValue: "", permissions: [], enabled: true, order: 3, required: false },
    { key: "country", label: "Country",              labelKey: "contacts.fields.country",       type: "text",   description: "Country of residence.",    descriptionKey: "contacts.fields.countryDesc", defaultValue: "", permissions: [], enabled: true, order: 4, required: false },
  ],
  socials: [
    { key: "platform", label: "Platform Selection",  labelKey: "contacts.fields.platform",  type: "select", description: "Platform selection (Facebook, X, etc.)", descriptionKey: "contacts.fields.platformDesc", options: SOCIAL_PLATFORMS, defaultValue: "Facebook", permissions: [], enabled: true, order: 0, required: false },
    { key: "url",      label: "Social URL / Handle", labelKey: "contacts.fields.socialUrl", type: "url",    description: "URL or handle input. Enables social media engagement & verification.", descriptionKey: "contacts.fields.socialUrlDesc", defaultValue: "", permissions: [], enabled: true, order: 1, required: false },
  ],
  emergency: [
    { key: "contactId",    label: "Contact",      labelKey: "contacts.fields.emergencyContact", type: "text",   description: "Contact picker — links existing contacts as emergency contacts.", descriptionKey: "contacts.fields.emergencyContactDesc", defaultValue: "", permissions: [], enabled: true, order: 0, required: true },
    { key: "relationship", label: "Relationship", labelKey: "contacts.fields.relationship",     type: "select", description: "Relationship with the emergency contact (e.g. Father, Mother, Spouse).", descriptionKey: "contacts.fields.relationshipDesc", options: RELATIONSHIPS, defaultValue: "", permissions: [], enabled: true, order: 1, required: false },
  ],
};

/**
 * Contact classification keys retired from the product SSOT.
 * Contacts are persons — workspace roles and module memberships live on Users /
 * Teachers / Students. Never seed, display, or reintroduce these as contact system fields.
 */
export const CONTACT_RETIRED_CLASSIFICATION_KEYS = [
  "lifecycleStage",
  "tag",
  "persona",
] as const;

/** @mms/shared object/collection keys retired with contact lifecycle CRM. */
export const CONTACT_RETIRED_OBJECT_KEYS = [
  "lifecycleColors",
  "lifecycleStages",
] as const;

export type ContactRetiredClassificationKey =
  (typeof CONTACT_RETIRED_CLASSIFICATION_KEYS)[number];

/** True when `key` is a retired contact classification field. */
export function isContactRetiredClassificationKey(
  key: string,
): key is ContactRetiredClassificationKey {
  return (CONTACT_RETIRED_CLASSIFICATION_KEYS as readonly string[]).includes(key);
}

/** Strip retired classification keys from a contact-shaped record (seed/save sanitizer). */
export function stripContactRetiredClassificationFields<T extends Record<string, unknown>>(
  data: T,
): T {
  const next: Record<string, unknown> = { ...data };
  for (const key of CONTACT_RETIRED_CLASSIFICATION_KEYS) {
    delete next[key];
  }
  return next as T;
}

/**
 * Remove retired lifecycle CRM objects and classification columns/fields from
 * seed or onboard default objects. Single gate used by backend seed loaders.
 */
export function sanitizeContactSeedObjects(
  objects: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...objects };
  for (const key of CONTACT_RETIRED_OBJECT_KEYS) {
    delete next[key];
  }

  for (const objectKey of Object.keys(next)) {
    if (!objectKey.includes("contact_field_config")) continue;
    const raw = next[objectKey];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const config: Record<string, unknown> = { ...(raw as Record<string, unknown>) };

    if (Array.isArray(config.columnRegistry)) {
      config.columnRegistry = config.columnRegistry.filter((column) => {
        if (!column || typeof column !== "object") return true;
        const key = (column as { key?: unknown }).key;
        return typeof key !== "string" || !isContactRetiredClassificationKey(key);
      });
    }

    if (config.fields && typeof config.fields === "object" && !Array.isArray(config.fields)) {
      const fields: Record<string, unknown> = {
        ...(config.fields as Record<string, unknown>),
      };
      for (const [tabKey, tabFields] of Object.entries(fields)) {
        if (!Array.isArray(tabFields)) continue;
        fields[tabKey] = tabFields.filter((field) => {
          if (!field || typeof field !== "object") return true;
          const key = (field as { key?: unknown }).key;
          return typeof key !== "string" || !isContactRetiredClassificationKey(key);
        });
      }
      config.fields = fields;
    }

    next[objectKey] = config;
  }

  return next;
}

/**
 * Field keys retired from the contact **form** registry. They may still exist on
 * stored `Contact` JSONB blobs, but must never be re-rendered as form inputs.
 * `sanitizeConfig` strips these from any persisted field config.
 */
export const REMOVED_FORM_FIELD_KEYS: readonly string[] = [
  "countryCode",
  ...CONTACT_RETIRED_CLASSIFICATION_KEYS,
  "rating",
  "notes",
  "occupation",
  "communicationPreference",
  "preferredLanguage",
  "preferredContactMethod",
  "phone",
  "email",
];

export const DEFAULT_PAGE_TABS: TabDefinition[] = [
  { key: "work",    label: DEFAULT_MODULE_TIER_TAB_LABELS.work,    enabled: true, order: 0, isSystem: true },
  { key: "reports", label: DEFAULT_MODULE_TIER_TAB_LABELS.reports, enabled: true, order: 1, isSystem: true },
  { key: "setup",   label: DEFAULT_MODULE_TIER_TAB_LABELS.setup,   enabled: true, order: 2, isSystem: true },
];

export const DEFAULT_FORM_TABS: TabDefinition[] = [
  { key: "basic",     label: "Identity",   labelKey: "contacts.form.tabBasic",     enabled: true, order: 0, isSystem: true },
  { key: "phones",    label: "Phones",     labelKey: "contacts.form.tabPhones",    enabled: true, order: 1, isSystem: true },
  { key: "emails",    label: "Emails",     labelKey: "contacts.form.tabEmails",    enabled: true, order: 2, isSystem: true },
  { key: "addresses", label: "Addresses",  labelKey: "contacts.form.tabAddresses", enabled: true, order: 3, isSystem: true },
  { key: "socials",   label: "Socials",    labelKey: "contacts.form.tabSocials",   enabled: true, order: 4, isSystem: true },
  { key: "emergency", label: "Emergency",  labelKey: "contacts.form.tabEmergency", enabled: true, order: 5, isSystem: true },
];

export const DEFAULT_DETAIL_TABS: TabDefinition[] = [
  { key: "overview",  label: "Overview",  labelKey: "contacts.detail.tabOverview",  enabled: true, order: 0, isSystem: true },
  { key: "timeline",  label: "Timeline",  labelKey: "contacts.detail.tabTimeline",  enabled: true, order: 1, isSystem: true },
  { key: "network",   label: "Network",   labelKey: "contacts.detail.tabNetwork",   enabled: true, order: 2, isSystem: true },
  { key: "files",     label: "Files",     labelKey: "contacts.detail.tabFiles",     enabled: true, order: 3, isSystem: true },
];

export const DEFAULT_SETTINGS_SUB_TABS: TabDefinition[] = [
  { key: "fields",      label: "Fields",               labelKey: "contacts.setup.fields",      enabled: true, order: 0, isSystem: true },
  { key: "preferences", label: "Preferences",          labelKey: "contacts.setup.preferences", enabled: true, order: 1, isSystem: true },
  { key: "sync",        label: "Sync (Google / Apple)", labelKey: "contacts.setup.sync",        enabled: true, order: 2, isSystem: true },
];

export const DEFAULT_COLUMN_REGISTRY: ColumnRegistryEntry[] = [
  { key: "name",                   label: "Name",                   labelKey: "contacts.columns.name",                   enabled: true,  order: 0,  sortable: true,  width: 0,   fixed: true },
  { key: "gender",                 label: "Gender",                 labelKey: "contacts.columns.gender",                 enabled: true,  order: 1,  sortable: true,  width: 100 },
  { key: "phone",                  label: "Phone",                  labelKey: "contacts.columns.phone",                  enabled: true,  order: 2,  sortable: false, width: 140 },
  { key: "whatsapp",               label: "WhatsApp",               labelKey: "contacts.columns.whatsapp",               enabled: true,  order: 3,  sortable: false, width: 90  },
  { key: "email",                  label: "Email",                  labelKey: "contacts.columns.email",                  enabled: true,  order: 4,  sortable: false, width: 180 },
  { key: "isSyed",                 label: "Is Syed",                labelKey: "contacts.columns.isSyed",                 enabled: true,  order: 5,  sortable: true,  width: 90  },
  { key: "dob",                    label: "Date of Birth",          labelKey: "contacts.columns.dob",                    enabled: true,  order: 6,  sortable: true,  width: 130 },
  { key: "lunarDob",               label: "Lunar DOB",              labelKey: "contacts.columns.lunarDob",               enabled: true,  order: 7,  sortable: true,  sortField: "dob", width: 150 },
  { key: "line1",                  label: "Street Address",         labelKey: "contacts.columns.streetAddress",          enabled: false, order: 8,  sortable: true,  width: 150 },
  { key: "city",                   label: "City",                   labelKey: "contacts.columns.city",                   enabled: true,  order: 10, sortable: true,  width: 110 },
  { key: "state",                  label: "State / Province",       labelKey: "contacts.columns.state",                  enabled: false, order: 11, sortable: true,  width: 120 },
  { key: "country",                label: "Country",                labelKey: "contacts.columns.country",                enabled: false, order: 12, sortable: true,  width: 110 },
  { key: "socials_platform",       label: "Social Platforms",       labelKey: "contacts.columns.socialPlatforms",        enabled: false, order: 13, sortable: false, width: 130 },
  { key: "socials_url",            label: "Social Links",           labelKey: "contacts.columns.socialLinks",            enabled: false, order: 14, sortable: false, width: 150 },
  { key: "emergency_contact",      label: "Emergency Contact",      labelKey: "contacts.columns.emergencyContact",       enabled: false, order: 15, sortable: false, width: 150 },
  { key: "emergency_relationship", label: "Emergency Relationship", labelKey: "contacts.columns.emergencyRelationship",  enabled: false, order: 16, sortable: false, width: 140 },
];

export const COLUMN_FIELD_MAPPING: Record<string, { tabId: string; fieldId: string }> = {
  name: { tabId: "basic", fieldId: "firstName" },
  gender: { tabId: "basic", fieldId: "gender" },
  dob: { tabId: "basic", fieldId: "dob" },
  solarDob: { tabId: "basic", fieldId: "dob" },
  lunarDob: { tabId: "basic", fieldId: "dob" },
  isSyed: { tabId: "basic", fieldId: "isSyed" },
  phone: { tabId: "phones", fieldId: "number" },
  whatsapp: { tabId: "phones", fieldId: "whatsapp" },
  email: { tabId: "emails", fieldId: "address" },
  line1: { tabId: "addresses", fieldId: "line1" },
  city: { tabId: "addresses", fieldId: "city" },
  state: { tabId: "addresses", fieldId: "state" },
  country: { tabId: "addresses", fieldId: "country" },
  socials_platform: { tabId: "socials", fieldId: "platform" },
  socials_url: { tabId: "socials", fieldId: "url" },
  emergency_contact: { tabId: "emergency", fieldId: "contactId" },
  emergency_relationship: { tabId: "emergency", fieldId: "relationship" },
};

export type MessageCategory = 'general' | 'academic' | 'financial' | 'attendance' | 'emergency';

export interface MessageTemplate {
  id: string;
  label: string;
  /** i18n key for system templates; custom templates use `label` directly. */
  labelKey?: string;
  body: string;
  category?: MessageCategory;
  channel?: 'all' | 'sms' | 'whatsapp' | 'email';
  updatedAt?: string;
}

export const DEFAULT_MESSAGE_TEMPLATES: MessageTemplate[] = [
  { id: 't1', label: 'General Announcement', labelKey: 'messaging.template.generalAnnouncement', category: 'general', channel: 'all', body: 'Dear {name|Valued Parent}, we would like to inform you that...' },
  { id: 't2', label: 'Payment Reminder', labelKey: 'messaging.template.paymentReminder', category: 'financial', channel: 'all', body: 'Dear {name|Valued Parent}, this is a friendly reminder that your balance payment of {amount|0 PKR} is due.' },
  { id: 't3', label: 'Holiday Announcement', labelKey: 'messaging.template.holidayAnnouncement', category: 'general', channel: 'all', body: 'Dear {name|Valued Parent}, please note that the madrasa will remain closed on {date}.' },
  { id: 't4', label: 'Attendance Alert', labelKey: 'messaging.template.attendanceAlert', category: 'attendance', channel: 'whatsapp', body: 'Respected {name|Parent}, student {first_name} was marked absent today.' },
];

/**
 * Merges default templates with user/custom templates and context templates without duplicate template IDs.
 */
export function mergeMessageTemplates(
  customTemplates?: MessageTemplate[],
  contextTemplates?: MessageTemplate[]
): MessageTemplate[] {
  const base: MessageTemplate[] = [
    ...DEFAULT_MESSAGE_TEMPLATES,
    ...(contextTemplates || []),
  ];
  const existingIds = new Set(base.map((t) => t.id));
  const uniqueCustom = (customTemplates || []).filter((t) => !existingIds.has(t.id));
  return [...base, ...uniqueCustom];
}

/** Sent message record for SMS, WhatsApp, or Email communications. */
export interface Message {
  id: string;
  userId: string;
  contactId: string | number;
  channel: 'sms' | 'whatsapp' | 'email';
  body: string;
  sentAt: string;
  status?: 'queued' | 'sent' | 'delivered' | 'failed' | 'skipped';
  subject?: string;
  category?: MessageCategory;
  errorMessage?: string;
  /** Soft-delete timestamp; cleared logs remain until admin clear wipes them. */
  deletedAt?: string;
}

/** Client configuration model for Google Contacts OAuth and synchronization. */
export interface ContactGoogleSyncConfigClient {
  clientId?: string;
  clientSecret?: string;
  clearTokens?: boolean;
  updatedAt?: string;
  hasClientSecret?: boolean;
  hasRefreshToken?: boolean;
  isConnected?: boolean;
}

/** Result snapshot returned when running a Google Contacts sync operation. */
export interface GoogleContactsSyncRunResult {
  contacts: Contact[];
  total: number;
  imported: number;
  skipped: number;
}

