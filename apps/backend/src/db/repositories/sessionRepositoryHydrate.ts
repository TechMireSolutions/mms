import { and, eq, inArray, isNull } from 'drizzle-orm';
import { type Session } from '@mms/shared';
import {
  sessions,
  sessionFaculty,
  sessionClasses,
  sessionClassFees,
  sessionClassSchedules,
  sessionClassBudgets,
  sessionClassDiscounts,
  sessionClassTimetables,
  sessionClassTimetablePeriods,
  sessionClassRefreshments,
  scholarshipEligibilities,
  sessionClassScholarships,
} from '../schema.js';
import { withTenant } from '../tenant-context.js';
import { sessionRowToRecord } from './sessionRepositoryMappers.js';

type Transaction = Parameters<Parameters<typeof withTenant>[1]>[0];

type SessionRow = typeof sessions.$inferSelect;

async function hydrateSessionsList(
  tx: Transaction,
  subdomain: string,
  sessionRows: SessionRow[],
): Promise<Session[]> {
  if (sessionRows.length === 0) return [];
  const sessionIds = sessionRows.map((s) => s.id);

  // 1. Batch load Session Faculty and Session Classes
  const [facultyRows, classesRows] = await Promise.all([
    tx
      .select()
      .from(sessionFaculty)
      .where(
        and(
          eq(sessionFaculty.workspaceSubdomain, subdomain),
          inArray(sessionFaculty.sessionId, sessionIds),
        ),
      ),
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
  ]);

  const classIds = classesRows.map((c) => c.id);

  // If no classes exist, map sessions with faculty only
  if (classIds.length === 0) {
    const facultyMap = new Map<string, typeof facultyRows>();
    for (const f of facultyRows) {
      const list = facultyMap.get(f.sessionId) ?? [];
      list.push(f);
      facultyMap.set(f.sessionId, list);
    }
    return sessionRows.map((row) =>
      sessionRowToRecord(row, facultyMap.get(row.id) ?? [], []),
    );
  }

  // 2. Batch load Class-level children
  const [
    feeRows,
    scheduleRows,
    budgetRows,
    discountRows,
    timetableRows,
    refreshmentRows,
    scholarshipRows,
  ] = await Promise.all([
    tx
      .select()
      .from(sessionClassFees)
      .where(
        and(
          eq(sessionClassFees.workspaceSubdomain, subdomain),
          inArray(sessionClassFees.sessionClassId, classIds),
        ),
      ),
    tx
      .select()
      .from(sessionClassSchedules)
      .where(
        and(
          eq(sessionClassSchedules.workspaceSubdomain, subdomain),
          inArray(sessionClassSchedules.sessionClassId, classIds),
        ),
      ),
    tx
      .select()
      .from(sessionClassBudgets)
      .where(
        and(
          eq(sessionClassBudgets.workspaceSubdomain, subdomain),
          inArray(sessionClassBudgets.sessionClassId, classIds),
        ),
      ),
    tx
      .select()
      .from(sessionClassDiscounts)
      .where(
        and(
          eq(sessionClassDiscounts.workspaceSubdomain, subdomain),
          inArray(sessionClassDiscounts.sessionClassId, classIds),
        ),
      ),
    tx
      .select()
      .from(sessionClassTimetables)
      .where(
        and(
          eq(sessionClassTimetables.workspaceSubdomain, subdomain),
          inArray(sessionClassTimetables.sessionClassId, classIds),
        ),
      ),
    tx
      .select()
      .from(sessionClassRefreshments)
      .where(
        and(
          eq(sessionClassRefreshments.workspaceSubdomain, subdomain),
          inArray(sessionClassRefreshments.sessionClassId, classIds),
        ),
      ),
    tx
      .select()
      .from(sessionClassScholarships)
      .where(
        and(
          eq(sessionClassScholarships.workspaceSubdomain, subdomain),
          inArray(sessionClassScholarships.sessionClassId, classIds),
        ),
      ),
  ]);

  // 3. Batch load Timetable periods and Scholarship eligibilities
  const timetableIds = timetableRows.map((t) => t.id);
  const eligibilityIds = scholarshipRows
    .map((s) => s.scholarshipEligibilityId)
    .filter((id): id is string => Boolean(id));

  const [periodRows, eligibilityRows] = await Promise.all([
    timetableIds.length > 0
      ? tx
          .select()
          .from(sessionClassTimetablePeriods)
          .where(
            and(
              eq(sessionClassTimetablePeriods.workspaceSubdomain, subdomain),
              inArray(sessionClassTimetablePeriods.timetableId, timetableIds),
            ),
          )
      : Promise.resolve([]),
    eligibilityIds.length > 0
      ? tx
          .select()
          .from(scholarshipEligibilities)
          .where(
            and(
              eq(scholarshipEligibilities.workspaceSubdomain, subdomain),
              inArray(scholarshipEligibilities.id, eligibilityIds),
            ),
          )
      : Promise.resolve([]),
  ]);

  // Group by session and class
  const facultyBySession = new Map<string, typeof facultyRows>();
  for (const f of facultyRows) {
    const list = facultyBySession.get(f.sessionId) ?? [];
    list.push(f);
    facultyBySession.set(f.sessionId, list);
  }

  const classesBySession = new Map<string, typeof classesRows>();
  for (const c of classesRows) {
    const list = classesBySession.get(c.sessionId) ?? [];
    list.push(c);
    classesBySession.set(c.sessionId, list);
  }

  return sessionRows.map((row) =>
    sessionRowToRecord(
      row,
      facultyBySession.get(row.id) ?? [],
      classesBySession.get(row.id) ?? [],
      feeRows,
      scheduleRows,
      budgetRows,
      discountRows,
      timetableRows,
      periodRows,
      refreshmentRows,
      scholarshipRows,
      eligibilityRows,
    ),
  );
}

