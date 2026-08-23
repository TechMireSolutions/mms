import { and, eq, inArray, isNull } from 'drizzle-orm';
import { type Account, type JournalEntry, type FiscalYear } from '@mms/shared';
import {
  accountingAccounts,
  accountingEntries,
  accountingFiscalYears,
  accountingJournalLines,
  accountingEntryTags,
  accountingEntryAttachments,
} from '../schema.js';
import { withTenant } from '../tenant-context.js';

// --- Accounts ---

type AccountRow = typeof accountingAccounts.$inferSelect;

export function accountRowToRecord(row: AccountRow): Account {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type as Account['type'],
    subtype: row.subtype,
    description: row.description,
    isActive: row.isActive,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : undefined,
    deletedBy: row.deletedBy ?? undefined,
    deletionReason: row.deletionReason ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listAccountsByWorkspace(tenant: string): Promise<Account[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(accountingAccounts)
      .where(and(eq(accountingAccounts.workspaceSubdomain, subdomain), isNull(accountingAccounts.deletedAt)));
    return rows.map(accountRowToRecord);
  });
}

export async function findAccountById(tenant: string, id: string): Promise<Account | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(accountingAccounts)
      .where(and(eq(accountingAccounts.workspaceSubdomain, subdomain), eq(accountingAccounts.id, id)));
    const row = rows[0];
    return row ? accountRowToRecord(row) : null;
  });
}

export async function saveAccount(tenant: string, record: Account): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(accountingAccounts)
      .values({
        id: record.id,
        workspaceSubdomain: subdomain,
        code: record.code,
        name: record.name,
        type: record.type,
        subtype: record.subtype ?? '',
        description: record.description ?? '',
        isActive: record.isActive ?? true,
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        deletedBy: record.deletedBy ?? null,
        deletionReason: record.deletionReason ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [accountingAccounts.workspaceSubdomain, accountingAccounts.id],
        set: {
          code: record.code,
          name: record.name,
          type: record.type,
          subtype: record.subtype ?? '',
          description: record.description ?? '',
          isActive: record.isActive ?? true,
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          updatedAt: new Date(),
        },
      });
  });
}

export async function bulkSaveAccounts(tenant: string, records: Account[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    for (const r of records) {
      await tx
        .insert(accountingAccounts)
        .values({
          id: r.id,
          workspaceSubdomain: subdomain,
          code: r.code,
          name: r.name,
          type: r.type,
          subtype: r.subtype ?? '',
          description: r.description ?? '',
          isActive: r.isActive ?? true,
          deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
          deletedBy: r.deletedBy ?? null,
          deletionReason: r.deletionReason ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [accountingAccounts.workspaceSubdomain, accountingAccounts.id],
          set: {
            code: r.code,
            name: r.name,
            type: r.type,
            subtype: r.subtype ?? '',
            description: r.description ?? '',
            isActive: r.isActive ?? true,
            deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
            deletedBy: r.deletedBy ?? null,
            deletionReason: r.deletionReason ?? null,
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replaceAccountsForWorkspace(tenant: string, records: Account[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(accountingAccounts).where(eq(accountingAccounts.workspaceSubdomain, subdomain));
    for (const r of records) {
      await tx.insert(accountingAccounts).values({
        id: r.id,
        workspaceSubdomain: subdomain,
        code: r.code,
        name: r.name,
        type: r.type,
        subtype: r.subtype ?? '',
        description: r.description ?? '',
        isActive: r.isActive ?? true,
        deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
        deletedBy: r.deletedBy ?? null,
        deletionReason: r.deletionReason ?? null,
        updatedAt: new Date(),
      });
    }
  });
}

// --- Fiscal Years ---

type FiscalYearRow = typeof accountingFiscalYears.$inferSelect;

export function fiscalYearRowToRecord(row: FiscalYearRow): FiscalYear {
  return {
    id: row.id,
    label: row.label,
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status as FiscalYear['status'],
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : undefined,
    deletedBy: row.deletedBy ?? undefined,
    deletionReason: row.deletionReason ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listFiscalYearsByWorkspace(tenant: string): Promise<FiscalYear[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(accountingFiscalYears)
      .where(and(eq(accountingFiscalYears.workspaceSubdomain, subdomain), isNull(accountingFiscalYears.deletedAt)));
    return rows.map(fiscalYearRowToRecord);
  });
}

export async function findFiscalYearById(tenant: string, id: string): Promise<FiscalYear | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(accountingFiscalYears)
      .where(and(eq(accountingFiscalYears.workspaceSubdomain, subdomain), eq(accountingFiscalYears.id, id)));
    const row = rows[0];
    return row ? fiscalYearRowToRecord(row) : null;
  });
}

export async function saveFiscalYear(tenant: string, record: FiscalYear): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(accountingFiscalYears)
      .values({
        id: record.id,
        workspaceSubdomain: subdomain,
        label: record.label,
        startDate: record.startDate,
        endDate: record.endDate,
        status: record.status ?? 'upcoming',
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        deletedBy: record.deletedBy ?? null,
        deletionReason: record.deletionReason ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [accountingFiscalYears.workspaceSubdomain, accountingFiscalYears.id],
        set: {
          label: record.label,
          startDate: record.startDate,
          endDate: record.endDate,
          status: record.status ?? 'upcoming',
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          updatedAt: new Date(),
        },
      });
  });
}

