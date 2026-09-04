import { and, eq, inArray, isNull } from 'drizzle-orm';
import type { Enrollment } from '@mms/shared';
import { enrollments, enrollmentTimelineEvents } from '../schema.js';
import { withTenant } from '../tenant-context.js';

type EnrollmentRow = typeof enrollments.$inferSelect;
type TimelineEventRow = typeof enrollmentTimelineEvents.$inferSelect;

export function enrollmentRowToRecord(
  row: EnrollmentRow,
  timelineEvents: TimelineEventRow[] = [],
): Enrollment {
  const enrollment: Enrollment = {
    id: row.id,
    studentId: row.studentId,
    studentName: row.studentName,
    sessionId: row.sessionId,
    sessionName: row.sessionName,
    classId: row.classId,
    className: row.className,
    enrolledDate: row.enrolledDate,
    baseFee: Number(row.baseFee ?? 0),
    discountType: row.discountType,
    discountLabel: row.discountLabel,
    discountPct: Number(row.discountPct ?? 0),
    discountAmt: Number(row.discountAmt ?? 0),
    finalFee: Number(row.finalFee ?? 0),
    status: row.status as Enrollment['status'],
    invoiceId: row.invoiceId ?? null,
    paymentStatus: row.paymentStatus as Enrollment['paymentStatus'],
    notes: row.notes,
    timeline: timelineEvents.map((t) => ({
      id: t.id,
      ts: t.ts,
      event: t.event,
      by: t.by,
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };

  if (row.deletedAt) enrollment.deletedAt = row.deletedAt.toISOString();
  if (row.deletedBy) enrollment.deletedBy = row.deletedBy;
  if (row.deletionReason) enrollment.deletionReason = row.deletionReason;

  return enrollment;
}

export async function listEnrollmentsByWorkspace(
  tenant: string,
  options?: { limit?: number; offset?: number },
): Promise<Enrollment[]> {
  const subdomain = tenant.trim().toLowerCase();
  const limit = Math.min(Math.max(options?.limit ?? 500, 1), 5000);
  const offset = Math.max(options?.offset ?? 0, 0);
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: enrollments.id,
        workspaceSubdomain: enrollments.workspaceSubdomain,
        studentId: enrollments.studentId,
        studentName: enrollments.studentName,
        sessionId: enrollments.sessionId,
        sessionName: enrollments.sessionName,
        classId: enrollments.classId,
        className: enrollments.className,
        enrolledDate: enrollments.enrolledDate,
        baseFee: enrollments.baseFee,
        discountType: enrollments.discountType,
        discountLabel: enrollments.discountLabel,
        discountPct: enrollments.discountPct,
        discountAmt: enrollments.discountAmt,
        finalFee: enrollments.finalFee,
        status: enrollments.status,
        invoiceId: enrollments.invoiceId,
        paymentStatus: enrollments.paymentStatus,
        notes: enrollments.notes,
        deletedAt: enrollments.deletedAt,
        deletedBy: enrollments.deletedBy,
        deletionReason: enrollments.deletionReason,
        createdAt: enrollments.createdAt,
        updatedAt: enrollments.updatedAt,
      })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.workspaceSubdomain, subdomain),
          isNull(enrollments.deletedAt),
        ),
      )
      .limit(limit)
      .offset(offset);

    if (rows.length === 0) return [];

    const timelineRows = await tx
      .select({
        id: enrollmentTimelineEvents.id,
        enrollmentId: enrollmentTimelineEvents.enrollmentId,
        ts: enrollmentTimelineEvents.ts,
        event: enrollmentTimelineEvents.event,
        by: enrollmentTimelineEvents.by,
      })
      .from(enrollmentTimelineEvents)
      .where(
        and(
          eq(enrollmentTimelineEvents.workspaceSubdomain, subdomain),
          inArray(enrollmentTimelineEvents.enrollmentId, rows.map((r) => r.id)),
        ),
      );

    const timelineMap = new Map<string, Array<{ id: number; enrollmentId: string; ts: string; event: string; by: string }>>();
    for (const t of timelineRows) {
      const arr = timelineMap.get(t.enrollmentId) ?? [];
      arr.push(t);
      timelineMap.set(t.enrollmentId, arr);
    }

    return rows.map((row) => enrollmentRowToRecord(row, (timelineMap.get(row.id) ?? []) as unknown as TimelineEventRow[]));
  });
}