/**
 * Lean hydration for the Work list: loads `classes` & `faculty` counts for the directory cards/table.
 */
async function hydrateSessionsListSummary(
  tx: Transaction,
  subdomain: string,
  sessionRows: SessionRow[],
): Promise<Session[]> {
  if (sessionRows.length === 0) return [];
  const sessionIds = sessionRows.map((s) => s.id);

  const [facultyRows, classesRows] = await Promise.all([
    tx
      .select()
      .from(sessionFaculty)
      .where(
        and(
          eq(sessionFaculty.workspaceSubdomain, subdomain),
          inArray(sessionFaculty.sessionId, sessionIds),
        ),
      ),
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
  ]);

  const facultyBySession = new Map<string, typeof facultyRows>();
  for (const f of facultyRows) {
    const list = facultyBySession.get(f.sessionId) ?? [];
    list.push(f);
    facultyBySession.set(f.sessionId, list);
  }

  const classesBySession = new Map<string, typeof classesRows>();
  for (const c of classesRows) {
    const list = classesBySession.get(c.sessionId) ?? [];
    list.push(c);
    classesBySession.set(c.sessionId, list);
  }

  return sessionRows.map((row) =>
    sessionRowToRecord(
      row,
      facultyBySession.get(row.id) ?? [],
      classesBySession.get(row.id) ?? [],
    ),
  );
}

export async function listSessionsByWorkspace(
  tenant: string,
  options?: { limit?: number; offset?: number },
): Promise<Session[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const baseQuery = tx
      .select()
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
    if (!tx || typeof (tx as any).select !== 'function') return null;
    const rows = await tx
      .select()
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
    if (!tx || typeof (tx as any).select !== 'function') return [];
    const rows = await tx
      .select()
      .from(sessions)
      .where(and(eq(sessions.workspaceSubdomain, subdomain), inArray(sessions.id, ids)));
    return hydrateSessionsList(tx, subdomain, rows);
  });
}

export async function findSessionsSummaryByIds(
  tenant: string,
  ids: string[],
): Promise<Session[]> {
  if (ids.length === 0) return [];
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(sessions)
      .where(and(eq(sessions.workspaceSubdomain, subdomain), inArray(sessions.id, ids)));
    return hydrateSessionsListSummary(tx, subdomain, rows);
  });
}
