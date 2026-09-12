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
import { mapAuditTimestamps, nullsToUndefined } from './repositoryMappers.js';

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
  const mappedClasses: Class[] = classes.map((c) => {
    const raw = nullsToUndefined(c);
    return {
      id: raw.id,
      name: raw.name,
      ageMin: raw.ageMin,
      ageMax: raw.ageMax,
      gender: raw.gender as Class['gender'],
      teacherId: raw.teacherId,
      teacherName: raw.teacherName,
      capacity: raw.capacity,
      enrolled: raw.enrolled,
      room: raw.room,
    };
  });

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

  const mappedExpenses: BudgetExpense[] = expenses.map((e) => {
    const raw = nullsToUndefined(e);
    return {
      id: raw.id,
      category: raw.category,
      amount: Number(raw.amount) || 0,
      date: raw.date,
      note: raw.note,
    };
  });

  const mappedIncomes: BudgetIncome[] = incomes.map((i) => {
    const raw = nullsToUndefined(i);
    return {
      id: raw.id,
      category: raw.category,
      amount: Number(raw.amount) || 0,
      date: raw.date,
      note: raw.note,
    };
  });

  const mappedEvents: SessionEvent[] = events.map((ev) => {
    const raw = nullsToUndefined(ev);
    return {
      id: raw.id,
      title: raw.title,
      date: raw.date,
      time: raw.time,
      location: raw.location,
      type: raw.type as SessionEvent['type'],
      description: raw.description,
    };
  });

  const mappedTabarruk: TabarrukItem[] = tabarruk.map((tab) => {
    const raw = nullsToUndefined(tab);
    return {
      id: raw.id,
      item: raw.item,
      quantity: raw.quantity,
      occasion: raw.occasion,
      date: raw.date,
      note: raw.note,
    };
  });

  const rowNorm = nullsToUndefined(row);
  return {
    id: rowNorm.id,
    name: rowNorm.name,
    type: rowNorm.type,
    status: rowNorm.status,
    startDate: rowNorm.startDate,
    endDate: rowNorm.endDate,
    baseFee: Number(rowNorm.baseFee) || 0,
    currency: rowNorm.currency,
    description: rowNorm.description,
    classes: mappedClasses,
    timetable: mappedTimetable,
    discounts: mappedDiscounts,
    budget: {
      totalRevenue: Number(rowNorm.budgetTotalRevenue) || 0,
      collected: Number(rowNorm.budgetCollected) || 0,
      expenses: mappedExpenses,
      incomes: mappedIncomes,
    },
    events: mappedEvents,
    tabarruk: mappedTabarruk,
    ...mapAuditTimestamps(row),
  } satisfies Session;
}

