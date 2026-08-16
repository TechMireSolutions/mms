import { z } from 'zod';

export const ClassSchema = z
  .object({
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
  })
  .strict();

export const ClassInsertSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, 'Class name is required'),
    ageMin: z.coerce.number().int().min(1).max(120),
    ageMax: z.coerce.number().int().min(1).max(120),
    gender: z.enum(['male', 'female', 'any']),
    teacherId: z.string(),
    teacherName: z.string().optional(),
    capacity: z.coerce.number().int().min(1),
    enrolled: z.coerce.number().int().nonnegative().default(0),
    room: z.string().optional(),
  })
  .strict();

export const TimetableItemSchema = z
  .object({
    id: z.string(),
    day: z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    activity: z.string().min(1),
    startTime: z.string(),
    endTime: z.string(),
    location: z.string(),
    type: z.enum(['class', 'lecture', 'assessment', 'spiritual', 'activity', 'break']),
  })
  .strict();

export const TimetableItemInsertSchema = z
  .object({
    id: z.string().optional(),
    day: z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
    activity: z.string().min(1),
    startTime: z.string(),
    endTime: z.string(),
    location: z.string(),
    type: z.enum(['class', 'lecture', 'assessment', 'spiritual', 'activity', 'break']),
  })
  .strict();

export const DiscountSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1),
    type: z.enum(['percentage', 'fixed']),
    value: z.coerce.number().nonnegative(),
    conditions: z.string(),
    active: z.boolean(),
  })
  .strict();

export const DiscountInsertSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1),
    type: z.enum(['percentage', 'fixed']),
    value: z.coerce.number().nonnegative(),
    conditions: z.string().default(''),
    active: z.boolean().default(true),
  })
  .strict();

export const BudgetExpenseSchema = z
  .object({
    id: z.string(),
    category: z.string(),
    amount: z.coerce.number().nonnegative(),
    date: z.string(),
    note: z.string().optional(),
  })
  .strict();

export const BudgetExpenseInsertSchema = z
  .object({
    id: z.string().optional(),
    category: z.string(),
    amount: z.coerce.number().nonnegative(),
    date: z.string(),
    note: z.string().optional(),
  })
  .strict();

export const BudgetIncomeSchema = z
  .object({
    id: z.string(),
    category: z.string(),
    amount: z.coerce.number().nonnegative(),
    date: z.string(),
    note: z.string().optional(),
  })
  .strict();

export const BudgetIncomeInsertSchema = z
  .object({
    id: z.string().optional(),
    category: z.string(),
    amount: z.coerce.number().nonnegative(),
    date: z.string(),
    note: z.string().optional(),
  })
  .strict();

export const SessionBudgetSchema = z
  .object({
    totalRevenue: z.coerce.number().nonnegative(),
    collected: z.coerce.number().nonnegative(),
    expenses: z.array(BudgetExpenseSchema).default([]),
    incomes: z.array(BudgetIncomeSchema).default([]),
  })
  .strict();

export const SessionBudgetInsertSchema = z
  .object({
    totalRevenue: z.coerce.number().nonnegative().default(0),
    collected: z.coerce.number().nonnegative().default(0),
    expenses: z.array(BudgetExpenseInsertSchema).default([]),
    incomes: z.array(BudgetIncomeInsertSchema).default([]),
  })
  .strict();

export const SessionEventSchema = z
  .object({
    id: z.string(),
    title: z.string().min(1),
    date: z.string(),
    time: z.string(),
    location: z.string(),
    description: z.string().optional(),
    type: z.enum(['ceremony', 'assessment', 'meeting', 'trip', 'other']),
  })
  .strict();

export const SessionEventInsertSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().min(1),
    date: z.string(),
    time: z.string(),
    location: z.string(),
    description: z.string().optional(),
    type: z.enum(['ceremony', 'assessment', 'meeting', 'trip', 'other']),
  })
  .strict();

export const TabarrukItemSchema = z
  .object({
    id: z.string(),
    item: z.string().min(1),
    quantity: z.string().min(1),
    occasion: z.string(),
    date: z.string(),
    note: z.string().optional(),
  })
  .strict();

export const TabarrukItemInsertSchema = z
  .object({
    id: z.string().optional(),
    item: z.string().min(1),
    quantity: z.string().min(1),
    occasion: z.string(),
    date: z.string(),
    note: z.string().optional(),
  })
  .strict();

export const SessionSchema = z
  .object({
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
    deletedAt: z.string().nullable().optional(),
    deletedBy: z.string().nullable().optional(),
    deletionReason: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .strict();

export const SessionInsertSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, 'Session name is required'),
    type: z.string().min(1, 'Session type is required'),
    status: z.string().min(1, 'Session status is required'),
    startDate: z.string(),
    endDate: z.string(),
    baseFee: z.coerce.number().nonnegative('Base fee must be non-negative'),
    currency: z.string().min(1).default('PKR'),
    description: z.string().optional(),
    classes: z.array(ClassInsertSchema).default([]),
    timetable: z.array(TimetableItemInsertSchema).default([]),
    discounts: z.array(DiscountInsertSchema).default([]),
    budget: SessionBudgetInsertSchema.optional(),
    events: z.array(SessionEventInsertSchema).default([]),
    tabarruk: z.array(TabarrukItemInsertSchema).default([]),
    deletedAt: z.string().nullable().optional(),
    deletedBy: z.string().nullable().optional(),
    deletionReason: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .strict();

export type Class = z.infer<typeof ClassSchema>;
export type ClassInsert = z.infer<typeof ClassInsertSchema>;
export type TimetableItem = z.infer<typeof TimetableItemSchema>;
export type TimetableItemInsert = z.infer<typeof TimetableItemInsertSchema>;
export type Discount = z.infer<typeof DiscountSchema>;
export type DiscountInsert = z.infer<typeof DiscountInsertSchema>;
export type BudgetExpense = z.infer<typeof BudgetExpenseSchema>;
export type BudgetExpenseInsert = z.infer<typeof BudgetExpenseInsertSchema>;
export type BudgetIncome = z.infer<typeof BudgetIncomeSchema>;
export type BudgetIncomeInsert = z.infer<typeof BudgetIncomeInsertSchema>;
export type SessionBudget = z.infer<typeof SessionBudgetSchema>;
export type SessionBudgetInsert = z.infer<typeof SessionBudgetInsertSchema>;
export type SessionEvent = z.infer<typeof SessionEventSchema>;
export type SessionEventInsert = z.infer<typeof SessionEventInsertSchema>;
export type TabarrukItem = z.infer<typeof TabarrukItemSchema>;
export type TabarrukItemInsert = z.infer<typeof TabarrukItemInsertSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type SessionInsert = z.infer<typeof SessionInsertSchema>;
export const SessionUpdateSchema = SessionInsertSchema.partial();
export type SessionUpdate = z.infer<typeof SessionUpdateSchema>;
