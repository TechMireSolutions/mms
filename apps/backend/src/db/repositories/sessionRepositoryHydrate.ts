import { and, eq, inArray } from 'drizzle-orm';
import { type Session } from '@mms/shared';
import {
  type sessions,
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
import { type TenantTransaction } from '../tenant-context.js';
import { sessionRowToRecord } from './sessionRepositoryMappers.js';

export {
  listSessionsByWorkspace,
  findSessionById,
  findSessionsByIds,
  findSessionsSummaryByIds,
} from './sessionRepositoryQueries.js';

type Transaction = TenantTransaction;

export type SessionRow = typeof sessions.$inferSelect;

export async function hydrateSessionsList(
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
export async function hydrateSessionsListSummary(
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

