import { z } from 'zod';

export const ClassSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Class name is required'),
  ageMin: z.coerce.number().int().min(1).max(120),
  ageMax: z.coerce.number().int().min(1).max(120),
  gender: z.enum(['male', 'female', 'any']),
  teacherId: z.string(),
  teacherName: z.string().optional(),
  capacity: z.coerce.number().int().min(1),
  enrolled: z.coerce.number().int().nonnegative(),
  room: z.string().optional(),
});

export const TimetableItemSchema = z.object({
  id: z.string(),
  day: z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
  activity: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string(),
  type: z.enum(['class', 'lecture', 'assessment', 'spiritual', 'activity', 'break']),
});

export const DiscountSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().nonnegative(),
  conditions: z.string(),
  active: z.boolean(),
});

export const BudgetExpenseSchema = z.object({
  id: z.string(),
  category: z.string(),
  amount: z.coerce.number().nonnegative(),
  date: z.string(),
  note: z.string().optional(),
});

export const BudgetIncomeSchema = z.object({
  id: z.string(),
  category: z.string(),
  amount: z.coerce.number().nonnegative(),
  date: z.string(),
  note: z.string().optional(),
});

export const SessionBudgetSchema = z.object({
  totalRevenue: z.coerce.number().nonnegative(),
  collected: z.coerce.number().nonnegative(),
  expenses: z.array(BudgetExpenseSchema).default([]),
  incomes: z.array(BudgetIncomeSchema).default([]),
});

export const SessionEventSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  date: z.string(),
  time: z.string(),
  location: z.string(),
  description: z.string().optional(),
  type: z.enum(['ceremony', 'assessment', 'meeting', 'trip', 'other']),
});

export const TabarrukItemSchema = z.object({
  id: z.string(),
  item: z.string().min(1),
  quantity: z.string().min(1),
  occasion: z.string(),
  date: z.string(),
  note: z.string().optional(),
});

export const SessionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Session name is required'),
  type: z.string().min(1, 'Session type is required'),
  status: z.string().min(1, 'Session status is required'),
  startDate: z.string(),
  endDate: z.string(),
  baseFee: z.coerce.number().nonnegative('Base fee must be non-negative'),
  currency: z.string().min(1),
  description: z.string().optional(),
  classes: z.array(ClassSchema).default([]),
  timetable: z.array(TimetableItemSchema).default([]),
  discounts: z.array(DiscountSchema).default([]),
  budget: SessionBudgetSchema.optional(),
  events: z.array(SessionEventSchema).default([]),
  tabarruk: z.array(TabarrukItemSchema).default([]),
});

export type Class = z.infer<typeof ClassSchema>;
export type TimetableItem = z.infer<typeof TimetableItemSchema>;
export type Discount = z.infer<typeof DiscountSchema>;
export type BudgetExpense = z.infer<typeof BudgetExpenseSchema>;
export type BudgetIncome = z.infer<typeof BudgetIncomeSchema>;
export type SessionBudget = z.infer<typeof SessionBudgetSchema>;
export type SessionEvent = z.infer<typeof SessionEventSchema>;
export type TabarrukItem = z.infer<typeof TabarrukItemSchema>;
export type Session = z.infer<typeof SessionSchema>;
