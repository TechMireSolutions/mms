import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import { type Session } from '@mms/shared';
import { randomUUID } from 'node:crypto';
import {
  sessions,
  enrollments,
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
import { mapAuditToInsert } from './repositoryMappers.js';

type Transaction = Parameters<Parameters<typeof withTenant>[1]>[0];

export function sessionWriteValues(
  subdomain: string,
  record: Session,
): typeof sessions.$inferInsert {
  return {
    id: String(record.id),
    workspaceSubdomain: subdomain,
    name: record.name,
    type: record.type || 'academic',
    status: record.status || 'active',
    startDate: record.startDate || '',
    endDate: record.endDate || '',
    baseFee: String(record.baseFee ?? 0),
    currency: record.currency ?? 'PKR',
    description: record.description ?? null,
    ...mapAuditToInsert(record),
  };
}

export function sessionUpdateSetValues(
  subdomain: string,
  record: Session,
) {
  const { id: _id, workspaceSubdomain: _subdomain, createdAt: _createdAt, ...setFields } = sessionWriteValues(subdomain, record);
  return setFields;
}

async function persistSessionTx(
  tx: Transaction,
  subdomain: string,
  record: Session,
): Promise<void> {
  const sessionId = String(record.id);

  // 1. Upsert session row
  await tx
    .insert(sessions)
    .values(sessionWriteValues(subdomain, record))
    .onConflictDoUpdate({
      target: [sessions.workspaceSubdomain, sessions.id],
      set: sessionUpdateSetValues(subdomain, record),
    });

  // 2. Persist Session Faculty
  await tx
    .delete(sessionFaculty)
    .where(and(eq(sessionFaculty.workspaceSubdomain, subdomain), eq(sessionFaculty.sessionId, sessionId)));

  if (record.faculty && record.faculty.length > 0) {
    await tx.insert(sessionFaculty).values(
      record.faculty.map((f) => ({
        id: f.id || randomUUID(),
        workspaceSubdomain: subdomain,
        sessionId,
        facultyId: f.facultyId,
        facultyName: f.facultyName || '',
        role: f.role || 'coordinator',
        status: f.status || 'active',
      })),
    );
  }

  // 3. Clear existing classes and class-level sub-tables
  const existingClasses = await tx
    .select({ id: sessionClasses.id })
    .from(sessionClasses)
    .where(and(eq(sessionClasses.workspaceSubdomain, subdomain), eq(sessionClasses.sessionId, sessionId)));

  const existingClassIds = existingClasses.map((c) => c.id);

  if (existingClassIds.length > 0) {
    const existingTimetables = await tx
      .select({ id: sessionClassTimetables.id })
      .from(sessionClassTimetables)
      .where(
        and(
          eq(sessionClassTimetables.workspaceSubdomain, subdomain),
          inArray(sessionClassTimetables.sessionClassId, existingClassIds),
        ),
      );
    const existingTimetableIds = existingTimetables.map((t) => t.id);

    if (existingTimetableIds.length > 0) {
      await tx
        .delete(sessionClassTimetablePeriods)
        .where(
          and(
            eq(sessionClassTimetablePeriods.workspaceSubdomain, subdomain),
            inArray(sessionClassTimetablePeriods.timetableId, existingTimetableIds),
          ),
        );
    }

    await Promise.all([
      tx.delete(sessionClassFees).where(and(eq(sessionClassFees.workspaceSubdomain, subdomain), inArray(sessionClassFees.sessionClassId, existingClassIds))),
      tx.delete(sessionClassSchedules).where(and(eq(sessionClassSchedules.workspaceSubdomain, subdomain), inArray(sessionClassSchedules.sessionClassId, existingClassIds))),
      tx.delete(sessionClassBudgets).where(and(eq(sessionClassBudgets.workspaceSubdomain, subdomain), inArray(sessionClassBudgets.sessionClassId, existingClassIds))),
      tx.delete(sessionClassDiscounts).where(and(eq(sessionClassDiscounts.workspaceSubdomain, subdomain), inArray(sessionClassDiscounts.sessionClassId, existingClassIds))),
      tx.delete(sessionClassTimetables).where(and(eq(sessionClassTimetables.workspaceSubdomain, subdomain), inArray(sessionClassTimetables.sessionClassId, existingClassIds))),
      tx.delete(sessionClassRefreshments).where(and(eq(sessionClassRefreshments.workspaceSubdomain, subdomain), inArray(sessionClassRefreshments.sessionClassId, existingClassIds))),
      tx.delete(sessionClassScholarships).where(and(eq(sessionClassScholarships.workspaceSubdomain, subdomain), inArray(sessionClassScholarships.sessionClassId, existingClassIds))),
    ]);

    await tx
      .delete(sessionClasses)
      .where(and(eq(sessionClasses.workspaceSubdomain, subdomain), eq(sessionClasses.sessionId, sessionId)));
  }

  // 4. Insert new classes and their sub-graphs
  if (record.classes && record.classes.length > 0) {
    const classInserts: Array<typeof sessionClasses.$inferInsert> = [];
    const feeInserts: Array<typeof sessionClassFees.$inferInsert> = [];
    const scheduleInserts: Array<typeof sessionClassSchedules.$inferInsert> = [];
    const budgetInserts: Array<typeof sessionClassBudgets.$inferInsert> = [];
    const discountInserts: Array<typeof sessionClassDiscounts.$inferInsert> = [];
    const refreshmentInserts: Array<typeof sessionClassRefreshments.$inferInsert> = [];
    const timetableInserts: Array<typeof sessionClassTimetables.$inferInsert> = [];
    const periodInserts: Array<typeof sessionClassTimetablePeriods.$inferInsert> = [];
    const scholarshipInserts: Array<typeof sessionClassScholarships.$inferInsert> = [];

    for (let idx = 0; idx < record.classes.length; idx++) {
      const c = record.classes[idx];
      const classId = c.id || randomUUID();

      classInserts.push({
        id: classId,
        workspaceSubdomain: subdomain,
        sessionId,
        name: c.name,
        gender: c.gender || 'mixed',
        ageCalculationDate: c.ageCalculationDate || '',
        ageMin: c.minAge ?? 4,
        ageMax: c.maxAge ?? 25,
        capacity: c.maxStudents ?? 30,
        enrolled: c.enrolled ?? 0,
        enrollmentDeadline: c.enrollmentDeadline || '',
        status: c.status || 'active',
        teacherId: c.teacherId || '',
        teacherName: c.teacherName || '',
        room: c.room || '',
        sortOrder: idx,
      });

      // Fees
      for (const fee of c.fees || []) {
        feeInserts.push({
          id: fee.id || randomUUID(),
          workspaceSubdomain: subdomain,
          sessionClassId: classId,
          feeType: fee.feeType,
          amount: String(fee.amount ?? 0),
        });
      }

      // Schedules
      for (const s of c.schedules || []) {
        scheduleInserts.push({
          id: s.id || randomUUID(),
          workspaceSubdomain: subdomain,
          sessionClassId: classId,
          scheduleType: s.scheduleType,
          startDate: s.startDate,
          endDate: s.endDate,
        });
      }

      // Budgets
      for (const b of c.budgets || []) {
        budgetInserts.push({
          id: b.id || randomUUID(),
          workspaceSubdomain: subdomain,
          sessionClassId: classId,
          budgetType: b.budgetType,
          detail: b.detail,
          amount: String(b.amount ?? 0),
        });
      }

      // Discounts
      for (const d of c.discounts || []) {
        discountInserts.push({
          id: d.id || randomUUID(),
          workspaceSubdomain: subdomain,
          sessionClassId: classId,
          discountType: d.discountType,
          percentage: String(d.percentage ?? 0),
          startDate: d.startDate || null,
          endDate: d.endDate || null,
          eligibilityCriteria: d.eligibilityCriteria || {},
          status: d.status || 'active',
        });
      }

      // Refreshments
      for (const r of c.refreshments || []) {
        refreshmentInserts.push({
          id: r.id || randomUUID(),
          workspaceSubdomain: subdomain,
          sessionClassId: classId,
          date: r.date,
          item: r.item,
          quantity: r.quantity ?? 1,
          pricePerUnit: String(r.pricePerUnit ?? 0),
          paidAmount: String(r.paidAmount ?? 0),
        });
      }

      // Timetables & Periods
      for (const t of c.timetables || []) {
        const timetableId = t.id || randomUUID();
        timetableInserts.push({
          id: timetableId,
          workspaceSubdomain: subdomain,
          sessionClassId: classId,
          date: t.date,
        });
        for (const p of t.periods || []) {
          periodInserts.push({
            id: p.id || randomUUID(),
            workspaceSubdomain: subdomain,
            timetableId,
            startTime: p.startTime,
            endTime: p.endTime,
            subject: p.subject,
            teacherId: p.teacherId || '',
            teacherName: p.teacherName || '',
          });
        }
      }

      // Scholarships
      for (const sc of c.scholarships || []) {
        let eligibilityId = sc.scholarshipEligibilityId;
        if (sc.eligibility) {
          eligibilityId = sc.eligibility.id || randomUUID();
          await tx
            .insert(scholarshipEligibilities)
            .values({
              id: eligibilityId,
              workspaceSubdomain: subdomain,
              orphan: sc.eligibility.orphan,
              job: sc.eligibility.job,
              business: sc.eligibility.business,
              property: sc.eligibility.property,
              familyMembers: sc.eligibility.familyMembers,
              onJobMembers: sc.eligibility.onJobMembers,
              schoolGoingSiblings: sc.eligibility.schoolGoingSiblings,
              residence: sc.eligibility.residence,
              notes: sc.eligibility.notes || null,
            })
            .onConflictDoUpdate({
              target: [scholarshipEligibilities.workspaceSubdomain, scholarshipEligibilities.id],
              set: {
                orphan: sc.eligibility.orphan,
                job: sc.eligibility.job,
                business: sc.eligibility.business,
                property: sc.eligibility.property,
                familyMembers: sc.eligibility.familyMembers,
                onJobMembers: sc.eligibility.onJobMembers,
                schoolGoingSiblings: sc.eligibility.schoolGoingSiblings,
                residence: sc.eligibility.residence,
                notes: sc.eligibility.notes || null,
              },
            });
        }

        scholarshipInserts.push({
          id: sc.id || randomUUID(),
          workspaceSubdomain: subdomain,
          sessionClassId: classId,
          scholarshipEligibilityId: eligibilityId || null,
          percentage: String(sc.percentage ?? 0),
          expiryDate: sc.expiryDate || '',
        });
      }
    }

    if (classInserts.length > 0) await tx.insert(sessionClasses).values(classInserts);
    if (feeInserts.length > 0) await tx.insert(sessionClassFees).values(feeInserts);
    if (scheduleInserts.length > 0) await tx.insert(sessionClassSchedules).values(scheduleInserts);
    if (budgetInserts.length > 0) await tx.insert(sessionClassBudgets).values(budgetInserts);
    if (discountInserts.length > 0) await tx.insert(sessionClassDiscounts).values(discountInserts);
    if (refreshmentInserts.length > 0) await tx.insert(sessionClassRefreshments).values(refreshmentInserts);
    if (timetableInserts.length > 0) await tx.insert(sessionClassTimetables).values(timetableInserts);
    if (periodInserts.length > 0) await tx.insert(sessionClassTimetablePeriods).values(periodInserts);
    if (scholarshipInserts.length > 0) await tx.insert(sessionClassScholarships).values(scholarshipInserts);
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

export async function softDeleteSessionWithCascade(
  tenant: string,
  sessionId: string,
  deletedBy?: string,
  deletionReason?: string,
): Promise<boolean> {
  const subdomain = tenant.trim().toLowerCase();
  const now = new Date();
  return withTenant(subdomain, async (tx) => {
    await tx
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        and(
          eq(sessions.workspaceSubdomain, subdomain),
          eq(sessions.id, sessionId),
          isNull(sessions.deletedAt),
        ),
      )
      .for('update');

    const sessionRes = await tx
      .update(sessions)
      .set({
        deletedAt: now,
        deletedBy: deletedBy || null,
        deletionReason: deletionReason || null,
        updatedAt: now,
      })
      .where(
        and(
          eq(sessions.workspaceSubdomain, subdomain),
          eq(sessions.id, sessionId),
          isNull(sessions.deletedAt),
        ),
      )
      .returning({ id: sessions.id });

    if (sessionRes.length === 0) {
      return false;
    }

    await tx
      .update(enrollments)
      .set({
        deletedAt: now,
        deletedBy: deletedBy || null,
        deletionReason: deletionReason ? `Cascade: parent session deleted (${deletionReason})` : 'Cascade: parent session deleted',
        deletedWithCascade: true,
        updatedAt: now,
      })
      .where(
        and(
          eq(enrollments.workspaceSubdomain, subdomain),
          eq(enrollments.sessionId, sessionId),
          isNull(enrollments.deletedAt),
        ),
      );

    return true;
  });
}

export async function restoreSessionWithCascade(
  tenant: string,
  sessionId: string,
  restoredBy?: string,
): Promise<boolean> {
  const subdomain = tenant.trim().toLowerCase();
  const now = new Date();
  return withTenant(subdomain, async (tx) => {
    await tx
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        and(
          eq(sessions.workspaceSubdomain, subdomain),
          eq(sessions.id, sessionId),
          isNotNull(sessions.deletedAt),
        ),
      )
      .for('update');

    const sessionRes = await tx
      .update(sessions)
      .set({
        deletedAt: null,
        deletedBy: null,
        deletionReason: null,
        restoredAt: now,
        restoredBy: restoredBy || null,
        updatedAt: now,
      })
      .where(
        and(
          eq(sessions.workspaceSubdomain, subdomain),
          eq(sessions.id, sessionId),
          isNotNull(sessions.deletedAt),
        ),
      )
      .returning({ id: sessions.id });

    if (sessionRes.length === 0) {
      return false;
    }

    await tx
      .update(enrollments)
      .set({
        deletedAt: null,
        deletedBy: null,
        deletionReason: null,
        restoredAt: now,
        restoredBy: restoredBy || null,
        deletedWithCascade: false,
        updatedAt: now,
      })
      .where(
        and(
          eq(enrollments.workspaceSubdomain, subdomain),
          eq(enrollments.sessionId, sessionId),
          isNotNull(enrollments.deletedAt),
          eq(enrollments.deletedWithCascade, true),
        ),
      );

    return true;
  });
}

export async function hardDeleteSession(tenant: string, sessionId: string): Promise<boolean> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    await tx.execute(sql`SET LOCAL app.allow_hard_purge = 'true'`);
    const res = await tx
      .delete(sessions)
      .where(and(eq(sessions.workspaceSubdomain, subdomain), eq(sessions.id, sessionId)))
      .returning({ id: sessions.id });
    return res.length > 0;
  });
}

