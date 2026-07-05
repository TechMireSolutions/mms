import { eq } from 'drizzle-orm';
import {
  type QuestionBankQuestion,
  type QuestionBankTest,
  type QuestionBankResult,
} from '@mms/shared';
import { getDb } from '../dbClient.js';
import { questions, tests, assessmentResults } from '../schema.js';

// --- Helper row mappers ---
function rowToQuestion(row: typeof questions.$inferSelect): QuestionBankQuestion {
  return { ...(row.customData as Omit<QuestionBankQuestion, 'id'>), id: row.id } as QuestionBankQuestion;
}
function rowToTest(row: typeof tests.$inferSelect): QuestionBankTest {
  return { ...(row.customData as Omit<QuestionBankTest, 'id'>), id: row.id } as QuestionBankTest;
}
function rowToResult(row: typeof assessmentResults.$inferSelect): QuestionBankResult {
  return { ...(row.customData as Omit<QuestionBankResult, 'id'>), id: row.id } as QuestionBankResult;
}

// ==========================================
// 1. Questions
// ==========================================
export async function listQuestionsByWorkspace(workspaceSubdomain: string): Promise<QuestionBankQuestion[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(questions).where(eq(questions.workspaceSubdomain, subdomain));
  return rows.map(rowToQuestion);
}

export async function replaceQuestionsForWorkspace(workspaceSubdomain: string, list: QuestionBankQuestion[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(questions).where(eq(questions.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(questions).values(values);
}

// ==========================================
// 2. Tests
// ==========================================
export async function listTestsByWorkspace(workspaceSubdomain: string): Promise<QuestionBankTest[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(tests).where(eq(tests.workspaceSubdomain, subdomain));
  return rows.map(rowToTest);
}

export async function replaceTestsForWorkspace(workspaceSubdomain: string, list: QuestionBankTest[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(tests).where(eq(tests.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(tests).values(values);
}

// ==========================================
// 3. Assessment Results
// ==========================================
export async function listResultsByWorkspace(workspaceSubdomain: string): Promise<QuestionBankResult[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb().select().from(assessmentResults).where(eq(assessmentResults.workspaceSubdomain, subdomain));
  return rows.map(rowToResult);
}

export async function replaceResultsForWorkspace(workspaceSubdomain: string, list: QuestionBankResult[]): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(assessmentResults).where(eq(assessmentResults.workspaceSubdomain, subdomain));
  if (list.length === 0) return;
  const values = list.map((record) => {
    const id = String(record.id);
    const { id: _, ...extra } = record;
    return { id, workspaceSubdomain: subdomain, customData: extra, updatedAt: new Date() };
  });
  await db.insert(assessmentResults).values(values);
}

// ==========================================
// 4. Workspace Purge
// ==========================================
export async function deleteQuestionBankByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();
  await db.delete(questions).where(eq(questions.workspaceSubdomain, subdomain));
  await db.delete(tests).where(eq(tests.workspaceSubdomain, subdomain));
  await db.delete(assessmentResults).where(eq(assessmentResults.workspaceSubdomain, subdomain));
}
