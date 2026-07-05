import { and, eq, inArray, sql } from 'drizzle-orm';
import { applyTitleCaseRecursive } from '@mms/shared';
import { getDb } from '../dbClient.js';
import { sessions } from '../schema.js';
import type { SessionRecord } from '../../validation/sessionSchemas.js';

function rowToSession(row: typeof sessions.$inferSelect): SessionRecord {
  return {
    ...(row.customData as Omit<SessionRecord, 'id'>),
    id: row.id,
  } as SessionRecord;
}

export async function listSessionsByWorkspace(workspaceSubdomain: string): Promise<SessionRecord[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(sessions)
    .where(eq(sessions.workspaceSubdomain, subdomain));
  return rows.map(rowToSession);
}

export async function findSessionById(workspaceSubdomain: string, id: string): Promise<SessionRecord | null> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const rows = await getDb()
    .select()
    .from(sessions)
    .where(and(eq(sessions.workspaceSubdomain, subdomain), eq(sessions.id, id)));
  const row = rows[0];
  return row ? rowToSession(row) : null;
}

export async function findSessionsByIds(workspaceSubdomain: string, ids: string[]): Promise<SessionRecord[]> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  if (ids.length === 0) return [];
  const rows = await getDb()
    .select()
    .from(sessions)
    .where(and(eq(sessions.workspaceSubdomain, subdomain), inArray(sessions.id, ids)));
  return rows.map(rowToSession);
}

export async function saveSession(workspaceSubdomain: string, session: SessionRecord): Promise<void> {
  const processedSession = applyTitleCaseRecursive(session) as SessionRecord;
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const id = String(processedSession.id);
  const { id: _, ...extra } = processedSession;
  const db = getDb();

  const existing = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.workspaceSubdomain, subdomain), eq(sessions.id, id)));

  if (existing.length > 0) {
    await db
      .update(sessions)
      .set({
        customData: sql`COALESCE(${sessions.customData}, '{}'::jsonb) || ${JSON.stringify(extra)}::jsonb`,
        updatedAt: new Date(),
      })
      .where(and(eq(sessions.workspaceSubdomain, subdomain), eq(sessions.id, id)));
  } else {
    await db.insert(sessions).values({
      id,
      workspaceSubdomain: subdomain,
      customData: extra,
      updatedAt: new Date(),
    });
  }
}

export async function bulkSaveSessions(workspaceSubdomain: string, list: SessionRecord[]): Promise<void> {
  if (list.length === 0) return;
  const processedList = applyTitleCaseRecursive(list) as SessionRecord[];
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();

  const values = processedList.map((session) => {
    const id = String(session.id);
    const { id: _, ...extra } = session;
    return {
      id,
      workspaceSubdomain: subdomain,
      customData: extra,
      updatedAt: new Date(),
    };
  });

  await db
    .insert(sessions)
    .values(values)
    .onConflictDoUpdate({
      target: sessions.id,
      set: {
        customData: sql`COALESCE(${sessions.customData}, '{}'::jsonb) || excluded.custom_data`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
}

export async function deleteSession(workspaceSubdomain: string, id: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await getDb()
    .delete(sessions)
    .where(and(eq(sessions.workspaceSubdomain, subdomain), eq(sessions.id, id)));
}

export async function replaceSessionsForWorkspace(
  workspaceSubdomain: string,
  list: SessionRecord[],
): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  const db = getDb();

  await db.delete(sessions).where(eq(sessions.workspaceSubdomain, subdomain));

  if (list.length === 0) return;

  const values = list.map((session) => {
    const id = String(session.id);
    const { id: _, ...extra } = session;
    return {
      id,
      workspaceSubdomain: subdomain,
      customData: extra,
      updatedAt: new Date(),
    };
  });

  await db.insert(sessions).values(values);
}

export async function deleteSessionsByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await getDb()
    .delete(sessions)
    .where(eq(sessions.workspaceSubdomain, subdomain));
}
