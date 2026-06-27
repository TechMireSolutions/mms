import type { Invoice, Payment } from '@mms/shared';
export type { Invoice, Payment };

export interface HasanatPayout {
  id: string;
  studentId: string;
  studentName?: string;
  class: string;
  pointsEarned: number;
  pointsRedeemed: number;
  rewardGiven: string | null;
  date: string | null;
  approvedByUserId?: string | null;
  approvedBy?: string | null;
}

import {
  type FinanceSettings,
  DEFAULT_FINANCE_SETTINGS
} from "@mms/shared";

export type { FinanceSettings };
export { DEFAULT_FINANCE_SETTINGS };

export const INVOICES: Invoice[] = [];
export const PAYMENTS: Payment[] = [];
export const MONTHLY_REVENUE: { month: string; collected: number; outstanding: number; expenses: number }[] = [];
export const HASANAT_PAYOUTS: HasanatPayout[] = [];
export const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Online", "Cheque", "Other"] as const;
export const INVOICE_STATUSES = ["paid", "pending", "overdue", "partial", "cancelled"] as const;
