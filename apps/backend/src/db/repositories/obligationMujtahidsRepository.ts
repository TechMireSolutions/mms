import { eq } from 'drizzle-orm';
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
      .select()
      .from(mujtahids)
      .where(eq(mujtahids.workspaceSubdomain, subdomain));
    return rows.map(mujtahidRowToRecord);
  });
}

export async function bulkSaveMujtahids(tenant: string, records: Mujtahid[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    for (const record of records) {
      await tx
        .insert(mujtahids)
        .values({
          id: record.id,
          workspaceSubdomain: subdomain,
          name: record.name,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [mujtahids.workspaceSubdomain, mujtahids.id],
          set: {
            name: record.name,
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replaceMujtahidsForWorkspace(tenant: string, records: Mujtahid[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(mujtahids).where(eq(mujtahids.workspaceSubdomain, subdomain));
    for (const record of records) {
      await tx.insert(mujtahids).values({
        id: record.id,
        workspaceSubdomain: subdomain,
        name: record.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
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
      .select()
      .from(mujtahidReps)
      .where(eq(mujtahidReps.workspaceSubdomain, subdomain));
    return rows.map(mujtahidRepRowToRecord);
  });
}

export async function bulkSaveMujtahidReps(tenant: string, records: MujtahidRep[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    for (const record of records) {
      await tx
        .insert(mujtahidReps)
        .values({
          id: record.id,
          workspaceSubdomain: subdomain,
          name: record.name,
          mujtahidId: record.mujtahid_id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [mujtahidReps.workspaceSubdomain, mujtahidReps.id],
          set: {
            name: record.name,
            mujtahidId: record.mujtahid_id,
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replaceMujtahidRepsForWorkspace(tenant: string, records: MujtahidRep[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(mujtahidReps).where(eq(mujtahidReps.workspaceSubdomain, subdomain));
    for (const record of records) {
      await tx.insert(mujtahidReps).values({
        id: record.id,
        workspaceSubdomain: subdomain,
        name: record.name,
        mujtahidId: record.mujtahid_id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });
}
