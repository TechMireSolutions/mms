import { and, eq, inArray, isNull } from 'drizzle-orm';
import { type Session } from '@mms/shared';
import {
  sessions,
  sessionClasses,
  sessionTimetable,
  sessionDiscounts,
  sessionBudgetExpenses,
  sessionBudgetIncomes,
  sessionEvents,
  sessionTabarruk,
} from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { sessionRowToRecord } from './sessionRepositoryMappers.js';

type Transaction = Parameters<Parameters<typeof withTenant>[1]>[0];

type SessionRow = typeof sessions.$inferSelect;
type ClassRow = typeof sessionClasses.$inferSelect;
type TimetableRow = typeof sessionTimetable.$inferSelect;
type DiscountRow = typeof sessionDiscounts.$inferSelect;
type ExpenseRow = typeof sessionBudgetExpenses.$inferSelect;
type IncomeRow = typeof sessionBudgetIncomes.$inferSelect;
type EventRow = typeof sessionEvents.$inferSelect;
type TabarrukRow = typeof sessionTabarruk.$inferSelect;

async function hydrateSessionsList(
  tx: Transaction,
  subdomain: string,
  sessionRows: SessionRow[],
): Promise<Session[]> {
  if (sessionRows.length === 0) return [];
  const sessionIds = sessionRows.map((s) => s.id);

  const [
    classesRows,
    timetableRows,
    discountsRows,
    expensesRows,
    incomesRows,
    eventsRows,
    tabarrukRows,
  ] = await Promise.all([
    tx
      .select({
        id: sessionClasses.id,
        workspaceSubdomain: sessionClasses.workspaceSubdomain,
        sessionId: sessionClasses.sessionId,
        name: sessionClasses.name,
        ageMin: sessionClasses.ageMin,
        ageMax: sessionClasses.ageMax,
        gender: sessionClasses.gender,
        teacherId: sessionClasses.teacherId,
        teacherName: sessionClasses.teacherName,
        capacity: sessionClasses.capacity,
        enrolled: sessionClasses.enrolled,
        room: sessionClasses.room,
        sortOrder: sessionClasses.sortOrder,
        createdAt: sessionClasses.createdAt,
      })
      .from(sessionClasses)
      .where(
        and(
          eq(sessionClasses.workspaceSubdomain, subdomain),
          inArray(sessionClasses.sessionId, sessionIds),
        ),
      )
      .orderBy(sessionClasses.sortOrder),
    tx
      .select({
        id: sessionTimetable.id,
        workspaceSubdomain: sessionTimetable.workspaceSubdomain,
        sessionId: sessionTimetable.sessionId,
        day: sessionTimetable.day,
        activity: sessionTimetable.activity,
        startTime: sessionTimetable.startTime,
        endTime: sessionTimetable.endTime,
        location: sessionTimetable.location,
        type: sessionTimetable.type,
        sortOrder: sessionTimetable.sortOrder,
        createdAt: sessionTimetable.createdAt,
      })
      .from(sessionTimetable)
      .where(
        and(
          eq(sessionTimetable.workspaceSubdomain, subdomain),
          inArray(sessionTimetable.sessionId, sessionIds),
        ),
      )
      .orderBy(sessionTimetable.sortOrder),
    tx
      .select({
        id: sessionDiscounts.id,
        workspaceSubdomain: sessionDiscounts.workspaceSubdomain,
        sessionId: sessionDiscounts.sessionId,
        name: sessionDiscounts.name,
        type: sessionDiscounts.type,
        value: sessionDiscounts.value,
        conditions: sessionDiscounts.conditions,
        active: sessionDiscounts.active,
        sortOrder: sessionDiscounts.sortOrder,
        createdAt: sessionDiscounts.createdAt,
      })
      .from(sessionDiscounts)
      .where(
        and(
          eq(sessionDiscounts.workspaceSubdomain, subdomain),
          inArray(sessionDiscounts.sessionId, sessionIds),
        ),
      )
      .orderBy(sessionDiscounts.sortOrder),
    tx
      .select({
        id: sessionBudgetExpenses.id,
        workspaceSubdomain: sessionBudgetExpenses.workspaceSubdomain,
        sessionId: sessionBudgetExpenses.sessionId,
        category: sessionBudgetExpenses.category,
        amount: sessionBudgetExpenses.amount,
        date: sessionBudgetExpenses.date,
        note: sessionBudgetExpenses.note,
        sortOrder: sessionBudgetExpenses.sortOrder,
        createdAt: sessionBudgetExpenses.createdAt,
      })
      .from(sessionBudgetExpenses)
      .where(
        and(
          eq(sessionBudgetExpenses.workspaceSubdomain, subdomain),
          inArray(sessionBudgetExpenses.sessionId, sessionIds),
        ),
      )
      .orderBy(sessionBudgetExpenses.sortOrder),
    tx
      .select({
        id: sessionBudgetIncomes.id,
        workspaceSubdomain: sessionBudgetIncomes.workspaceSubdomain,
        sessionId: sessionBudgetIncomes.sessionId,
        category: sessionBudgetIncomes.category,
        amount: sessionBudgetIncomes.amount,
        date: sessionBudgetIncomes.date,
        note: sessionBudgetIncomes.note,
        sortOrder: sessionBudgetIncomes.sortOrder,
        createdAt: sessionBudgetIncomes.createdAt,
      })
      .from(sessionBudgetIncomes)
      .where(
        and(
          eq(sessionBudgetIncomes.workspaceSubdomain, subdomain),
          inArray(sessionBudgetIncomes.sessionId, sessionIds),
        ),
      )
      .orderBy(sessionBudgetIncomes.sortOrder),
    tx
      .select({
        id: sessionEvents.id,
        workspaceSubdomain: sessionEvents.workspaceSubdomain,
        sessionId: sessionEvents.sessionId,
        title: sessionEvents.title,
        date: sessionEvents.date,
        time: sessionEvents.time,
        location: sessionEvents.location,
        description: sessionEvents.description,
        type: sessionEvents.type,
        sortOrder: sessionEvents.sortOrder,
        createdAt: sessionEvents.createdAt,
      })
      .from(sessionEvents)
      .where(
        and(
          eq(sessionEvents.workspaceSubdomain, subdomain),
          inArray(sessionEvents.sessionId, sessionIds),
        ),
      )
      .orderBy(sessionEvents.sortOrder),
    tx
      .select({
        id: sessionTabarruk.id,
        workspaceSubdomain: sessionTabarruk.workspaceSubdomain,
        sessionId: sessionTabarruk.sessionId,
        item: sessionTabarruk.item,
        quantity: sessionTabarruk.quantity,
        occasion: sessionTabarruk.occasion,
        date: sessionTabarruk.date,
        note: sessionTabarruk.note,
        sortOrder: sessionTabarruk.sortOrder,
        createdAt: sessionTabarruk.createdAt,
      })
      .from(sessionTabarruk)
      .where(
        and(
          eq(sessionTabarruk.workspaceSubdomain, subdomain),
          inArray(sessionTabarruk.sessionId, sessionIds),
        ),
      )
      .orderBy(sessionTabarruk.sortOrder),
  ]);

  const classesMap = new Map<string, ClassRow[]>();
  for (const c of classesRows) {
    const list = classesMap.get(c.sessionId) ?? [];
    list.push(c);
    classesMap.set(c.sessionId, list);
  }

  const timetableMap = new Map<string, TimetableRow[]>();
  for (const t of timetableRows) {
    const list = timetableMap.get(t.sessionId) ?? [];
    list.push(t);
    timetableMap.set(t.sessionId, list);
  }

  const discountsMap = new Map<string, DiscountRow[]>();
  for (const d of discountsRows) {
    const list = discountsMap.get(d.sessionId) ?? [];
    list.push(d);
    discountsMap.set(d.sessionId, list);
  }

  const expensesMap = new Map<string, ExpenseRow[]>();
  for (const e of expensesRows) {
    const list = expensesMap.get(e.sessionId) ?? [];
    list.push(e);
    expensesMap.set(e.sessionId, list);
  }

  const incomesMap = new Map<string, IncomeRow[]>();
  for (const i of incomesRows) {
    const list = incomesMap.get(i.sessionId) ?? [];
    list.push(i);
    incomesMap.set(i.sessionId, list);
  }

  const eventsMap = new Map<string, EventRow[]>();
  for (const ev of eventsRows) {
    const list = eventsMap.get(ev.sessionId) ?? [];
    list.push(ev);
    eventsMap.set(ev.sessionId, list);
  }

  const tabarrukMap = new Map<string, TabarrukRow[]>();
  for (const tab of tabarrukRows) {
    const list = tabarrukMap.get(tab.sessionId) ?? [];
    list.push(tab);
    tabarrukMap.set(tab.sessionId, list);
  }

  return sessionRows.map((row) =>
    sessionRowToRecord(
      row,
      classesMap.get(row.id) ?? [],
      timetableMap.get(row.id) ?? [],
      discountsMap.get(row.id) ?? [],
      expensesMap.get(row.id) ?? [],
      incomesMap.get(row.id) ?? [],
      eventsMap.get(row.id) ?? [],
      tabarrukMap.get(row.id) ?? [],
    ),
  );
}

