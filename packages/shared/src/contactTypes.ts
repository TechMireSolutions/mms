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

export interface PhoneNumber {
  label: string;
  number: string;
  countryCode?: string;
}

export interface EmailAddress {
  label: string;
  address: string;
}

export interface Address {
  line1?: string;
  city?: string;
  state?: string;
  country?: string;
  label?: string;
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
}

export interface ContactRelationship {
  contactId: string | number;
  type: string;
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
  isSyed?: boolean;
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
  phones?: PhoneNumber[];
  emails?: EmailAddress[];
  addresses?: Address[];
  socials?: SocialLink[];
  emergencyContacts?: EmergencyContact[];
  notes?: string;
  occupation?: string;
  communicationPref?: string;
  phone?: string;
  email?: string;
  lifecycleStage?: string;
  rating?: number;
  relationships?: ContactRelationship[];
  activities?: ContactActivity[];
  attachments?: ContactAttachment[];
  profileHealth?: number;
  aiSummary?: string;
  [key: string]: unknown;
}

export interface FieldDefinition {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "select" | "multiselect" | "tags" | "boolean" | "url" | "email" | "file" | "location" | "ai_summary";
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
  uiStrings?: Record<string, string>;
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

export const LIFECYCLE_STAGES = [
  "Lead", "Active Student", "Alumnus", "Staff", "Donor", "Volunteer", "Parent",
];

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

export const DEFAULT_LIFECYCLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Lead": COLOR_PALETTES.blue,
  "Active Student": COLOR_PALETTES.emerald,
  "Alumnus": COLOR_PALETTES.violet,
  "Staff": COLOR_PALETTES.amber,
  "Donor": COLOR_PALETTES.rose,
  "Volunteer": COLOR_PALETTES.indigo,
  "Parent": COLOR_PALETTES.cyan,
};

export const LIFECYCLE_COLORS = DEFAULT_LIFECYCLE_COLORS;

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
  "Father", "Mother", "Son", "Daughter", "Brother", "Sister",
  "Guardian", "Spouse", "Other",
];

export const DEFAULT_ENABLED_FIELDS = [
  "name", "gender", "isSyed", "dob",
  "city", "state", "country",
];

export const DEFAULT_REQUIRED_FIELDS = ["name"];

