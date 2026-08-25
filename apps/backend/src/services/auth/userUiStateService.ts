import { eq, and } from 'drizzle-orm';
import { getDb } from '../../db/dbClient.js';
import { userUiPreferences } from '../../db/schema/system.js';
import type { UserUiState, PatchUserUiStateBody } from '@mms/shared';

export async function getUserUiState(subdomain: string, userId: string): Promise<UserUiState> {
  const [record] = await getDb()
    .select({ state: userUiPreferences.state })
    .from(userUiPreferences)
    .where(
      and(
        eq(userUiPreferences.workspaceSubdomain, subdomain),
        eq(userUiPreferences.userId, userId)
      )
    );

  if (!record) {
    return {};
  }
  return record.state as UserUiState;
}

export async function patchUserUiState(
  subdomain: string,
  userId: string,
  patch: PatchUserUiStateBody
): Promise<UserUiState> {
  const currentState = await getUserUiState(subdomain, userId);
  
  const newState = {
    ...currentState,
    ...patch.state,
  };

  const [updatedRecord] = await getDb()
    .insert(userUiPreferences)
    .values({
      workspaceSubdomain: subdomain,
      userId,
      state: newState,
    })
    .onConflictDoUpdate({
      target: [userUiPreferences.workspaceSubdomain, userUiPreferences.userId],
      set: {
        state: newState,
        updatedAt: new Date(),
      },
    })
    .returning({ state: userUiPreferences.state });

  return updatedRecord.state as UserUiState;
}
