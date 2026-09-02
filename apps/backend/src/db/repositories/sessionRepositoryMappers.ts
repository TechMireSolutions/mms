import {
  type Session,
  type Class,
  type TimetableItem,
  type Discount,
  type BudgetExpense,
  type BudgetIncome,
  type SessionEvent,
  type TabarrukItem,
} from '@mms/shared';
import {
  type sessions,
  type sessionClasses,
  type sessionTimetable,
  type sessionDiscounts,
  type sessionBudgetExpenses,
  type sessionBudgetIncomes,
  type sessionEvents,
  type sessionTabarruk,
} from '../schema.js';

type SessionRow = typeof sessions.$inferSelect;
type ClassRow = typeof sessionClasses.$inferSelect;
type TimetableRow = typeof sessionTimetable.$inferSelect;
type DiscountRow = typeof sessionDiscounts.$inferSelect;
type ExpenseRow = typeof sessionBudgetExpenses.$inferSelect;
type IncomeRow = typeof sessionBudgetIncomes.$inferSelect;
type EventRow = typeof sessionEvents.$inferSelect;
type TabarrukRow = typeof sessionTabarruk.$inferSelect;

export function sessionRowToRecord(
  row: SessionRow,
  classes: ClassRow[] = [],
  timetable: TimetableRow[] = [],
  discounts: DiscountRow[] = [],
  expenses: ExpenseRow[] = [],
  incomes: IncomeRow[] = [],
  events: EventRow[] = [],
  tabarruk: TabarrukRow[] = [],
): Session {
  const mappedClasses: Class[] = classes.map((c) => ({
    id: c.id,
    name: c.name,
    ageMin: c.ageMin,
    ageMax: c.ageMax,
    gender: c.gender as Class['gender'],
    teacherId: c.teacherId,
    teacherName: c.teacherName ?? undefined,
    capacity: c.capacity,
    enrolled: c.enrolled,
    room: c.room ?? undefined,
  }));

  const mappedTimetable: TimetableItem[] = timetable.map((t) => ({
    id: t.id,
    day: t.day as TimetableItem['day'],
    activity: t.activity,
    startTime: t.startTime,
    endTime: t.endTime,
    location: t.location,
    type: t.type as TimetableItem['type'],
  }));

  const mappedDiscounts: Discount[] = discounts.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type as Discount['type'],
    value: Number(d.value) || 0,
    conditions: d.conditions,
    active: d.active,
  }));

  const mappedExpenses: BudgetExpense[] = expenses.map((e) => ({
    id: e.id,
    category: e.category,
    amount: Number(e.amount) || 0,
    date: e.date,
    note: e.note ?? undefined,
  }));

  const mappedIncomes: BudgetIncome[] = incomes.map((i) => ({
    id: i.id,
    category: i.category,
    amount: Number(i.amount) || 0,
    date: i.date,
    note: i.note ?? undefined,
  }));

  const mappedEvents: SessionEvent[] = events.map((ev) => ({
    id: ev.id,
    title: ev.title,
    date: ev.date,
    time: ev.time,
    location: ev.location,
    description: ev.description ?? undefined,
    type: ev.type as SessionEvent['type'],
  }));

  const mappedTabarruk: TabarrukItem[] = tabarruk.map((tab) => ({
    id: tab.id,
    item: tab.item,
    quantity: tab.quantity,
    occasion: tab.occasion,
    date: tab.date,
    note: tab.note ?? undefined,
  }));

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    status: row.status,
    startDate: row.startDate,
    endDate: row.endDate,
    baseFee: Number(row.baseFee) || 0,
    currency: row.currency,
    description: row.description ?? undefined,
    classes: mappedClasses,
    timetable: mappedTimetable,
    discounts: mappedDiscounts,
    budget: {
      totalRevenue: Number(row.budgetTotalRevenue) || 0,
      collected: Number(row.budgetCollected) || 0,
      expenses: mappedExpenses,
      incomes: mappedIncomes,
    },
    events: mappedEvents,
    tabarruk: mappedTabarruk,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : undefined,
    deletedBy: row.deletedBy ?? undefined,
    deletionReason: row.deletionReason ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
