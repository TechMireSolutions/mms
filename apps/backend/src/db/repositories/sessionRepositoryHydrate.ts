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
      .select()
      .from(sessionClasses)
      .where(
        and(
          eq(sessionClasses.workspaceSubdomain, subdomain),
          inArray(sessionClasses.sessionId, sessionIds),
        ),
      )
      .orderBy(sessionClasses.sortOrder),
    tx
      .select()
      .from(sessionTimetable)
      .where(
        and(
          eq(sessionTimetable.workspaceSubdomain, subdomain),
          inArray(sessionTimetable.sessionId, sessionIds),
        ),
      )
      .orderBy(sessionTimetable.sortOrder),
    tx
      .select()
      .from(sessionDiscounts)
      .where(
        and(
          eq(sessionDiscounts.workspaceSubdomain, subdomain),
          inArray(sessionDiscounts.sessionId, sessionIds),
        ),
      )
      .orderBy(sessionDiscounts.sortOrder),
    tx
      .select()
      .from(sessionBudgetExpenses)
      .where(
        and(
          eq(sessionBudgetExpenses.workspaceSubdomain, subdomain),
          inArray(sessionBudgetExpenses.sessionId, sessionIds),
        ),
      )
      .orderBy(sessionBudgetExpenses.sortOrder),
    tx
      .select()
      .from(sessionBudgetIncomes)
      .where(
        and(
          eq(sessionBudgetIncomes.workspaceSubdomain, subdomain),
          inArray(sessionBudgetIncomes.sessionId, sessionIds),
        ),
      )
      .orderBy(sessionBudgetIncomes.sortOrder),
    tx
      .select()
      .from(sessionEvents)
      .where(
        and(
          eq(sessionEvents.workspaceSubdomain, subdomain),
          inArray(sessionEvents.sessionId, sessionIds),
        ),
      )
      .orderBy(sessionEvents.sortOrder),
    tx
      .select()
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

export async function listSessionsByWorkspace(tenant: string): Promise<Session[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(sessions)
      .where(and(eq(sessions.workspaceSubdomain, subdomain), isNull(sessions.deletedAt)))
      .orderBy(sessions.startDate);
    return hydrateSessionsList(tx, subdomain, rows);
  });
}

export async function findSessionById(tenant: string, id: string): Promise<Session | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(sessions)
      .where(and(eq(sessions.workspaceSubdomain, subdomain), eq(sessions.id, id)));
    const row = rows[0];
    if (!row) return null;
    const [result] = await hydrateSessionsList(tx, subdomain, [row]);
    return result ?? null;
  });
}

export async function findSessionsByIds(tenant: string, ids: string[]): Promise<Session[]> {
  if (ids.length === 0) return [];
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(sessions)
      .where(and(eq(sessions.workspaceSubdomain, subdomain), inArray(sessions.id, ids)));
    return hydrateSessionsList(tx, subdomain, rows);
  });
}