export async function listSessionsByWorkspace(
  tenant: string,
  options?: { limit?: number; offset?: number },
): Promise<Session[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const cols = {
      id: sessions.id,
      workspaceSubdomain: sessions.workspaceSubdomain,
      name: sessions.name,
      type: sessions.type,
      status: sessions.status,
      startDate: sessions.startDate,
      endDate: sessions.endDate,
      baseFee: sessions.baseFee,
      currency: sessions.currency,
      description: sessions.description,
      budgetTotalRevenue: sessions.budgetTotalRevenue,
      budgetCollected: sessions.budgetCollected,
      deletedAt: sessions.deletedAt,
      deletedBy: sessions.deletedBy,
      deletionReason: sessions.deletionReason,
      createdAt: sessions.createdAt,
      updatedAt: sessions.updatedAt,
    };
    const baseQuery = tx
      .select(cols)
      .from(sessions)
      .where(and(eq(sessions.workspaceSubdomain, subdomain), isNull(sessions.deletedAt)))
      .orderBy(sessions.startDate);
    if (options?.offset) {
      baseQuery.offset(Math.max(0, options.offset));
    }
    const rows = options?.limit
      ? await baseQuery.limit(Math.min(Math.max(1, options.limit), 5000))
      : await baseQuery;
    return hydrateSessionsList(tx, subdomain, rows);
  });
}

