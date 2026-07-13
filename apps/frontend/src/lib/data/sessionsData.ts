import { z } from "zod";
import {
  ClassSchema,
  TimetableItemSchema,
  DiscountSchema,
  BudgetExpenseSchema,
  BudgetIncomeSchema,
  SessionBudgetSchema,
  SessionEventSchema,
  TabarrukItemSchema,
  SessionSchema,
  type Class,
  type TimetableItem,
  type Discount,
  type BudgetExpense,
  type BudgetIncome,
  type SessionBudget,
  type SessionEvent,
  type TabarrukItem,
  type Session,
} from "@mms/shared";

export {
  ClassSchema,
  TimetableItemSchema,
  DiscountSchema,
  BudgetExpenseSchema,
  BudgetIncomeSchema,
  SessionBudgetSchema,
  SessionEventSchema,
  TabarrukItemSchema,
  SessionSchema,
};

export type {
  Class,
  TimetableItem,
  Discount,
  BudgetExpense,
  BudgetIncome,
  SessionBudget,
  SessionEvent,
  TabarrukItem,
  Session,
};


export const SESSION_TYPES = ["Hifz", "Qaidah", "Tajweed", "Islamic Studies", "Arabic", "Other"] as const;

export function validateSessions(sessionInput: unknown): Session[] {
  if (!Array.isArray(sessionInput)) return [];
  const valid: Session[] = [];
  for (const item of sessionInput) {
    const parsed = SessionSchema.safeParse(item);
    if (parsed.success) valid.push(parsed.data);
  }
  return valid;
}

export const SESSIONS_DATA: Session[] = [];

export const EVENT_TYPES = ["ceremony", "assessment", "meeting", "trip", "other"] as const;
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const ACTIVITY_TYPES = ["class", "lecture", "assessment", "spiritual", "activity", "break"] as const;
export const INCOME_CATEGORIES = ["Fee Collection", "Donation", "Grant", "Other"] as const;
export const EXPENSE_CATEGORIES = ["Teacher Salaries", "Stationery", "Utilities", "Rent", "Maintenance", "Other"] as const;
