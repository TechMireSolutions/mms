import { and, eq } from 'drizzle-orm';
import type { Enrollment, EnrollmentTimelineItem } from '@mms/shared';
import { enrollments, enrollmentTimelineEvents } from '../schema.js';
import { withTenant } from '../tenant-context.js';

type EnrollmentInsert = typeof enrollments.$inferInsert;

function recordToInsert(tenant: string, record: Enrollment): EnrollmentInsert {
  return {
    id: String(record.id),
    workspaceSubdomain: tenant.trim().toLowerCase(),
    studentId: String(record.studentId || ''),
    studentName: String(record.studentName || ''),
    sessionId: String(record.sessionId || ''),
    sessionName: String(record.sessionName || ''),
    classId: String(record.classId || ''),
    className: String(record.className || ''),
    enrolledDate: String(record.enrolledDate || ''),
    baseFee: String(record.baseFee ?? 0),
    discountType: String(record.discountType || 'none'),
    discountLabel: String(record.discountLabel || ''),
    discountPct: String(record.discountPct ?? 0),
    discountAmt: String(record.discountAmt ?? 0),
    finalFee: String(record.finalFee ?? 0),
    status: String(record.status || 'pending'),
    invoiceId: record.invoiceId ? String(record.invoiceId) : null,
    paymentStatus: String(record.paymentStatus || 'none'),
    notes: String(record.notes || ''),
    deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
    deletedBy: record.deletedBy ?? null,
    deletionReason: record.deletionReason ?? null,
    updatedAt: new Date(),
  };
}

async function writeTimelineEvents(
  tx: Parameters<Parameters<typeof withTenant>[1]>[0],
  subdomain: string,
  enrollmentId: string,
  timeline: EnrollmentTimelineItem[] | undefined,
): Promise<void> {
  if (!timeline || timeline.length === 0) return;
  await tx
    .delete(enrollmentTimelineEvents)
    .where(
      and(
        eq(enrollmentTimelineEvents.workspaceSubdomain, subdomain),
        eq(enrollmentTimelineEvents.enrollmentId, enrollmentId),
      ),
    );

  for (const item of timeline) {
    await tx.insert(enrollmentTimelineEvents).values({
      workspaceSubdomain: subdomain,
      enrollmentId,
      event: item.event,
      by: item.by,
      ts: item.ts,
    });
  }
}

export async function saveEnrollment(
  tenant: string,
  record: Enrollment,
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    const values = recordToInsert(subdomain, record);
    await tx
      .insert(enrollments)
      .values(values)
      .onConflictDoUpdate({
        target: [enrollments.workspaceSubdomain, enrollments.id],
        set: {
          studentId: values.studentId,
          studentName: values.studentName,
          sessionId: values.sessionId,
          sessionName: values.sessionName,
          classId: values.classId,
          className: values.className,
          enrolledDate: values.enrolledDate,
          baseFee: values.baseFee,
          discountType: values.discountType,
          discountLabel: values.discountLabel,
          discountPct: values.discountPct,
          discountAmt: values.discountAmt,
          finalFee: values.finalFee,
          status: values.status,
          invoiceId: values.invoiceId,
          paymentStatus: values.paymentStatus,
          notes: values.notes,
          deletedAt: values.deletedAt,
          deletedBy: values.deletedBy,
          deletionReason: values.deletionReason,
          updatedAt: new Date(),
        },
      });

    await writeTimelineEvents(tx, subdomain, record.id, record.timeline);
  });
}

export async function bulkSaveEnrollments(
  tenant: string,
  records: Enrollment[],
): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    for (const record of records) {
      const values = recordToInsert(subdomain, record);
      await tx
        .insert(enrollments)
        .values(values)
        .onConflictDoUpdate({
          target: [enrollments.workspaceSubdomain, enrollments.id],
          set: {
            studentId: values.studentId,
            studentName: values.studentName,
            sessionId: values.sessionId,
            sessionName: values.sessionName,
            classId: values.classId,
            className: values.className,
            enrolledDate: values.enrolledDate,
            baseFee: values.baseFee,
            discountType: values.discountType,
            discountLabel: values.discountLabel,
            discountPct: values.discountPct,
            discountAmt: values.discountAmt,
            finalFee: values.finalFee,
            status: values.status,
            invoiceId: values.invoiceId,
            paymentStatus: values.paymentStatus,
            notes: values.notes,
            deletedAt: values.deletedAt,
            deletedBy: values.deletedBy,
            deletionReason: values.deletionReason,
            updatedAt: new Date(),
          },
        });
      await writeTimelineEvents(tx, subdomain, record.id, record.timeline);
    }
  });
}

export async function replaceEnrollmentsForWorkspace(
  tenant: string,
  records: Enrollment[],
): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(enrollmentTimelineEvents).where(eq(enrollmentTimelineEvents.workspaceSubdomain, subdomain));
    await tx.delete(enrollments).where(eq(enrollments.workspaceSubdomain, subdomain));
    if (records.length > 0) {
      for (const record of records) {
        const values = recordToInsert(subdomain, record);
        await tx.insert(enrollments).values(values);
        await writeTimelineEvents(tx, subdomain, record.id, record.timeline);
      }
    }
  });
}