export async function bulkSaveFiscalYears(tenant: string, records: FiscalYear[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    for (const r of records) {
      await tx
        .insert(accountingFiscalYears)
        .values({
          id: r.id,
          workspaceSubdomain: subdomain,
          label: r.label,
          startDate: r.startDate,
          endDate: r.endDate,
          status: r.status ?? 'upcoming',
          deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
          deletedBy: r.deletedBy ?? null,
          deletionReason: r.deletionReason ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [accountingFiscalYears.workspaceSubdomain, accountingFiscalYears.id],
          set: {
            label: r.label,
            startDate: r.startDate,
            endDate: r.endDate,
            status: r.status ?? 'upcoming',
            deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
            deletedBy: r.deletedBy ?? null,
            deletionReason: r.deletionReason ?? null,
            updatedAt: new Date(),
          },
        });
    }
  });
}

export async function replaceFiscalYearsForWorkspace(tenant: string, records: FiscalYear[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(accountingFiscalYears).where(eq(accountingFiscalYears.workspaceSubdomain, subdomain));
    for (const r of records) {
      await tx.insert(accountingFiscalYears).values({
        id: r.id,
        workspaceSubdomain: subdomain,
        label: r.label,
        startDate: r.startDate,
        endDate: r.endDate,
        status: r.status ?? 'upcoming',
        deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
        deletedBy: r.deletedBy ?? null,
        deletionReason: r.deletionReason ?? null,
        updatedAt: new Date(),
      });
    }
  });
}

// --- Journal Entries & Lines ---

type EntryRow = typeof accountingEntries.$inferSelect;

export function entryRowToRecord(
  row: EntryRow,
  lines: Array<typeof accountingJournalLines.$inferSelect> = [],
  tags: string[] = [],
  attachments: string[] = [],
): JournalEntry {
  return {
    id: row.id,
    date: row.date,
    ref: row.ref,
    description: row.description,
    status: row.status as JournalEntry['status'],
    created_by: row.createdBy,
    fiscal_year: row.fiscalYear,
    transaction_type: row.transactionType ?? undefined,
    reversed_ref: row.reversedRef ?? undefined,
    simple_mode: row.simpleMode,
    lines: lines.map((l) => ({
      id: l.id,
      account_id: l.accountId,
      debit: Number(l.debit ?? 0),
      credit: Number(l.credit ?? 0),
      description: l.description,
    })),
    tags,
    attachments,
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : undefined,
    deletedBy: row.deletedBy ?? undefined,
    deletionReason: row.deletionReason ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listEntriesByWorkspace(tenant: string): Promise<JournalEntry[]> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(accountingEntries)
      .where(and(eq(accountingEntries.workspaceSubdomain, subdomain), isNull(accountingEntries.deletedAt)));
    if (rows.length === 0) return [];

    const entryIds = rows.map((r) => r.id);
    const [allLines, allTags, allAttachments] = await Promise.all([
      tx
        .select()
        .from(accountingJournalLines)
        .where(
          and(
            eq(accountingJournalLines.workspaceSubdomain, subdomain),
            inArray(accountingJournalLines.entryId, entryIds),
          ),
        ),
      tx
        .select()
        .from(accountingEntryTags)
        .where(
          and(
            eq(accountingEntryTags.workspaceSubdomain, subdomain),
            inArray(accountingEntryTags.entryId, entryIds),
          ),
        ),
      tx
        .select()
        .from(accountingEntryAttachments)
        .where(
          and(
            eq(accountingEntryAttachments.workspaceSubdomain, subdomain),
            inArray(accountingEntryAttachments.entryId, entryIds),
          ),
        ),
    ]);

    const linesByEntry = new Map<string, Array<typeof accountingJournalLines.$inferSelect>>();
    for (const line of allLines) {
      const arr = linesByEntry.get(line.entryId) ?? [];
      arr.push(line);
      linesByEntry.set(line.entryId, arr);
    }

    const tagsByEntry = new Map<string, string[]>();
    for (const t of allTags) {
      const arr = tagsByEntry.get(t.entryId) ?? [];
      arr.push(t.tag);
      tagsByEntry.set(t.entryId, arr);
    }

    const attachmentsByEntry = new Map<string, string[]>();
    for (const a of allAttachments) {
      const arr = attachmentsByEntry.get(a.entryId) ?? [];
      arr.push(a.url);
      attachmentsByEntry.set(a.entryId, arr);
    }

    return rows.map((r) =>
      entryRowToRecord(
        r,
        linesByEntry.get(r.id) ?? [],
        tagsByEntry.get(r.id) ?? [],
        attachmentsByEntry.get(r.id) ?? [],
      ),
    );
  });
}

