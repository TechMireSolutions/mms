import { and, eq, inArray, sql } from 'drizzle-orm';
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

type Transaction = Parameters<Parameters<typeof withTenant>[1]>[0];

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

async function insertSessionChildrenTx(
  tx: Transaction,
  subdomain: string,
  records: Session[],
): Promise<void> {
  const allClasses = records.flatMap((record) => {
    const sessionId = String(record.id);
    return (record.classes ?? []).map((c, idx) => ({
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
    }));
  });
  if (allClasses.length > 0) {
    await tx.insert(sessionClasses).values(allClasses);
  }

  const allTimetable = records.flatMap((record) => {
    const sessionId = String(record.id);
    return (record.timetable ?? []).map((t, idx) => ({
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
    }));
  });
  if (allTimetable.length > 0) {
    await tx.insert(sessionTimetable).values(allTimetable);
  }

  const allDiscounts = records.flatMap((record) => {
    const sessionId = String(record.id);
    return (record.discounts ?? []).map((d, idx) => ({
      id: d.id || `disc-${idx + 1}`,
      workspaceSubdomain: subdomain,
      sessionId,
      name: d.name,
      type: d.type,
      value: String(d.value ?? 0),
      conditions: d.conditions ?? '',
      active: d.active ?? true,
      sortOrder: idx,
    }));
  });
  if (allDiscounts.length > 0) {
    await tx.insert(sessionDiscounts).values(allDiscounts);
  }

  const allExpenses = records.flatMap((record) => {
    const sessionId = String(record.id);
    return (record.budget?.expenses ?? []).map((e, idx) => ({
      id: e.id || `exp-${idx + 1}`,
      workspaceSubdomain: subdomain,
      sessionId,
      category: e.category,
      amount: String(e.amount ?? 0),
      date: e.date,
      note: e.note ?? null,
      sortOrder: idx,
    }));
  });
  if (allExpenses.length > 0) {
    await tx.insert(sessionBudgetExpenses).values(allExpenses);
  }

  const allIncomes = records.flatMap((record) => {
    const sessionId = String(record.id);
    return (record.budget?.incomes ?? []).map((i, idx) => ({
      id: i.id || `inc-${idx + 1}`,
      workspaceSubdomain: subdomain,
      sessionId,
      category: i.category,
      amount: String(i.amount ?? 0),
      date: i.date,
      note: i.note ?? null,
      sortOrder: idx,
    }));
  });
  if (allIncomes.length > 0) {
    await tx.insert(sessionBudgetIncomes).values(allIncomes);
  }

  const allEvents = records.flatMap((record) => {
    const sessionId = String(record.id);
    return (record.events ?? []).map((ev, idx) => ({
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
    }));
  });
  if (allEvents.length > 0) {
    await tx.insert(sessionEvents).values(allEvents);
  }

  const allTabarruk = records.flatMap((record) => {
    const sessionId = String(record.id);
    return (record.tabarruk ?? []).map((tab, idx) => ({
      id: tab.id || `tab-${idx + 1}`,
      workspaceSubdomain: subdomain,
      sessionId,
      item: tab.item,
      quantity: tab.quantity,
      occasion: tab.occasion,
      date: tab.date,
      note: tab.note ?? null,
      sortOrder: idx,
    }));
  });
  if (allTabarruk.length > 0) {
    await tx.insert(sessionTabarruk).values(allTabarruk);
  }
}

export async function bulkSaveSessions(tenant: string, records: Session[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    const sessionIds = records.map((r) => String(r.id));

    await tx
      .insert(sessions)
      .values(
        records.map((record) => {
          const totalRevenue = record.budget?.totalRevenue ?? 0;
          const collected = record.budget?.collected ?? 0;
          return {
            id: String(record.id),
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
          };
        }),
      )
      .onConflictDoUpdate({
        target: [sessions.workspaceSubdomain, sessions.id],
        set: {
          name: sql`excluded.name`,
          type: sql`excluded.type`,
          status: sql`excluded.status`,
          startDate: sql`excluded.start_date`,
          endDate: sql`excluded.end_date`,
          baseFee: sql`excluded.base_fee`,
          currency: sql`excluded.currency`,
          description: sql`excluded.description`,
          budgetTotalRevenue: sql`excluded.budget_total_revenue`,
          budgetCollected: sql`excluded.budget_collected`,
          deletedAt: sql`excluded.deleted_at`,
          deletedBy: sql`excluded.deleted_by`,
          deletionReason: sql`excluded.deletion_reason`,
          updatedAt: new Date(),
        },
      });

    await Promise.all([
      tx.delete(sessionClasses).where(and(eq(sessionClasses.workspaceSubdomain, subdomain), inArray(sessionClasses.sessionId, sessionIds))),
      tx.delete(sessionTimetable).where(and(eq(sessionTimetable.workspaceSubdomain, subdomain), inArray(sessionTimetable.sessionId, sessionIds))),
      tx.delete(sessionDiscounts).where(and(eq(sessionDiscounts.workspaceSubdomain, subdomain), inArray(sessionDiscounts.sessionId, sessionIds))),
      tx.delete(sessionBudgetExpenses).where(and(eq(sessionBudgetExpenses.workspaceSubdomain, subdomain), inArray(sessionBudgetExpenses.sessionId, sessionIds))),
      tx.delete(sessionBudgetIncomes).where(and(eq(sessionBudgetIncomes.workspaceSubdomain, subdomain), inArray(sessionBudgetIncomes.sessionId, sessionIds))),
      tx.delete(sessionEvents).where(and(eq(sessionEvents.workspaceSubdomain, subdomain), inArray(sessionEvents.sessionId, sessionIds))),
      tx.delete(sessionTabarruk).where(and(eq(sessionTabarruk.workspaceSubdomain, subdomain), inArray(sessionTabarruk.sessionId, sessionIds))),
    ]);

    await insertSessionChildrenTx(tx, subdomain, records);
  });
}

export async function replaceSessionsForWorkspace(tenant: string, records: Session[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(sessions).where(eq(sessions.workspaceSubdomain, subdomain));
    if (records.length === 0) return;

    await tx.insert(sessions).values(
      records.map((record) => {
        const totalRevenue = record.budget?.totalRevenue ?? 0;
        const collected = record.budget?.collected ?? 0;
        return {
          id: String(record.id),
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
        };
      }),
    );

    await insertSessionChildrenTx(tx, subdomain, records);
  });
}
