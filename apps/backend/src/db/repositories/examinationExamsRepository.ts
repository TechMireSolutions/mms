import { and, eq, inArray, isNull } from 'drizzle-orm';
import { type Exam } from '@mms/shared';
import { exams, examClasses } from '../schema.js';
import { withTenant } from '../tenant-context.js';

type ExamRow = typeof exams.$inferSelect;

export function examRowToRecord(row: ExamRow, classIds: string[] = []): Exam {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    totalMarks: row.totalMarks,
    passingMarks: row.passingMarks,
    date: row.date,
    duration: row.duration,
    classIds,
    status: row.status as Exam['status'],
    description: row.description,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : undefined,
    deletedBy: row.deletedBy ?? undefined,
    deletionReason: row.deletionReason ?? undefined,
  };
}

export async function listExamsByWorkspace(tenant: string): Promise<Exam[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const examRows = await tx
      .select()
      .from(exams)
      .where(and(eq(exams.workspaceSubdomain, subdomain), isNull(exams.deletedAt)));

    if (examRows.length === 0) return [];

    const examIds = examRows.map((e) => e.id);
    const classRows = await tx
      .select()
      .from(examClasses)
      .where(
        and(
          eq(examClasses.workspaceSubdomain, subdomain),
          inArray(examClasses.examId, examIds),
        ),
      );

    const classMap = new Map<string, string[]>();
    for (const c of classRows) {
      const list = classMap.get(c.examId) ?? [];
      list.push(c.classId);
      classMap.set(c.examId, list);
    }

    return examRows.map((row) => examRowToRecord(row, classMap.get(row.id) ?? []));
  });
}

export async function findExamById(tenant: string, id: string): Promise<Exam | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(exams)
      .where(and(eq(exams.workspaceSubdomain, subdomain), eq(exams.id, id)));

    const row = rows[0];
    if (!row) return null;

    const classRows = await tx
      .select()
      .from(examClasses)
      .where(
        and(
          eq(examClasses.workspaceSubdomain, subdomain),
          eq(examClasses.examId, id),
        ),
      );

    return examRowToRecord(
      row,
      classRows.map((c) => c.classId),
    );
  });
}

export async function saveExam(tenant: string, record: Exam): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(exams)
      .values({
        id: record.id,
        workspaceSubdomain: subdomain,
        name: record.name,
        subject: record.subject ?? '',
        totalMarks: record.totalMarks ?? 100,
        passingMarks: record.passingMarks ?? 50,
        date: record.date,
        duration: record.duration ?? 60,
        status: record.status ?? 'upcoming',
        description: record.description ?? '',
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        deletedBy: record.deletedBy ?? null,
        deletionReason: record.deletionReason ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [exams.workspaceSubdomain, exams.id],
        set: {
          name: record.name,
          subject: record.subject ?? '',
          totalMarks: record.totalMarks ?? 100,
          passingMarks: record.passingMarks ?? 50,
          date: record.date,
          duration: record.duration ?? 60,
          status: record.status ?? 'upcoming',
          description: record.description ?? '',
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          updatedAt: new Date(),
        },
      });

    await tx
      .delete(examClasses)
      .where(
        and(
          eq(examClasses.workspaceSubdomain, subdomain),
          eq(examClasses.examId, record.id),
        ),
      );

    if (record.classIds && record.classIds.length > 0) {
      for (const classId of record.classIds) {
        if (classId) {
          await tx.insert(examClasses).values({
            workspaceSubdomain: subdomain,
            examId: record.id,
            classId,
          });
        }
      }
    }
  });
}

export async function bulkSaveExams(tenant: string, records: Exam[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    for (const r of records) {
      await tx
        .insert(exams)
        .values({
          id: r.id,
          workspaceSubdomain: subdomain,
          name: r.name,
          subject: r.subject ?? '',
          totalMarks: r.totalMarks ?? 100,
          passingMarks: r.passingMarks ?? 50,
          date: r.date,
          duration: r.duration ?? 60,
          status: r.status ?? 'upcoming',
          description: r.description ?? '',
          deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
          deletedBy: r.deletedBy ?? null,
          deletionReason: r.deletionReason ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [exams.workspaceSubdomain, exams.id],
          set: {
            name: r.name,
            subject: r.subject ?? '',
            totalMarks: r.totalMarks ?? 100,
            passingMarks: r.passingMarks ?? 50,
            date: r.date,
            duration: r.duration ?? 60,
            status: r.status ?? 'upcoming',
            description: r.description ?? '',
            deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
            deletedBy: r.deletedBy ?? null,
            deletionReason: r.deletionReason ?? null,
            updatedAt: new Date(),
          },
        });

      await tx
        .delete(examClasses)
        .where(
          and(
            eq(examClasses.workspaceSubdomain, subdomain),
            eq(examClasses.examId, r.id),
          ),
        );

      if (r.classIds && r.classIds.length > 0) {
        for (const classId of r.classIds) {
          if (classId) {
            await tx.insert(examClasses).values({
              workspaceSubdomain: subdomain,
              examId: r.id,
              classId,
            });
          }
        }
      }
    }
  });
}

export async function replaceExamsForWorkspace(tenant: string, records: Exam[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(examClasses).where(eq(examClasses.workspaceSubdomain, subdomain));
    await tx.delete(exams).where(eq(exams.workspaceSubdomain, subdomain));
    for (const r of records) {
      await tx.insert(exams).values({
        id: r.id,
        workspaceSubdomain: subdomain,
        name: r.name,
        subject: r.subject ?? '',
        totalMarks: r.totalMarks ?? 100,
        passingMarks: r.passingMarks ?? 50,
        date: r.date,
        duration: r.duration ?? 60,
        status: r.status ?? 'upcoming',
        description: r.description ?? '',
        deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
        deletedBy: r.deletedBy ?? null,
        deletionReason: r.deletionReason ?? null,
        updatedAt: new Date(),
      });

      if (r.classIds && r.classIds.length > 0) {
        for (const classId of r.classIds) {
          if (classId) {
            await tx.insert(examClasses).values({
              workspaceSubdomain: subdomain,
              examId: r.id,
              classId,
            });
          }
        }
      }
    }
  });
}