export async function findSessionById(tenant: string, id: string): Promise<Session | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: sessions.id,
        workspaceSubdomain: sessions.workspaceSubdomain,
        name: sessions.name,
        type: sessions.type,
        status: sessions.status,
        startDate: sessions.startDate,
        endDate: sessions.endDate,
        baseFee: sessions.baseFee,
        currency: sessions.currency,
        description: sessions.description,
        budgetTotalRevenue: sessions.budgetTotalRevenue,
        budgetCollected: sessions.budgetCollected,
        deletedAt: sessions.deletedAt,
        deletedBy: sessions.deletedBy,
        deletionReason: sessions.deletionReason,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
      })
      .from(sessions)
      .where(and(eq(sessions.workspaceSubdomain, subdomain), eq(sessions.id, id)));
    const row = rows[0];
    if (!row) return null;
    const [result] = await hydrateSessionsList(tx, subdomain, rows);
    return result ?? null;
  });
}

export async function findSessionsByIds(tenant: string, ids: string[]): Promise<Session[]> {
  if (ids.length === 0) return [];
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: sessions.id,
        workspaceSubdomain: sessions.workspaceSubdomain,
        name: sessions.name,
        type: sessions.type,
        status: sessions.status,
        startDate: sessions.startDate,
        endDate: sessions.endDate,
        baseFee: sessions.baseFee,
        currency: sessions.currency,
        description: sessions.description,
        budgetTotalRevenue: sessions.budgetTotalRevenue,
        budgetCollected: sessions.budgetCollected,
        deletedAt: sessions.deletedAt,
        deletedBy: sessions.deletedBy,
        deletionReason: sessions.deletionReason,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
      })
      .from(sessions)
      .where(and(eq(sessions.workspaceSubdomain, subdomain), inArray(sessions.id, ids)));
    return hydrateSessionsList(tx, subdomain, rows);
  });
}
