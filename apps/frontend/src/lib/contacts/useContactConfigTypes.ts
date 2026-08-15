import type {
  ColumnRegistryEntry,
  ContactPreferences,
  FieldConfig,
  FieldDefinition,
} from "@mms/shared";
import type { ContactsColumnConfig } from "./contactConfigContextTypes";

export type { ContactsColumnConfig };

/** Contacts settings = field config (prefs stay a separate slice). */
export type ContactsConfigSettings = FieldConfig;

/** Extra state Contacts layers on top of the standard-module config core. */
export type ContactConfigExtras = {
  // ── Preferences & Tabs ──────────────────────────────────────────────────────
  prefs: ContactPreferences;
  updatePrefs: (newPrefs: Partial<ContactPreferences>) => void;
  updatePrefsAsync: (newPrefs: Partial<ContactPreferences>) => Promise<void>;
  formTabsReady: boolean;
  enabledTabIds: Set<string>;
  requiredTabIds: Set<string>;
  fields: Record<string, FieldDefinition[]>;
  isTabFieldEnabled: (tabId: string, fieldId: string) => boolean;
  isTabFieldRequired: (tabId: string, fieldId: string) => boolean;

  // ── Lookups & Catalogs ──────────────────────────────────────────────────────
  genders: string[];
  socialPlatforms: string[];
  relationships: string[];
  phoneLabels: string[];
  emailLabels: string[];
  addressLabels: string[];
  countryCodes: Array<{ country: string; code: string }>;
  countryCodesMap: Record<string, string>;
  lookupsReady: boolean;
  reloadCollections: () => void;
  updateGenders: (genderOptions: string[]) => void | Promise<void>;
  updateSocialPlatforms: (socialPlatformOptions: string[]) => void | Promise<void>;
  updateRelationships: (relationshipOptions: string[]) => void | Promise<void>;
  updatePhoneLabels: (phoneLabelOptions: string[]) => void | Promise<void>;
  updateEmailLabels: (emailLabelOptions: string[]) => void | Promise<void>;
  updateAddressLabels: (addressLabelOptions: string[]) => void | Promise<void>;
  updateCountryCodes: (
    countryCodeOptions: Array<{ country: string; code: string }>,
  ) => void | Promise<void>;

  // ── Column Layout & Visibility ──────────────────────────────────────────────
  columnRegistry: ColumnRegistryEntry[];
  availableColumns: ContactsColumnConfig[];
  visibleColumns: ContactsColumnConfig[];
  getColumnWidth: (key: string) => number | undefined;
  setColumnWidth: (key: string, width: number) => void;
  updateUserColumnLayout: (columnRegistry: ColumnRegistryEntry[]) => void;
  isColumnVisible: (key: string) => boolean;
  systemSortOptions: Array<{ field: string; label: string }>;

  // ── Configuration Mutations ─────────────────────────────────────────────────
  updateConfig: (nextConfig: FieldConfig) => void;
  updateConfigAsync: (nextConfig: FieldConfig) => Promise<void>;
  updateColumnRegistry: (columnRegistry: ColumnRegistryEntry[]) => void;
};