export async function bulkDeleteSessions(
  tenant: string,
  sessionIds: string[],
  deletedBy?: string,
  deletionReason?: string,
): Promise<{ succeeded: number; failed: number }> {
  if (sessionIds.length === 0) return { succeeded: 0, failed: 0 };
  const subdomain = tenant.trim().toLowerCase();
  const now = new Date();
  return withTenant(subdomain, async (tx) => {
    const res = await tx
      .update(sessions)
      .set({
        deletedAt: now,
        deletedBy: deletedBy || null,
        deletionReason: deletionReason || null,
        updatedAt: now,
      })
      .where(
        and(
          eq(sessions.workspaceSubdomain, subdomain),
          inArray(sessions.id, sessionIds),
          isNull(sessions.deletedAt),
        ),
      )
      .returning({ id: sessions.id });

    const deletedIds = res.map((r) => r.id);
    if (deletedIds.length > 0) {
      await tx
        .update(enrollments)
        .set({
          deletedAt: now,
          deletedBy: deletedBy || null,
          deletionReason: deletionReason ? `Cascade: parent session deleted (${deletionReason})` : 'Cascade: parent session deleted',
          deletedWithCascade: true,
          updatedAt: now,
        })
        .where(
          and(
            eq(enrollments.workspaceSubdomain, subdomain),
            inArray(enrollments.sessionId, deletedIds),
            isNull(enrollments.deletedAt),
          ),
        );
    }

    const succeeded = res.length;
    const failed = Math.max(0, sessionIds.length - succeeded);
    return { succeeded, failed };
  });
}

