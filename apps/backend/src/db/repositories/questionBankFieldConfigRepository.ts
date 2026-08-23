import { eq } from 'drizzle-orm';
import { withTenant } from '../tenant-context.js';
import { questionBankFieldConfigs } from '../schema.js';
import type { QuestionBankSettings } from '@mms/shared';

export async function replaceQuestionBankFieldConfigsForWorkspace(
  workspaceSubdomain: string,
  config: Partial<QuestionBankSettings>
): Promise<void> {
  await withTenant(workspaceSubdomain, async (tx) => {
    await tx
      .insert(questionBankFieldConfigs)
      .values({
        workspaceSubdomain,
        config: config as never,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [questionBankFieldConfigs.workspaceSubdomain],
        set: { 
          config: config as never,
          updatedAt: new Date(),
        },
      });
  });
}

export async function getQuestionBankFieldConfigsForWorkspace(
  workspaceSubdomain: string
): Promise<Partial<QuestionBankSettings> | null> {
  return await withTenant(workspaceSubdomain, async (tx) => {
    const [row] = await tx
      .select({ config: questionBankFieldConfigs.config })
      .from(questionBankFieldConfigs)
      .where(eq(questionBankFieldConfigs.workspaceSubdomain, workspaceSubdomain))
      .limit(1);

    if (!row) {
      return null;
    }
    return row.config as Partial<QuestionBankSettings>;
  });
}

export async function listAllQuestionBankFieldConfigsByWorkspace(): Promise<
  Record<string, Partial<QuestionBankSettings>>
> {
  return await withTenant(null, async (tx) => {
    const rows = await tx.select().from(questionBankFieldConfigs);
    const result: Record<string, Partial<QuestionBankSettings>> = {};
    for (const row of rows) {
      if (row.workspaceSubdomain) {
        result[row.workspaceSubdomain] = row.config as Partial<QuestionBankSettings>;
      }
    }
    return result;
  });
}
