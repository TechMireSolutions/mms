import { createContext } from "react";
import type {
  FieldConfig,
  ContactPreferences,
  FieldDefinition,
  ColumnRegistryEntry,
} from "@mms/shared";

export interface ContactConfigContextType {
  fieldConfig: FieldConfig;
  prefs: ContactPreferences;
  updateConfig: (nextConfig: FieldConfig) => void;
  updateConfigAsync: (nextConfig: FieldConfig) => Promise<void>;
  updatePrefs: (newPrefs: Partial<ContactPreferences>) => void;
  updatePrefsAsync: (newPrefs: Partial<ContactPreferences>) => Promise<void>;

  enabledTabIds: Set<string>;
  requiredTabIds: Set<string>;
  fields: Record<string, FieldDefinition[]>;
  isTabFieldEnabled: (tabId: string, fieldId: string) => boolean;
  isTabFieldRequired: (tabId: string, fieldId: string) => boolean;

  genders: string[];
  socialPlatforms: string[];
  relationships: string[];
  phoneLabels: string[];
  emailLabels: string[];
  addressLabels: string[];
  countryCodes: Array<{ country: string; code: string }>;

  countryCodesMap: Record<string, string>;
  defaultPhoneCountryCode: string;

  columnRegistry: ColumnRegistryEntry[];
  availableColumns: Array<{ id: string; label: string; sortField?: string; width?: number }>;
  visibleColumns: Array<{ id: string; label: string; sortField?: string; width?: number }>;

  updateGenders: (genderOptions: string[]) => void | Promise<void>;
  updateSocialPlatforms: (socialPlatformOptions: string[]) => void | Promise<void>;
  updateRelationships: (relationshipOptions: string[]) => void | Promise<void>;
  updatePhoneLabels: (phoneLabelOptions: string[]) => void | Promise<void>;
  updateEmailLabels: (emailLabelOptions: string[]) => void | Promise<void>;
  updateAddressLabels: (addressLabelOptions: string[]) => void | Promise<void>;
  updateCountryCodes: (countryCodeOptions: Array<{ country: string; code: string }>) => void | Promise<void>;
  updateColumnRegistry: (columnRegistry: ColumnRegistryEntry[]) => void;

  updateUserColumnLayout: (columnRegistry: ColumnRegistryEntry[]) => void;
  getColumnWidth: (key: string) => number | undefined;
  setColumnWidth: (key: string, width: number) => void;
  systemSortOptions: Array<{ field: string; label: string }>;
}

export const ContactConfigContext = createContext<ContactConfigContextType | null>(null);