export const DEFAULT_UI_STRINGS: Record<string, string> = {
  contacts: "Contacts",
  contactsDirectory: "Contacts Directory",
  contactsDescription: "View and manage the contacts directory, trace registration leads, and configure customized columns.",
  kanbanBoard: "Kanban Board",
  listView: "List View",
  allStages: "All Stages",
  deselect: "Deselect",
  noContactsMatchFilters: "No contacts match your filters",
  noContactsYet: "No contacts yet",
  tryAdjustingFilters: "Try adjusting your search or filters.",
  clickAddContact: "Click \"Add Contact\" to create your first contact.",
  clearFiltersBtn: "Clear Filters",
  moveToLabel: "Move to:",
  moveToPlaceholder: "Move...",
  noContactsInStage: "No contacts in this stage",
  addContact: "Add Contact",
  edit: "Edit",
  editProfile: "Edit Profile",
  editContactHeader: "Edit Contact",
  addNewContactHeader: "Add New Contact",
  deleteContact: "Delete",
  export: "Export",
  duplicates: "Duplicates",
  saveContact: "Save Contact",
  cancel: "Cancel",
  call: "Call",
  email: "Email",
  extendedProfiles: "Extended Profiles",
  logEventOrNote: "Log event or note...",
  activeSocialGraph: "Active Social Graph Connection",
  noConnectionsMapped: "No connections mapped",
  addRelationship: "Add Relationship",
  dragDropDocuments: "Drag & drop documents here for AI-powered indexing.",
  repositoryEmpty: "Repository Empty",
  updatedLabel: "Updated",
  atLeastOnePhoneRequired: "At least one phone number is required",
  atLeastOneEmailRequired: "At least one email address is required",
  atLeastOneAddressRequired: "At least one address is required",
  selectLabel: "Select label...",
  searchPlaceholder: "Search name, phone, email, ID, city, area…",
  stageLabel: "Stage:",
  genderFilterLabel: "Gender",
  sortByLabel: "Sort by",
  clearFilters: "Clear",
  allGenders: "All genders",
  viewProfile: "View Profile",
  selectedCount: "selected",
  phones: "Phone Numbers",
  emails: "Email Addresses",
  addresses: "Addresses",
  socials: "Social Links",
  emergency: "Emergency Contacts",
  relationships: "Relationships",
  notes: "Notes",
  dobLabel: "DOB:",
  notRegisteredWhatsApp: "Not registered on WhatsApp",
  yes: "Yes",
  no: "No",
  profileHealth: "Profile Health",
  crmRating: "CRM Rating",
  whatsapp: "WhatsApp",
  sms: "SMS",
  bulkSmsMessage: "Bulk SMS",
  openSmsApp: "Open Messages",
  smsManualSendNote: "Your device Messages app will open with this text. You tap Send when ready — MMS never sends SMS automatically.",
  smsMessagePlaceholder: "Type your SMS…",
  smsNoPhone: "No phone number on this contact",
  smsMessageRequired: "Enter a message before opening SMS",
  smsOpenFailed: "Could not open the SMS app on this device",
  smsNoEligibleContacts: "No selected contacts have a phone number",
  contactsHavePhone: "contacts have a phone",
  messageTemplate: "Message template",
  messageBody: "Message",
  saving: "Saving…",
  saved: "Saved!",
  progress: "Progress",
  profileIntelligence: "Profile Intelligence",
  verified: "Verified",
  incomplete: "Incomplete",
  aiIntelligence: "AI Intelligence",
  quietTimeline: "Quiet Timeline",
  cloudStorageRepository: "Cloud Storage Repository",
  browseFiles: "Browse Files",
  liveIntel: "Live Intel",
  type: "Type:",
  phoneNumber: "Phone Number",
  hasWhatsApp: "Has WhatsApp",
  addPhoneNumber: "Add phone number",
  noPhoneNumbersYet: "No phone numbers yet. Add one below.",
  emailAddress: "Email Address",
  addEmailAddress: "Add email address",
  noEmailAddressesYet: "No email addresses yet. Add one below.",
  streetAddress: "Street Address",
  city: "City",
  stateProvince: "State / Province",
  country: "Country",
  addAddress: "Add address",
  noAddressesYet: "No addresses yet. Add one below.",
  platformSelection: "Platform Selection",
  socialUrl: "Social URL / Handle",
  addSocialLink: "Add social link",
  noSocialLinksYet: "No social links yet. Add one below.",
  contact: "Contact",
  relationship: "Relationship",
  addEmergencyContact: "Add emergency contact",
  noEmergencyContactsYet: "No emergency contacts yet. Add one below.",
  dismiss: "Dismiss",
  merge: "Merge",
  mergePreview: "Merge Preview",
  confirmMerge: "Confirm Merge",
  duplicateDetection: "Duplicate Detection",
  potentialDuplicatesFound: "potential duplicates found",
  allDuplicatesResolved: "All duplicates resolved",
  contactListClean: "Your contact list is clean",
  selectRecordToKeep: "Select the record to keep:",
  fromDuplicate: "from duplicate",
  first_name_required_to_save: "First name is required to save",
  no_optional_fields_configured: "No optional fields configured. Go to the Settings tab to enable more fields.",
  emergencyLinkInstructions: "Link existing contacts as emergency contacts. They must already be in the system.",
  atLeastOneEmergencyContactRequired: "At least one emergency contact is required",
  atLeastOneSocialRequired: "At least one social link is required",
  searchByNamePhone: "Search by name, phone…",
  noContactsFound: "No contacts found.",
  findContact: "Find Contact",
  mergeWarning: "will be deleted and all their data will be merged into",
  duplicateCountMerged: "duplicate(s) merged successfully",
  close: "Close",
  selectPlaceholder: "Select...",
  mergedResult: "Merged result",
  nameField: "Name",
  phoneField: "Phone",
  emailField: "Email",
  genderField: "Gender",
  dobField: "Date of Birth",
  primaryPhone: "Primary Phone",
  primaryEmail: "Primary Email",
  contactA: "Contact A",
  contactB: "Contact B",
  matchingPhoneAndEmail: "Matching Phone & Email",
  matchingNameAndPhone: "Matching Name & Phone",
  matchingPhone: "Matching Phone",
  matchingNameAndEmail: "Matching Name & Email",
  matchingEmail: "Matching Email",
  matchingNameOnly: "Matching Name Only",
  matchSuffix: "% match",
  emptyDash: "—",
  mergedNotePrefix: "--- Merged from Duplicate ---",
  pleaseFixErrors: "Please fix the following errors",
  contactUpdated: "Contact updated",
  contactCreated: "Contact created",
  contactSavedSuccess: "was saved successfully.",
  essentialInfo: "Essential Info",
  firstName: "First Name",
  firstNameHint: "Auto-builds full name",
  lastName: "Last Name",
  egAhmad: "e.g. Ahmad",
  egHassan: "e.g. Hassan",
  fullNameLabel: "Full name: ",
  profilePhoto: "Profile Photo",
  uploadAvatarInstructions: "Click the camera icon to upload.<br />Auto-cropped & compressed to WebP.",
  removePhoto: "Remove photo",
  selectGender: "Select gender...",
  selectStage: "Select stage...",
  isSyedLabel: "Is Syed",
  yesSyed: "Yes, Syed",
  notSpecified: "Not specified",
  outOf5Stars: "out of 5 stars",
  required: "Required",
  percentSymbol: "%",
  totalContacts: "Total Contacts",
  activeProfiles: "Active Profiles",
  databaseHealth: "Database Health",
  completeLabel: "Complete",
  partialLabel: "Partial",
  staleLabel: "Stale",
  whatsappActive: "WhatsApp Active",
  verifiedPhones: "Verified Phones",
  columnsLabel: "Columns",
  visibleAndOrder: "Visible & Order",
  hidden: "Hidden",
  fixed: "Fixed",
  hideColumn: "Hide column",
  contactDetails: "Contact Details",
  closeDetails: "Close details",
  actions: "Actions",
  closePanel: "Close panel",
  closeCropper: "Close cropper",
  zoomScale: "Zoom scale",
  dragToReorderField: "Drag to reorder field",
  clearSelectedContact: "Clear selected contact",
  removeAddress: "Remove address",
  removeSocialLink: "Remove social link",
  socialUrlLabel: "Social URL",
  removePhoneNumber: "Remove phone number",
  countryCodeLabel: "Country code",
  whatsappEnabledLabel: "WhatsApp enabled",
  removeEmailAddress: "Remove email address",
  removeEmergencyContact: "Remove emergency contact",
  removeRelationship: "Remove relationship",
  removeTag: "Remove tag",
  toggleOption: "Toggle option",
  enableTab: "Enable",
  toggleTab: "Toggle tab",
  editContactAria: "Edit contact",
  deleteContactAria: "Delete contact",
  dynamicFieldsHeading: "Dynamic Contact Fields",
  dynamicFieldsDescription: "Toggle fields on/off, mark as required, and drag the grip handle to reorder fields. Order is reflected instantly in the Contact Form and Contact List.",
  contactFormFieldsByTab: "Contact Form Fields by Tab",
  dragToReorder: "drag",
  toReorder: "to reorder",
  defaultViewLayout: "Default View Layout",
  defaultViewLayoutDescription: "Select how contacts are displayed in work view",
  listViewLabel: "List View",
  kanbanBoardLabel: "Kanban Board",
  generalPreferences: "General Preferences",
  moduleLayoutAndTabs: "Module Layout & Tabs Configuration",
  moduleLayoutDescription: "Customize the names, display order, and visibility of tabs across the Contacts module. Changes apply instantly.",
  tabIdLabel: "Order",
  noFieldsAvailable: "No fields available for this tab.",
  fieldRequired: "Required",
  fieldOptional: "Optional",
  fieldUnique: "Unique",
  fieldStandard: "Standard",
  editField: "Edit",
  deleteField: "Del",
  defaultValueLabel: "Default Value",
  permissionsLabel: "Permissions (comma separated roles)",
  fieldTypeText: "Text",
  fieldTypeTextarea: "Long Text",
  fieldTypeNumber: "Number",
  fieldTypeDate: "Date",
  fieldTypeSelect: "Dropdown",
  fieldTypeTags: "Tags",
  fieldTypeBoolean: "Yes / No",
  fieldTypeUrl: "URL",
  fieldTypeEmail: "Email",
  defaultCountryLabel: "Default Country",
  defaultProvinceLabel: "Default Province / State",
  defaultCityLabel: "Default City",
  autoSuggestMergesLabel: "Auto-suggest Merges",
  autoSuggestMergesDescription: "Show merge suggestions for likely duplicates",
  showWhatsAppActionsLabel: "Show WhatsApp Actions",
  showWhatsAppActionsDescription: "Enable WhatsApp messaging buttons",
  pageTabsTitle: "Page Tabs",
  pageTabsDescription: "Tabs visible on the main Contacts page",
  formTabsTitle: "Form Tabs",
  formTabsDescription: "Tabs visible inside the Contact Form",
  detailTabsTitle: "Detail Drawer Tabs",
  detailTabsDescription: "Tabs visible inside the Contact Detail drawer",
  settingsSubTabsTitle: "Settings Sub-tabs",
  settingsSubTabsDescription: "Tabs visible in the Contact settings panel",
  saveAndApply: "Save & Apply",
  tabOrderLabel: "Order",
  editDefaultsAndPermissions: "Edit Defaults & Permissions",
  editFieldTitle: "Edit Field",
  deleteFieldTitle: "Delete Field",
  defaultValuePlaceholder: "Leave blank for none",
  permissionsPlaceholder: "e.g. admin, manager",
  defaultCountryPlaceholder: "e.g. Pakistan",
  defaultProvincePlaceholder: "e.g. Sindh",
  defaultCityPlaceholder: "e.g. Karachi",
  emergencyContact: "Emergency Contact",
  noWhatsapp: "No WA",
  template: "Template",
  message: "Message",
  cropProfilePhoto: "Crop Profile Photo",
  rotate: "Rotate",
  reset: "Reset",
  applyPhoto: "Apply Photo",
  bulkWhatsappMessage: "Bulk WhatsApp Message",
  recipients: "Recipients",
  personalLabel: "Personal",
  homeLabel: "Home",
  mobileLabel: "Mobile",
  facebookLabel: "Facebook",
  contactsHaveWhatsapp: "contacts have WhatsApp",
  withoutWhatsappWillBeSkipped: "contact(s) without WhatsApp will be skipped.",
  whatsappColor: "#075E54",
  whatsappColorHover: "#128C7E",
  countryCodePlaceholder: "+92",
  phoneNumberPlaceholder: "300 0000000",
  urlPlaceholderDefault: "https://...",
  of: "of",
  searchByName: "Search by name...",
  establishRelationshipsInstructions: "Establish bidirectional relationships with other contacts in the CRM. Links are displayed dynamically on profiles.",
  noRelationshipsSet: "No relationships set. Link this contact below.",
  link: "Link",
  linkContact: "Link Contact",
  relationshipType: "Relationship Type",
  selectType: "Select type...",
  addRelationshipLink: "Add Relationship Link",
  contactDeletedTitle: "Contact deleted",
  contactRemovedPrefix: "has been removed.",
  contactRemovedDefault: "Contact removed.",
  lifecycleStageUpdatedFrom: "Lifecycle stage updated from",
  to: "to",
  stageUpdatedTitle: "Stage updated",
  contactStageUpdatedTo: "Contact stage updated to",
  contactsImportedSuccessfully: "contacts imported successfully",
  contactImportedSuccessfully: "contact imported successfully",
  contactsMergedTitle: "Contacts merged",
  duplicateContactMergedSuccess: "The duplicate contact was merged successfully.",
  exportFilename: "contacts.csv",
  totalLabel: "total",
  shownLabel: "shown",
  yearsOld: "years old",
  otherGroup: "Other",
  systemUser: "System",
  healthColorHigh: "hsl(var(--success))",
  healthColorMedium: "hsl(var(--warning))",
  healthColorLow: "hsl(var(--destructive))",
  healthClassHigh: "text-success",
  healthClassMedium: "text-warning",
  healthClassLow: "text-destructive",
  defaultAiSummary: "AI summary will appear here once more activities are logged.",
  whatsappActiveClass: "bg-success/10 text-success border-success/30 hover:bg-success/20",
  whatsappDisabledClass: "opacity-40 cursor-not-allowed bg-muted/50 text-muted-foreground",
  emergencyBadgeClass: "bg-destructive/10 text-destructive border border-destructive/30",
  deleteActionClass: "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
  callActionClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50 hover:bg-blue-100",
  smsActionClass: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/50 hover:bg-violet-100",
  emailActionClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50 hover:bg-indigo-100",
  networkHeaderClass: "bg-success/10 border-success/30",
  networkIconContainerClass: "bg-success/10 text-success",
  networkTitleClass: "text-success",
  networkSubtitleClass: "text-emerald-600/80 dark:text-emerald-400/80",
  networkItemCardClass: "border-border hover:border-emerald-200 hover:bg-emerald-50/[0.02]",
  networkItemIconClass: "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50",
  networkItemActionClass: "hover:bg-muted text-muted-foreground hover:text-foreground",
  networkRelTypeClass: "text-emerald-650 dark:text-emerald-400",
  unknownInitial: "?",
  syedBadgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50",
  starActiveClass: "w-3 h-3 text-amber-500 fill-amber-500",
  starInactiveClass: "w-3 h-3 text-muted-foreground/30 fill-transparent",
  liveIntelIndicatorClass: "bg-emerald-500",
  liveIntelTextClass: "text-emerald-650 dark:text-emerald-400",
  contactIdPrefix: "ID: ",
  kbLabel: "KB",
  heroFields: "avatar,firstName,lastName,dob,gender,isSyed",
  defaultLifecycleStage: "Lead",
  otherLabel: "Other",
  workLabel: "Work",
  noOptions: "No options",
  selectOption: "— Select —",
  addNewTypePlaceholder: "Add new type...",
  add: "Add",
  select: "Select",
  removeOption: "Remove option",
  typeTagPlaceholder: "Type a tag and press Enter…",
  clickToUploadDocument: "Click to upload document",
  latitudePlaceholder: "Latitude",
  longitudePlaceholder: "Longitude",
  locationSetTo: "Location set to",
  aiInsightsHeader: "2026 AI Insights",
  aiSummaryPlaceholder: "AI summary will appear here after more contact activities are logged.",
  typeMessagePlaceholder: "Type your message here...",
  chars: "chars",
  messagesQueuedFor: "Messages queued for",
  contactsLabel: "contacts",
  sending: "Sending…",
  sent: "Sent!",
  sendTo: "Send to",
  openWhatsapp: "Open WhatsApp",
  cropperInstructions: "Drag to reposition · scroll to zoom",
  male: "Male",
  female: "Female",
  father: "Father",
  mother: "Mother",
  son: "Son",
  daughter: "Daughter",
  brother: "Brother",
  sister: "Sister",
  guardian: "Guardian",
  spouse: "Spouse",
  fieldName: "Field Name *",
  fieldType: "Field Type",
  adminNote: "(admin note)",
  optionalPreFilled: "(optional, pre-filled in the form)",
  leaveBlank: "Leave blank for no default",
  predefinedTags: "Predefined Tags",
  commaSeparated: "(comma-separated)",
  predefinedTagsHint: "e.g. Student, Alumni, Donor",
  optionsHint: "Option A, Option B, Option C",
  tagsCustomHint: "Users can also type and add custom tags not in this list.",
  minValue: "Min Value",
  maxValue: "Max Value",
  deleteFieldConfirm: "Delete {name}? This cannot be undone.",
  customFields: "Custom Fields",
  customFieldsDesc: "Add your own fields. They appear below the built-in fields in this tab.",
  addField: "Add Field",
  filters: "Filters",
  healthBgHigh: "bg-success",
  healthBgMedium: "bg-warning",
  healthBgLow: "bg-destructive",
  ratingActiveText: "text-amber-500 font-bold",
  ratingInactiveText: "text-muted-foreground/30 font-light",
  googleContacts: "Google Contacts",
  appleContacts: "Apple Contacts",
  vcardLabel: "(vCard / .vcf)",
  connectedLabel: "Connected",
  editCredentials: "Edit Credentials",
  setup: "Setup",
  saveCredentials: "Save Credentials",
  clientIdRequiredMsg: "Both Client ID and Client Secret are required.",
  oauthRedirectInstruction: "After authorizing, Google will redirect to your app. Copy the 'code' parameter from the URL and paste it below.",
  oauthAppSetupMsg: "Setup required — create a Google OAuth app first",
  googleCloudInstructions: "Go to Google Cloud Console, create a project, enable People API, create OAuth 2.0 Client ID (Web Application), add Authorized Redirect URI, copy Client ID & Secret.",
  connectGoogleAccountBtn: "Connect Google Account",
  pasteAuthCodeLabel: "After authorizing, paste the authorization code from the redirect URL:",
  pasteAuthCodePlaceholder: "Paste authorization code here…",
  confirmAuthBtn: "Confirm Authorization",
  googleAccountConnectedTitle: "Google Account Connected",
  googleAccountConnectedDesc: "Click sync to import your Google Contacts.",
  disconnectBtn: "Disconnect",
  syncCompleteTitle: "Sync complete — {total} contacts fetched",
  syncCompleteDesc: "{imported} imported · {skipped} already existed",
  syncing: "Syncing…",
  syncGoogleContactsBtn: "Sync Google Contacts",
  howToExportAppleTitle: "How to export from Apple Contacts:",
  appleExportStep1: "Open Contacts app on Mac → Select All (⌘A)",
  appleExportStep2: "File → Export vCard… → save the .vcf file",
  appleExportStep3: "iPhone: Use iCloud.com → Contacts → select all → export",
  appleExportStep4: "Upload the .vcf file below",
  uploadVcfBtn: "Upload .vcf file",
  dragDropBrowse: "Drag & drop or click to browse",
  contactsFound: "contacts found",
  clear: "Clear",
  andMore: "…and {count} more",
  importContactsCount: "Import {count} contacts",
  chooseDifferentFile: "Choose different file",
  importComplete: "Import complete",
  importedMsg: "{count} imported",
  skippedMsg: "{count} skipped (already exist)",
  exportAppleInstructions: "Export contacts to import into Apple Contacts",
  exportVcfBtn: "Export .vcf ({count})",
  dynamicContactSyncTitle: "Dynamic Contact Sync",
  dynamicContactSyncDesc: "Connect your Google account for live sync, or upload a vCard file from Apple Contacts. Each madrasa admin manages their own connection independently.",
  googleOauthCredentialsHeader: "Google OAuth Credentials",
  clientIdLabel: "Client ID",
  clientSecretLabel: "Client Secret",
  tokenExchangeFailed: "Token exchange failed: ",
  sessionExpiredMsg: "Session expired. Please reconnect your Google account.",
};

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
    { key: "gender",         label: "Gender (Male / Female)", type: "select",  description: "Gender selector. Enables personalization & inclusive communication.", options: ["Male", "Female"], defaultValue: "", permissions: [], enabled: true, order: 4, required: false },
    { key: "dob",            label: "Date of Birth",          type: "date",    description: "Date of birth for age tracking & milestone events.", defaultValue: "", permissions: [], enabled: true, order: 5, required: false },
  ],
  phones: [
    { key: "label",    label: "Phone Type / Label",               type: "select", description: "Select type of phone number (e.g. Mobile, Home, Work).", options: ["Mobile", "Home", "Work", "Other"], defaultValue: "Mobile", permissions: [], enabled: true, order: 0, required: false },
    { key: "number",   label: "Phone Number",                     type: "text",   description: "Phone number input. Primary channel for direct communication.", defaultValue: "", permissions: [], enabled: true, order: 1, required: true },
    { key: "countryCode", label: "Country Code",                  type: "text",   description: "Country dial code (e.g. +92).", defaultValue: "+92", permissions: [], enabled: true, order: 2, required: false },
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
    { key: "relationship", label: "Relationship", type: "select", description: "Relationship with the emergency contact (e.g. Father, Mother, Spouse).", options: ["Father", "Mother", "Son", "Daughter", "Brother", "Sister", "Guardian", "Spouse", "Other"], defaultValue: "", permissions: [], enabled: true, order: 1, required: false },
  ],
};

