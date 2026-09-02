import type { Invoice, Payment } from '@mms/shared';
export type { Invoice, Payment };

import {
  type FinanceSettings,
  DEFAULT_FINANCE_SETTINGS
} from "@mms/shared";

export type { FinanceSettings };
export { DEFAULT_FINANCE_SETTINGS };

export const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Online", "Cheque", "Other"] as const;
export const INVOICE_STATUSES = ["paid", "pending", "overdue", "partial", "cancelled"] as const;
