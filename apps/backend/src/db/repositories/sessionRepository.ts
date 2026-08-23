import { and, eq, inArray, isNull } from 'drizzle-orm';
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

type Transaction = Parameters<Parameters<typeof withTenant>[1]>[0];

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

async function persistSessionTx(
  tx: Transaction,
  subdomain: string,
  record: Session,
): Promise<void> {
  const sessionId = String(record.id);
  const totalRevenue = record.budget?.totalRevenue ?? 0;
  const collected = record.budget?.collected ?? 0;

  await tx
    .insert(sessions)
    .values({
      id: sessionId,
      workspaceSubdomain: subdomain,
      name: record.name,
      type: record.type,
      status: record.status,
      startDate: record.startDate,
      endDate: record.endDate,
      baseFee: String(record.baseFee ?? 0),
      currency: record.currency ?? 'PKR',
      description: record.description ?? null,
      budgetTotalRevenue: String(totalRevenue),
      budgetCollected: String(collected),
      deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
      deletedBy: record.deletedBy ?? null,
      deletionReason: record.deletionReason ?? null,
      createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [sessions.workspaceSubdomain, sessions.id],
      set: {
        name: record.name,
        type: record.type,
        status: record.status,
        startDate: record.startDate,
        endDate: record.endDate,
        baseFee: String(record.baseFee ?? 0),
        currency: record.currency ?? 'PKR',
        description: record.description ?? null,
        budgetTotalRevenue: String(totalRevenue),
        budgetCollected: String(collected),
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        deletedBy: record.deletedBy ?? null,
        deletionReason: record.deletionReason ?? null,
        updatedAt: new Date(),
      },
    });

  // Re-sync child collections
  await tx
    .delete(sessionClasses)
    .where(and(eq(sessionClasses.workspaceSubdomain, subdomain), eq(sessionClasses.sessionId, sessionId)));
  if (record.classes && record.classes.length > 0) {
    await tx.insert(sessionClasses).values(
      record.classes.map((c, idx) => ({
        id: c.id || `cls-${idx + 1}`,
        workspaceSubdomain: subdomain,
        sessionId,
        name: c.name,
        ageMin: c.ageMin ?? 1,
        ageMax: c.ageMax ?? 120,
        gender: c.gender ?? 'any',
        teacherId: c.teacherId,
        teacherName: c.teacherName ?? null,
        capacity: c.capacity ?? 30,
        enrolled: c.enrolled ?? 0,
        room: c.room ?? null,
        sortOrder: idx,
      })),
    );
  }

  await tx
    .delete(sessionTimetable)
    .where(and(eq(sessionTimetable.workspaceSubdomain, subdomain), eq(sessionTimetable.sessionId, sessionId)));
  if (record.timetable && record.timetable.length > 0) {
    await tx.insert(sessionTimetable).values(
      record.timetable.map((t, idx) => ({
        id: t.id || `tt-${idx + 1}`,
        workspaceSubdomain: subdomain,
        sessionId,
        day: t.day,
        activity: t.activity,
        startTime: t.startTime,
        endTime: t.endTime,
        location: t.location,
        type: t.type,
        sortOrder: idx,
      })),
    );
  }

  await tx
    .delete(sessionDiscounts)
    .where(and(eq(sessionDiscounts.workspaceSubdomain, subdomain), eq(sessionDiscounts.sessionId, sessionId)));
  if (record.discounts && record.discounts.length > 0) {
    await tx.insert(sessionDiscounts).values(
      record.discounts.map((d, idx) => ({
        id: d.id || `disc-${idx + 1}`,
        workspaceSubdomain: subdomain,
        sessionId,
        name: d.name,
        type: d.type,
        value: String(d.value ?? 0),
        conditions: d.conditions ?? '',
        active: d.active ?? true,
        sortOrder: idx,
      })),
    );
  }

  await tx
    .delete(sessionBudgetExpenses)
    .where(and(eq(sessionBudgetExpenses.workspaceSubdomain, subdomain), eq(sessionBudgetExpenses.sessionId, sessionId)));
  if (record.budget?.expenses && record.budget.expenses.length > 0) {
    await tx.insert(sessionBudgetExpenses).values(
      record.budget.expenses.map((e, idx) => ({
        id: e.id || `exp-${idx + 1}`,
        workspaceSubdomain: subdomain,
        sessionId,
        category: e.category,
        amount: String(e.amount ?? 0),
        date: e.date,
        note: e.note ?? null,
        sortOrder: idx,
      })),
    );
  }

  await tx
    .delete(sessionBudgetIncomes)
    .where(and(eq(sessionBudgetIncomes.workspaceSubdomain, subdomain), eq(sessionBudgetIncomes.sessionId, sessionId)));
  if (record.budget?.incomes && record.budget.incomes.length > 0) {
    await tx.insert(sessionBudgetIncomes).values(
      record.budget.incomes.map((i, idx) => ({
        id: i.id || `inc-${idx + 1}`,
        workspaceSubdomain: subdomain,
        sessionId,
        category: i.category,
        amount: String(i.amount ?? 0),
        date: i.date,
        note: i.note ?? null,
        sortOrder: idx,
      })),
    );
  }

  await tx
    .delete(sessionEvents)
    .where(and(eq(sessionEvents.workspaceSubdomain, subdomain), eq(sessionEvents.sessionId, sessionId)));
  if (record.events && record.events.length > 0) {
    await tx.insert(sessionEvents).values(
      record.events.map((ev, idx) => ({
        id: ev.id || `ev-${idx + 1}`,
        workspaceSubdomain: subdomain,
        sessionId,
        title: ev.title,
        date: ev.date,
        time: ev.time,
        location: ev.location,
        description: ev.description ?? null,
        type: ev.type,
        sortOrder: idx,
      })),
    );
  }

  await tx
    .delete(sessionTabarruk)
    .where(and(eq(sessionTabarruk.workspaceSubdomain, subdomain), eq(sessionTabarruk.sessionId, sessionId)));
  if (record.tabarruk && record.tabarruk.length > 0) {
    await tx.insert(sessionTabarruk).values(
      record.tabarruk.map((tab, idx) => ({
        id: tab.id || `tab-${idx + 1}`,
        workspaceSubdomain: subdomain,
        sessionId,
        item: tab.item,
        quantity: tab.quantity,
        occasion: tab.occasion,
        date: tab.date,
        note: tab.note ?? null,
        sortOrder: idx,
      })),
    );
  }
}

export async function saveSession(tenant: string, record: Session): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await persistSessionTx(tx, subdomain, record);
  });
}

export async function bulkSaveSessions(tenant: string, records: Session[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    for (const record of records) {
      await persistSessionTx(tx, subdomain, record);
    }
  });
}

export async function replaceSessionsForWorkspace(tenant: string, records: Session[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(sessions).where(eq(sessions.workspaceSubdomain, subdomain));
    for (const record of records) {
      await persistSessionTx(tx, subdomain, record);
    }
  });
}