/**
 * Field keys retired from the contact **form** registry. They may still exist on
 * stored `Contact` records and other surfaces (Kanban, table column, detail
 * drawer read them directly), but must never be re-rendered as form inputs.
 * `sanitizeConfig` strips these from any persisted field config.
 */
export const REMOVED_FORM_FIELD_KEYS: readonly string[] = ["lifecycleStage", "rating"];

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
  { key: "profileHealth",  label: "Profile Health", enabled: true,  order: 1, sortable: true,  width: 100 },
  { key: "gender",         label: "Gender",         enabled: true,  order: 2, sortable: true,  width: 100 },
  { key: "lifecycleStage", label: "Stage",          enabled: true,  order: 3, sortable: true,  width: 120 },
  { key: "phone",          label: "Phone",          enabled: true,  order: 4, sortable: false,  width: 140 },
  { key: "whatsapp",       label: "WhatsApp",       enabled: true,  order: 5, sortable: false,  width: 90  },
  { key: "email",          label: "Email",          enabled: false, order: 6, sortable: false, width: 180 },
  { key: "city",           label: "City",           enabled: false, order: 7, sortable: true,  width: 110 },
  { key: "dob",            label: "Date of Birth",  enabled: false, order: 8, sortable: true,  width: 130 },
  { key: "rating",         label: "Rating",         enabled: false, order: 9, sortable: true,  width: 80  },
];