export async function findEntryById(tenant: string, id: string): Promise<JournalEntry | null> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenant(subdomain, async (tx) => {
    const rows = await tx
      .select()
      .from(accountingEntries)
      .where(and(eq(accountingEntries.workspaceSubdomain, subdomain), eq(accountingEntries.id, id)));
    const row = rows[0];
    if (!row) return null;

    const [lines, tags, attachments] = await Promise.all([
      tx
        .select()
        .from(accountingJournalLines)
        .where(
          and(
            eq(accountingJournalLines.workspaceSubdomain, subdomain),
            eq(accountingJournalLines.entryId, id),
          ),
        ),
      tx
        .select()
        .from(accountingEntryTags)
        .where(
          and(
            eq(accountingEntryTags.workspaceSubdomain, subdomain),
            eq(accountingEntryTags.entryId, id),
          ),
        ),
      tx
        .select()
        .from(accountingEntryAttachments)
        .where(
          and(
            eq(accountingEntryAttachments.workspaceSubdomain, subdomain),
            eq(accountingEntryAttachments.entryId, id),
          ),
        ),
    ]);

    return entryRowToRecord(
      row,
      lines,
      tags.map((t) => t.tag),
      attachments.map((a) => a.url),
    );
  });
}

async function syncEntryChildren(
  tx: Parameters<Parameters<typeof withTenant>[1]>[0],
  subdomain: string,
  entry: JournalEntry,
): Promise<void> {
  // Delete existing lines, tags, attachments
  await Promise.all([
    tx
      .delete(accountingJournalLines)
      .where(
        and(
          eq(accountingJournalLines.workspaceSubdomain, subdomain),
          eq(accountingJournalLines.entryId, entry.id),
        ),
      ),
    tx
      .delete(accountingEntryTags)
      .where(
        and(
          eq(accountingEntryTags.workspaceSubdomain, subdomain),
          eq(accountingEntryTags.entryId, entry.id),
        ),
      ),
    tx
      .delete(accountingEntryAttachments)
      .where(
        and(
          eq(accountingEntryAttachments.workspaceSubdomain, subdomain),
          eq(accountingEntryAttachments.entryId, entry.id),
        ),
      ),
  ]);

  // Insert lines
  if (entry.lines && entry.lines.length > 0) {
    for (const l of entry.lines) {
      await tx.insert(accountingJournalLines).values({
        id: l.id,
        workspaceSubdomain: subdomain,
        entryId: entry.id,
        accountId: l.account_id,
        debit: String(l.debit ?? 0),
        credit: String(l.credit ?? 0),
        description: l.description ?? '',
      });
    }
  }

  // Insert tags
  if (entry.tags && entry.tags.length > 0) {
    for (const tag of entry.tags) {
      await tx.insert(accountingEntryTags).values({
        workspaceSubdomain: subdomain,
        entryId: entry.id,
        tag,
      });
    }
  }

  // Insert attachments
  if (entry.attachments && entry.attachments.length > 0) {
    for (const url of entry.attachments) {
      await tx.insert(accountingEntryAttachments).values({
        workspaceSubdomain: subdomain,
        entryId: entry.id,
        url,
      });
    }
  }
}