export async function bulkRestoreSessions(
  tenant: string,
  sessionIds: string[],
  userId?: string,
): Promise<{ succeeded: number; failed: number }> {
  if (sessionIds.length === 0) return { succeeded: 0, failed: 0 };
  const subdomain = tenant.trim().toLowerCase();
  const now = new Date();
  return withTenant(subdomain, async (tx) => {
    const res = await tx
      .update(sessions)
      .set({
        deletedAt: null,
        deletedBy: null,
        deletionReason: null,
        restoredAt: now,
        restoredBy: userId || null,
        updatedAt: now,
      })
      .where(
        and(
          eq(sessions.workspaceSubdomain, subdomain),
          inArray(sessions.id, sessionIds),
          isNotNull(sessions.deletedAt),
        ),
      )
      .returning({ id: sessions.id });

    const restoredIds = res.map((r) => r.id);
    if (restoredIds.length > 0) {
      await tx
        .update(enrollments)
        .set({
          deletedAt: null,
          deletedBy: null,
          deletionReason: null,
          restoredAt: now,
          restoredBy: userId || null,
          deletedWithCascade: false,
          updatedAt: now,
        })
        .where(
          and(
            eq(enrollments.workspaceSubdomain, subdomain),
            inArray(enrollments.sessionId, restoredIds),
            isNotNull(enrollments.deletedAt),
            eq(enrollments.deletedWithCascade, true),
          ),
        );
    }

    const succeeded = res.length;
    const failed = Math.max(0, sessionIds.length - succeeded);
    return { succeeded, failed };
  });
}

export {
  bulkDeleteSessions as bulkSoftDeleteSessionsWithCascade,
  bulkRestoreSessions as bulkRestoreSessionsWithCascade,
};

