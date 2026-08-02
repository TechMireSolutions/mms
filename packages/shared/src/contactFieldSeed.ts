/** Default contact field seed — SSOT for contactFieldsStore and DB seed. */
import type { FieldDefinition } from './contactFieldSchemaTypes.js';
import {
  DEFAULT_ADDRESS_LABELS,
  DEFAULT_EMAIL_LABELS,
  DEFAULT_PHONE_LABELS,
  GENDERS,
  RELATIONSHIPS,
  SOCIAL_PLATFORMS,
} from './contactPreferenceDefaults.js';

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
    { key: "cnic",           label: "CNIC / National ID",     labelKey: "contacts.form.cnic",             type: "text",    description: "National identity number when required by the madrasa.", descriptionKey: "contacts.fields.cnicDesc", defaultValue: "", permissions: [], enabled: false, order: 6, required: false },
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
    { key: "platform", label: "Platform Selection",  labelKey: "contacts.fields.platform",  type: "select", description: "Platform selection (Facebook, X, etc.)", descriptionKey: "contacts.fields.platformDesc", options: SOCIAL_PLATFORMS, defaultValue: SOCIAL_PLATFORMS[0], permissions: [], enabled: true, order: 0, required: false },
    { key: "url",      label: "Social URL / Handle", labelKey: "contacts.fields.socialUrl", type: "text",   description: "URL or handle input. Enables social media engagement & verification.", descriptionKey: "contacts.fields.socialUrlDesc", defaultValue: "", permissions: [], enabled: true, order: 1, required: false },
  ],
  relationship: [
    { key: "contactId",    label: "Contact",      labelKey: "contacts.fields.linkedContact", type: "text",   description: "Contact picker — links an existing contact in this relationship.", descriptionKey: "contacts.fields.linkedContactDesc", defaultValue: "", permissions: [], enabled: true, order: 0, required: true },
    { key: "relationship", label: "Relationship", labelKey: "contacts.fields.relationship",  type: "select", description: "Relationship type (e.g. Father, Mother, Spouse).", descriptionKey: "contacts.fields.relationshipDesc", options: RELATIONSHIPS, defaultValue: "", permissions: [], enabled: true, order: 1, required: false },
  ],
};
