import type { TabDefinition } from "./contactTypes.js";
import type { ModuleCustomField, ModuleFieldDef } from "./moduleFieldSchema.js";

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
  fields?: Record<string, unknown>;
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
