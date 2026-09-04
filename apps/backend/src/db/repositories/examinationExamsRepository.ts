import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { type Exam } from '@mms/shared';
import { exams, examClasses } from '../schema.js';
import { withTenant } from '../tenant-context.js';

type ExamRow = typeof exams.$inferSelect;

export function examRowToRecord(row: ExamRow, classIds: string[] = []): Exam {
  const exam: Exam = {
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
  };

  if (row.deletedAt) exam.deletedAt = row.deletedAt.toISOString();
  if (row.deletedBy) exam.deletedBy = row.deletedBy;
  if (row.deletionReason) exam.deletionReason = row.deletionReason;

  return exam;
}

export async function listExamsByWorkspace(tenant: string, options?: { limit?: number; offset?: number }): Promise<Exam[]> {
  const subdomain = tenant.trim().toLowerCase();
  const limit = Math.min(Math.max(options?.limit ?? 500, 1), 5000);
  const offset = Math.max(options?.offset ?? 0, 0);
  return withTenant(subdomain, async (tx) => {
    const examRows = await tx
      .select({
        id: exams.id,
        workspaceSubdomain: exams.workspaceSubdomain,
        name: exams.name,
        subject: exams.subject,
        totalMarks: exams.totalMarks,
        passingMarks: exams.passingMarks,
        date: exams.date,
        duration: exams.duration,
        status: exams.status,
        description: exams.description,
        deletedAt: exams.deletedAt,
        deletedBy: exams.deletedBy,
        deletionReason: exams.deletionReason,
        createdAt: exams.createdAt,
        updatedAt: exams.updatedAt,
      })
      .from(exams)
      .where(and(eq(exams.workspaceSubdomain, subdomain), isNull(exams.deletedAt)))
      .limit(limit)
      .offset(offset);

    if (examRows.length === 0) return [];

    const examIds = examRows.map((e) => e.id);
    const classRows = await tx
      .select({
        examId: examClasses.examId,
        classId: examClasses.classId,
      })
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
      .select({
        id: exams.id,
        workspaceSubdomain: exams.workspaceSubdomain,
        name: exams.name,
        subject: exams.subject,
        totalMarks: exams.totalMarks,
        passingMarks: exams.passingMarks,
        date: exams.date,
        duration: exams.duration,
        status: exams.status,
        description: exams.description,
        deletedAt: exams.deletedAt,
        deletedBy: exams.deletedBy,
        deletionReason: exams.deletionReason,
        createdAt: exams.createdAt,
        updatedAt: exams.updatedAt,
      })
      .from(exams)
      .where(and(eq(exams.workspaceSubdomain, subdomain), eq(exams.id, id)))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    const classRows = await tx
      .select({
        examId: examClasses.examId,
        classId: examClasses.classId,
      })
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

    const validClassIds = (record.classIds ?? []).filter(Boolean);
    if (validClassIds.length > 0) {
      await tx.insert(examClasses).values(
        validClassIds.map((classId) => ({
          workspaceSubdomain: subdomain,
          examId: record.id,
          classId,
        })),
      );
    }
  });
}

export async function bulkSaveExams(tenant: string, records: Exam[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(exams)
      .values(
        records.map((r) => ({
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
        })),
      )
      .onConflictDoUpdate({
        target: [exams.workspaceSubdomain, exams.id],
        set: {
          name: sql`excluded.name`,
          subject: sql`excluded.subject`,
          totalMarks: sql`excluded.total_marks`,
          passingMarks: sql`excluded.passing_marks`,
          date: sql`excluded.date`,
          duration: sql`excluded.duration`,
          status: sql`excluded.status`,
          description: sql`excluded.description`,
          deletedAt: sql`excluded.deleted_at`,
          deletedBy: sql`excluded.deleted_by`,
          deletionReason: sql`excluded.deletion_reason`,
          updatedAt: new Date(),
        },
      });

    const examIds = records.map((r) => r.id);
    await tx
      .delete(examClasses)
      .where(
        and(
          eq(examClasses.workspaceSubdomain, subdomain),
          inArray(examClasses.examId, examIds),
        ),
      );

    const classPairs: Array<{
      workspaceSubdomain: string;
      examId: string;
      classId: string;
    }> = [];
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const classIds = r?.classIds;
      if (classIds) {
        for (let j = 0; j < classIds.length; j++) {
          const classId = classIds[j];
          if (classId) {
            classPairs.push({
              workspaceSubdomain: subdomain,
              examId: r.id,
              classId,
            });
          }
        }
      }
    }
    if (classPairs.length > 0) {
      await tx.insert(examClasses).values(classPairs);
    }
  });
}

export async function replaceExamsForWorkspace(tenant: string, records: Exam[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(examClasses).where(eq(examClasses.workspaceSubdomain, subdomain));
    await tx.delete(exams).where(eq(exams.workspaceSubdomain, subdomain));
    if (records.length > 0) {
      await tx.insert(exams).values(
        records.map((r) => ({
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
        })),
      );

      const classPairs: Array<{
        workspaceSubdomain: string;
        examId: string;
        classId: string;
      }> = [];
      for (let i = 0; i < records.length; i++) {
        const r = records[i];
        const classIds = r?.classIds;
        if (classIds) {
          for (let j = 0; j < classIds.length; j++) {
            const classId = classIds[j];
            if (classId) {
              classPairs.push({
                workspaceSubdomain: subdomain,
                examId: r.id,
                classId,
              });
            }
          }
        }
      }
      if (classPairs.length > 0) {
        await tx.insert(examClasses).values(classPairs);
      }
    }
  });
}
