import type { AppTranslationKey } from "@mms/shared";
import type { ElementType } from "react";
import { BookOpen, Heart, TrendingUp, UserCheck, Zap } from "lucide-react";

export interface QuickActionType {
  id: string;
  labelKey: AppTranslationKey;
  icon: ElementType;
  debitAcc: string;
  creditAcc: string;
  tag: string;
  descriptionKey: AppTranslationKey;
  groupKey: AppTranslationKey;
  color: string;
}

interface QuickAction {
  labelKey: AppTranslationKey;
  icon: ElementType;
  type: QuickActionType;
}

const FEE_COLLECTION: QuickActionType = {
  id: "fee_collection",
  labelKey: "accounting.journal.dashboard.label.feeCollection",
  icon: BookOpen,
  debitAcc: "a1000",
  creditAcc: "a4000",
  tag: "Fees",
  descriptionKey: "accounting.journal.dashboard.desc.feeCollection",
  groupKey: "accounting.journal.dashboard.group.moneyIn",
  color: "emerald",
};

const SALARY_PAYMENT: QuickActionType = {
  id: "salary",
  labelKey: "accounting.journal.dashboard.label.salaryPayment",
  icon: UserCheck,
  debitAcc: "a5000",
  creditAcc: "a1010",
  tag: "Payroll",
  descriptionKey: "accounting.journal.dashboard.desc.salaryPayment",
  groupKey: "accounting.journal.dashboard.group.moneyOut",
  color: "red",
};

const DONATION_RECEIVED: QuickActionType = {
  id: "donation",
  labelKey: "accounting.journal.dashboard.label.donationReceived",
  icon: Heart,
  debitAcc: "a1000",
  creditAcc: "a4100",
  tag: "Donation",
  descriptionKey: "accounting.journal.dashboard.desc.donationReceived",
  groupKey: "accounting.journal.dashboard.group.moneyIn",
  color: "emerald",
};

const UTILITIES_PAYMENT: QuickActionType = {
  id: "utilities",
  labelKey: "accounting.journal.dashboard.label.utilities",
  icon: Zap,
  debitAcc: "a5200",
  creditAcc: "a1000",
  tag: "Utilities",
  descriptionKey: "accounting.journal.dashboard.desc.utilities",
  groupKey: "accounting.journal.dashboard.group.moneyOut",
  color: "red",
};

const OTHER_EXPENSE: QuickActionType = {
  id: "other_expense",
  labelKey: "accounting.journal.dashboard.label.otherExpense",
  icon: TrendingUp,
  debitAcc: "a5700",
  creditAcc: "a1000",
  tag: "Capital",
  descriptionKey: "accounting.journal.dashboard.desc.otherExpense",
  groupKey: "accounting.journal.dashboard.group.moneyOut",
  color: "red",
};

export const QUICK_ACTIONS: QuickAction[] = [
  { labelKey: "accounting.journal.dashboard.action.collectFee", icon: BookOpen, type: FEE_COLLECTION },
  { labelKey: "accounting.journal.dashboard.action.paySalary", icon: UserCheck, type: SALARY_PAYMENT },
  { labelKey: "accounting.journal.dashboard.action.recordDonation", icon: Heart, type: DONATION_RECEIVED },
  { labelKey: "accounting.journal.dashboard.action.payUtility", icon: Zap, type: UTILITIES_PAYMENT },
  { labelKey: "accounting.journal.dashboard.action.addExpense", icon: TrendingUp, type: OTHER_EXPENSE },
];

export function parseNaturalLanguage(text: string): QuickActionType | null {
  const normalizedText = text.toLowerCase();
  if (normalizedText.includes("fee") || normalizedText.includes("collect")) return FEE_COLLECTION;
  if (normalizedText.includes("salary") || normalizedText.includes("pay staff")) return SALARY_PAYMENT;
  if (normalizedText.includes("donat")) return DONATION_RECEIVED;
  if (
    normalizedText.includes("electric") ||
    normalizedText.includes("util") ||
    normalizedText.includes("gas") ||
    normalizedText.includes("water")
  ) {
    return UTILITIES_PAYMENT;
  }
  if (
    normalizedText.includes("expense") ||
    normalizedText.includes("paid") ||
    normalizedText.includes("purchase")
  ) {
    return OTHER_EXPENSE;
  }
  return null;
}