export async function findEnrollmentById(
  tenant: string,
  id: string,
): Promise<Enrollment | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: enrollments.id,
        workspaceSubdomain: enrollments.workspaceSubdomain,
        studentId: enrollments.studentId,
        studentName: enrollments.studentName,
        sessionId: enrollments.sessionId,
        sessionName: enrollments.sessionName,
        classId: enrollments.classId,
        className: enrollments.className,
        enrolledDate: enrollments.enrolledDate,
        baseFee: enrollments.baseFee,
        discountType: enrollments.discountType,
        discountLabel: enrollments.discountLabel,
        discountPct: enrollments.discountPct,
        discountAmt: enrollments.discountAmt,
        finalFee: enrollments.finalFee,
        status: enrollments.status,
        invoiceId: enrollments.invoiceId,
        paymentStatus: enrollments.paymentStatus,
        notes: enrollments.notes,
        deletedAt: enrollments.deletedAt,
        deletedBy: enrollments.deletedBy,
        deletionReason: enrollments.deletionReason,
        createdAt: enrollments.createdAt,
        updatedAt: enrollments.updatedAt,
      })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.workspaceSubdomain, subdomain),
          eq(enrollments.id, id),
        ),
      );
    const row = rows[0];
    if (!row) return null;

    const timelineRows = await tx
      .select({
        id: enrollmentTimelineEvents.id,
        workspaceSubdomain: enrollmentTimelineEvents.workspaceSubdomain,
        enrollmentId: enrollmentTimelineEvents.enrollmentId,
        event: enrollmentTimelineEvents.event,
        by: enrollmentTimelineEvents.by,
        ts: enrollmentTimelineEvents.ts,
        createdAt: enrollmentTimelineEvents.createdAt,
      })
      .from(enrollmentTimelineEvents)
      .where(
        and(
          eq(enrollmentTimelineEvents.workspaceSubdomain, subdomain),
          eq(enrollmentTimelineEvents.enrollmentId, id),
        ),
      );

    return enrollmentRowToRecord(row, timelineRows);
  });
}

export async function findEnrollmentsByIds(
  tenant: string,
  ids: string[],
): Promise<Enrollment[]> {
  if (ids.length === 0) return [];
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: enrollments.id,
        workspaceSubdomain: enrollments.workspaceSubdomain,
        studentId: enrollments.studentId,
        studentName: enrollments.studentName,
        sessionId: enrollments.sessionId,
        sessionName: enrollments.sessionName,
        classId: enrollments.classId,
        className: enrollments.className,
        enrolledDate: enrollments.enrolledDate,
        baseFee: enrollments.baseFee,
        discountType: enrollments.discountType,
        discountLabel: enrollments.discountLabel,
        discountPct: enrollments.discountPct,
        discountAmt: enrollments.discountAmt,
        finalFee: enrollments.finalFee,
        status: enrollments.status,
        invoiceId: enrollments.invoiceId,
        paymentStatus: enrollments.paymentStatus,
        notes: enrollments.notes,
        deletedAt: enrollments.deletedAt,
        deletedBy: enrollments.deletedBy,
        deletionReason: enrollments.deletionReason,
        createdAt: enrollments.createdAt,
        updatedAt: enrollments.updatedAt,
      })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.workspaceSubdomain, subdomain),
          inArray(enrollments.id, ids),
        ),
      );

    if (rows.length === 0) return [];

    const timelineRows = await tx
      .select({
        id: enrollmentTimelineEvents.id,
        workspaceSubdomain: enrollmentTimelineEvents.workspaceSubdomain,
        enrollmentId: enrollmentTimelineEvents.enrollmentId,
        event: enrollmentTimelineEvents.event,
        by: enrollmentTimelineEvents.by,
        ts: enrollmentTimelineEvents.ts,
        createdAt: enrollmentTimelineEvents.createdAt,
      })
      .from(enrollmentTimelineEvents)
      .where(
        and(
          eq(enrollmentTimelineEvents.workspaceSubdomain, subdomain),
          inArray(enrollmentTimelineEvents.enrollmentId, ids),
        ),
      );

    const timelineMap = new Map<string, TimelineEventRow[]>();
    for (const t of timelineRows) {
      const arr = timelineMap.get(t.enrollmentId) ?? [];
      arr.push(t);
      timelineMap.set(t.enrollmentId, arr);
    }

    return rows.map((row) => enrollmentRowToRecord(row, timelineMap.get(row.id) ?? []));
  });
}
