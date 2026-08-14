import type { TabDefinition } from "./contactTypes.js";
import type { ModuleCustomField, ModuleFieldDef } from "./moduleFieldSchema.js";
import { INITIAL_ACCOUNTING_FIELD_SEED } from "./moduleFieldSetupFinance.js";

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
  fields?: Record<string, unknown>;
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
    basic: INITIAL_ACCOUNTING_FIELD_SEED.basic.map((f) => ({ ...f })),
  },
  customFields: [],
  fieldOrder: ["code", "type", "name", "subtype", "description"],
};

export const DEFAULT_ACCOUNT_FIELD_DEFS: ModuleFieldDef[] = [
  { id: "code", label: "Account Code", required: true },
  { id: "type", label: "Type", required: true },
  { id: "name", label: "Account Name", required: true },
  { id: "subtype", label: "Sub-type" },
  { id: "description", label: "Description" },
];
