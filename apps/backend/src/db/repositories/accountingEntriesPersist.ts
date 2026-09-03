import { and, eq } from 'drizzle-orm';
import { type JournalEntry } from '@mms/shared';
import {
  accountingAccounts,
  accountingEntries,
  accountingFiscalYears,
  accountingJournalLines,
  accountingEntryTags,
  accountingEntryAttachments,
} from '../schema.js';
import { withTenant } from '../tenant-context.js';

async function syncEntryChildren(
  tx: Parameters<Parameters<typeof withTenant>[1]>[0],
  subdomain: string,
  entry: JournalEntry,
): Promise<void> {
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

  if (entry.lines && entry.lines.length > 0) {
    await tx.insert(accountingJournalLines).values(
      entry.lines.map((l) => ({
        id: l.id,
        workspaceSubdomain: subdomain,
        entryId: entry.id,
        accountId: l.account_id,
        debit: String(l.debit ?? 0),
        credit: String(l.credit ?? 0),
        description: l.description ?? '',
      })),
    );
  }

  if (entry.tags && entry.tags.length > 0) {
    await tx.insert(accountingEntryTags).values(
      entry.tags.map((tag) => ({
        workspaceSubdomain: subdomain,
        entryId: entry.id,
        tag,
      })),
    );
  }

  if (entry.attachments && entry.attachments.length > 0) {
    await tx.insert(accountingEntryAttachments).values(
      entry.attachments.map((url) => ({
        workspaceSubdomain: subdomain,
        entryId: entry.id,
        url,
      })),
    );
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

    if (records.length === 0) return;

    await tx.insert(accountingEntries).values(
      records.map((record) => ({
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
      })),
    );

    const allLines = records.flatMap((record) =>
      (record.lines ?? []).map((l) => ({
        id: l.id,
        workspaceSubdomain: subdomain,
        entryId: record.id,
        accountId: l.account_id,
        debit: String(l.debit ?? 0),
        credit: String(l.credit ?? 0),
        description: l.description ?? '',
      })),
    );
    if (allLines.length > 0) {
      await tx.insert(accountingJournalLines).values(allLines);
    }

    const allTags = records.flatMap((record) =>
      (record.tags ?? []).map((tag) => ({
        workspaceSubdomain: subdomain,
        entryId: record.id,
        tag,
      })),
    );
    if (allTags.length > 0) {
      await tx.insert(accountingEntryTags).values(allTags);
    }

    const allAttachments = records.flatMap((record) =>
      (record.attachments ?? []).map((url) => ({
        workspaceSubdomain: subdomain,
        entryId: record.id,
        url,
      })),
    );
    if (allAttachments.length > 0) {
      await tx.insert(accountingEntryAttachments).values(allAttachments);
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
