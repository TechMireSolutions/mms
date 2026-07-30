/** Contact form/page/detail tab defaults and column registry. */
import { DEFAULT_MODULE_TIER_TAB_LABELS } from './moduleTierTabs.js';
import type { ColumnRegistryEntry, TabDefinition } from './contactFieldSchemaTypes.js';
import { CONTACT_RETIRED_CLASSIFICATION_KEYS } from './contactRetiredFields.js';

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
