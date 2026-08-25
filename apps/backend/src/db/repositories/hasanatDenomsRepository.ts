import { eq } from 'drizzle-orm';
import { type Denomination } from '@mms/shared';
import { hasanatDenoms } from '../schema.js';
import { withTenant } from '../tenant-context.js';

type DenomRow = typeof hasanatDenoms.$inferSelect;
function denomRowToRecord(row: DenomRow): Denomination {
  return {
    id: row.id,
    name: row.name,
    points: row.points,
    color: row.color,
    description: row.description,
    icon: row.icon,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listDenomsByWorkspace(tenant: string): Promise<Denomination[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(hasanatDenoms)
      .where(eq(hasanatDenoms.workspaceSubdomain, subdomain));
    return rows.map(denomRowToRecord);
  });
}

export async function bulkSaveDenoms(tenant: string, records: Denomination[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    for (const r of records) {
      await tx
        .insert(hasanatDenoms)
        .values({
          id: r.id,
          workspaceSubdomain: subdomain,
          name: r.name,
          points: r.points,
          color: r.color ?? 'emerald',
          description: r.description ?? '',
          icon: r.icon ?? 'Star',
          active: r.active ?? true,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [hasanatDenoms.workspaceSubdomain, hasanatDenoms.id],
          set: {
            name: r.name,
            points: r.points,
            color: r.color ?? 'emerald',
            description: r.description ?? '',
            icon: r.icon ?? 'Star',
            active: r.active ?? true,
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replaceDenomsForWorkspace(tenant: string, records: Denomination[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(hasanatDenoms).where(eq(hasanatDenoms.workspaceSubdomain, subdomain));
    for (const r of records) {
      await tx.insert(hasanatDenoms).values({
        id: r.id,
        workspaceSubdomain: subdomain,
        name: r.name,
        points: r.points,
        color: r.color ?? 'emerald',
        description: r.description ?? '',
        icon: r.icon ?? 'Star',
        active: r.active ?? true,
        updatedAt: new Date(),
      });
    }
  });
}
