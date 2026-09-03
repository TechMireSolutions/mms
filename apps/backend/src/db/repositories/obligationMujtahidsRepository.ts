import { eq, sql } from 'drizzle-orm';
import { type Mujtahid, type MujtahidRep } from '@mms/shared';
import { mujtahids, mujtahidReps } from '../schema.js';
import { withTenant } from '../tenant-context.js';

type MujtahidRow = typeof mujtahids.$inferSelect;

export function mujtahidRowToRecord(row: MujtahidRow): Mujtahid {
  return {
    id: row.id,
    name: row.name,
  };
}

export async function listMujtahidsByWorkspace(tenant: string): Promise<Mujtahid[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: mujtahids.id,
        workspaceSubdomain: mujtahids.workspaceSubdomain,
        name: mujtahids.name,
        createdAt: mujtahids.createdAt,
        updatedAt: mujtahids.updatedAt,
      })
      .from(mujtahids)
      .where(eq(mujtahids.workspaceSubdomain, subdomain));
    return rows.map(mujtahidRowToRecord);
  });
}

export async function bulkSaveMujtahids(tenant: string, records: Mujtahid[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(mujtahids)
      .values(
        records.map((record) => ({
          id: record.id,
          workspaceSubdomain: subdomain,
          name: record.name,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      )
      .onConflictDoUpdate({
        target: [mujtahids.workspaceSubdomain, mujtahids.id],
        set: {
          name: sql`excluded.name`,
          updatedAt: new Date(),
        },
      });
  });
}

export async function replaceMujtahidsForWorkspace(tenant: string, records: Mujtahid[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(mujtahids).where(eq(mujtahids.workspaceSubdomain, subdomain));
    if (records.length > 0) {
      await tx.insert(mujtahids).values(
        records.map((record) => ({
          id: record.id,
          workspaceSubdomain: subdomain,
          name: record.name,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      );
    }
  });
}

type MujtahidRepRow = typeof mujtahidReps.$inferSelect;

export function mujtahidRepRowToRecord(row: MujtahidRepRow): MujtahidRep {
  return {
    id: row.id,
    name: row.name,
    mujtahid_id: row.mujtahidId,
  };
}

export async function listMujtahidRepsByWorkspace(tenant: string): Promise<MujtahidRep[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select({
        id: mujtahidReps.id,
        workspaceSubdomain: mujtahidReps.workspaceSubdomain,
        name: mujtahidReps.name,
        mujtahidId: mujtahidReps.mujtahidId,
        createdAt: mujtahidReps.createdAt,
        updatedAt: mujtahidReps.updatedAt,
      })
      .from(mujtahidReps)
      .where(eq(mujtahidReps.workspaceSubdomain, subdomain));
    return rows.map(mujtahidRepRowToRecord);
  });
}

export async function bulkSaveMujtahidReps(tenant: string, records: MujtahidRep[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(mujtahidReps)
      .values(
        records.map((record) => ({
          id: record.id,
          workspaceSubdomain: subdomain,
          name: record.name,
          mujtahidId: record.mujtahid_id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      )
      .onConflictDoUpdate({
        target: [mujtahidReps.workspaceSubdomain, mujtahidReps.id],
        set: {
          name: sql`excluded.name`,
          mujtahidId: sql`excluded.mujtahid_id`,
          updatedAt: new Date(),
        },
      });
  });
}

export async function replaceMujtahidRepsForWorkspace(tenant: string, records: MujtahidRep[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(mujtahidReps).where(eq(mujtahidReps.workspaceSubdomain, subdomain));
    if (records.length > 0) {
      await tx.insert(mujtahidReps).values(
        records.map((record) => ({
          id: record.id,
          workspaceSubdomain: subdomain,
          name: record.name,
          mujtahidId: record.mujtahid_id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      );
    }
  });
}
