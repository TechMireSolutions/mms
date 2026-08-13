import { eq } from 'drizzle-orm';
import { getDb } from '../dbClient.js';
import { questionBankModulePreferences } from '../schema.js';
import type { QuestionBankModulePreferences } from '@mms/shared';

export async function replaceQuestionBankModulePreferencesForWorkspace(
  workspaceSubdomain: string,
  preferences: Partial<QuestionBankModulePreferences>
): Promise<void> {
  const db = getDb();
  await db
    .insert(questionBankModulePreferences)
    .values({
      workspaceSubdomain,
      preferences: preferences as never,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [questionBankModulePreferences.workspaceSubdomain],
      set: { 
        preferences: preferences as never,
        updatedAt: new Date(),
      },
    });
}

export async function getQuestionBankModulePreferencesForWorkspace(
  workspaceSubdomain: string
): Promise<Partial<QuestionBankModulePreferences> | null> {
  const db = getDb();
  const [row] = await db
    .select({ preferences: questionBankModulePreferences.preferences })
    .from(questionBankModulePreferences)
    .where(eq(questionBankModulePreferences.workspaceSubdomain, workspaceSubdomain))
    .limit(1);

  if (!row) {
    return null;
  }
  return row.preferences as Partial<QuestionBankModulePreferences>;
}

export async function listAllQuestionBankModulePreferencesByWorkspace(): Promise<
  Record<string, Partial<QuestionBankModulePreferences>>
> {
  const db = getDb();
  const rows = await db.select().from(questionBankModulePreferences);
  const result: Record<string, Partial<QuestionBankModulePreferences>> = {};
  for (const row of rows) {
    if (row.workspaceSubdomain) {
      result[row.workspaceSubdomain] = row.preferences as Partial<QuestionBankModulePreferences>;
    }
  }
  return result;
}