export async function saveEntry(tenant: string, record: JournalEntry): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx
      .insert(accountingEntries)
      .values({
        id: record.id,
        workspaceSubdomain: subdomain,
        date: record.date,
        ref: record.ref ?? '',
        description: record.description ?? '',
        status: record.status ?? 'posted',
        createdBy: record.created_by ?? '',
        fiscalYear: record.fiscal_year ?? '',
        transactionType: record.transaction_type ?? null,
        reversedRef: record.reversed_ref ?? null,
        simpleMode: record.simple_mode ?? false,
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        deletedBy: record.deletedBy ?? null,
        deletionReason: record.deletionReason ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [accountingEntries.workspaceSubdomain, accountingEntries.id],
        set: {
          date: record.date,
          ref: record.ref ?? '',
          description: record.description ?? '',
          status: record.status ?? 'posted',
          createdBy: record.created_by ?? '',
          fiscalYear: record.fiscal_year ?? '',
          transactionType: record.transaction_type ?? null,
          reversedRef: record.reversed_ref ?? null,
          simpleMode: record.simple_mode ?? false,
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          updatedAt: new Date(),
        },
      });

    await syncEntryChildren(tx, subdomain, record);
  });
}

export async function bulkSaveEntries(tenant: string, records: JournalEntry[]): Promise<void> {
  if (records.length === 0) return;
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    for (const record of records) {
      await tx
        .insert(accountingEntries)
        .values({
          id: record.id,
          workspaceSubdomain: subdomain,
          date: record.date,
          ref: record.ref ?? '',
          description: record.description ?? '',
          status: record.status ?? 'posted',
          createdBy: record.created_by ?? '',
          fiscalYear: record.fiscal_year ?? '',
          transactionType: record.transaction_type ?? null,
          reversedRef: record.reversed_ref ?? null,
          simpleMode: record.simple_mode ?? false,
          deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
          deletedBy: record.deletedBy ?? null,
          deletionReason: record.deletionReason ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [accountingEntries.workspaceSubdomain, accountingEntries.id],
          set: {
            date: record.date,
            ref: record.ref ?? '',
            description: record.description ?? '',
            status: record.status ?? 'posted',
            createdBy: record.created_by ?? '',
            fiscalYear: record.fiscal_year ?? '',
            transactionType: record.transaction_type ?? null,
            reversedRef: record.reversed_ref ?? null,
            simpleMode: record.simple_mode ?? false,
            deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
            deletedBy: record.deletedBy ?? null,
            deletionReason: record.deletionReason ?? null,
            updatedAt: new Date(),
          },
        });

      await syncEntryChildren(tx, subdomain, record);
    }
  });
}

export async function replaceEntriesForWorkspace(tenant: string, records: JournalEntry[]): Promise<void> {
  const subdomain = tenant.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(accountingEntryAttachments).where(eq(accountingEntryAttachments.workspaceSubdomain, subdomain));
    await tx.delete(accountingEntryTags).where(eq(accountingEntryTags.workspaceSubdomain, subdomain));
    await tx.delete(accountingJournalLines).where(eq(accountingJournalLines.workspaceSubdomain, subdomain));
    await tx.delete(accountingEntries).where(eq(accountingEntries.workspaceSubdomain, subdomain));

    for (const record of records) {
      await tx.insert(accountingEntries).values({
        id: record.id,
        workspaceSubdomain: subdomain,
        date: record.date,
        ref: record.ref ?? '',
        description: record.description ?? '',
        status: record.status ?? 'posted',
        createdBy: record.created_by ?? '',
        fiscalYear: record.fiscal_year ?? '',
        transactionType: record.transaction_type ?? null,
        reversedRef: record.reversed_ref ?? null,
        simpleMode: record.simple_mode ?? false,
        deletedAt: record.deletedAt ? new Date(record.deletedAt) : null,
        deletedBy: record.deletedBy ?? null,
        deletionReason: record.deletionReason ?? null,
        updatedAt: new Date(),
      });

      await syncEntryChildren(tx, subdomain, record);
    }
  });
}

export async function deleteAccountingByWorkspace(workspaceSubdomain: string): Promise<void> {
  const subdomain = workspaceSubdomain.trim().toLowerCase();
  await withTenant(subdomain, async (tx) => {
    await tx.delete(accountingEntryAttachments).where(eq(accountingEntryAttachments.workspaceSubdomain, subdomain));
    await tx.delete(accountingEntryTags).where(eq(accountingEntryTags.workspaceSubdomain, subdomain));
    await tx.delete(accountingJournalLines).where(eq(accountingJournalLines.workspaceSubdomain, subdomain));
    await tx.delete(accountingEntries).where(eq(accountingEntries.workspaceSubdomain, subdomain));
    await tx.delete(accountingFiscalYears).where(eq(accountingFiscalYears.workspaceSubdomain, subdomain));
    await tx.delete(accountingAccounts).where(eq(accountingAccounts.workspaceSubdomain, subdomain));
  });
}
