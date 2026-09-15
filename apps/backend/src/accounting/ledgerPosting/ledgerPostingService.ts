import {
  buildCreditNotePostingLines,
  buildInvoicePostingLines,
  buildLateFeePostingLines,
  buildOpeningEntryLines,
  buildPaymentPostingLines,
  buildReversalLines,
  type FiscalYear,
  type Invoice,
  type JournalEntry,
  type OpeningBalance,
  type Payment,
} from '@mms/shared';
import { findEntryById, findEntryIdBySource, saveEntry } from '../../db/repositories/accountingRepository.js';
import { getPostingRules } from '../../db/repositories/accountingLedgerOpsRepository.js';
import { listFiscalYearsByWorkspace } from '../../db/repositories/accountingFiscalYearsRepository.js';
import { prepareJournalEntryForPersist } from '../use-cases/accountingLedgerGuards.js';

function postingDate(value: string | undefined): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Date().toISOString().slice(0, 10);
}

async function persistGeneratedEntry(
  tenant: string,
  entry: JournalEntry,
  years?: readonly FiscalYear[],
): Promise<JournalEntry | null> {
  const existingId = await findEntryIdBySource(tenant, entry.source_type ?? '', entry.source_id ?? '');
  if (existingId) return null;
  const resolvedYears = years ?? (await listFiscalYearsByWorkspace(tenant));
  const prepared = prepareJournalEntryForPersist(entry, resolvedYears);
  await saveEntry(tenant, prepared);
  return prepared;
}

function entryForSource(
  sourceType: JournalEntry['source_type'],
  sourceId: string,
  date: string,
  description: string,
  lines: JournalEntry['lines'],
  fiscalYearId?: string,
): JournalEntry {
  return {
    id: `je-${sourceType}-${sourceId}`,
    date,
    ref: `${sourceType}:${sourceId}`,
    description,
    status: 'posted',
    created_by: 'system',
    tags: [],
    attachments: [],
    fiscal_year: '',
    fiscal_year_id: fiscalYearId,
    source_type: sourceType,
    source_id: sourceId,
    lines,
  };
}

/**
 * Fiscal year whose range contains the posting date. Returns undefined when the
 * date falls outside every configured year rather than silently posting to the
 * active year.
 */
function resolveYearId(years: readonly FiscalYear[], date: string): string | undefined {
  return years.find((year) => year.startDate <= date && date <= year.endDate)?.id;
}

/** Posts Dr AR / Cr Income when posting accounts are configured. Skips otherwise. */
export async function tryPostInvoiceJournal(tenant: string, invoice: Invoice): Promise<void> {
  if (invoice.status === 'cancelled' || invoice.deletedAt) return;
  const accounts = await getPostingRules(tenant);
  const date = postingDate(invoice.dueDate);
  const lines = buildInvoicePostingLines({
    invoiceId: invoice.id,
    description: invoice.invoiceNumber ?? invoice.id,
    date,
    finalAmt: invoice.finalAmt,
    discountAmt: invoice.discountAmt,
    accounts,
  });
  if (!lines) return;
  const years = await listFiscalYearsByWorkspace(tenant);
  await persistGeneratedEntry(
    tenant,
    entryForSource('invoice', invoice.id, date, `Invoice ${invoice.invoiceNumber ?? invoice.id}`, lines, resolveYearId(years, date)),
    years,
  );
}

/** Posts Dr Cash / Cr AR when posting accounts are configured. Skips otherwise. */
export async function tryPostPaymentJournal(tenant: string, payment: Payment): Promise<void> {
  const accounts = await getPostingRules(tenant);
  const date = postingDate(payment.date);
  const lines = buildPaymentPostingLines({
    paymentId: payment.id,
    description: payment.note || payment.id,
    date,
    amount: payment.amount,
    accounts,
  });
  if (!lines) return;
  const years = await listFiscalYearsByWorkspace(tenant);
  await persistGeneratedEntry(
    tenant,
    entryForSource('payment', payment.id, date, `Payment ${payment.id}`, lines, resolveYearId(years, date)),
    years,
  );
}

export async function tryPostOpeningJournal(
  tenant: string,
  fiscalYearId: string,
  balances: OpeningBalance[],
): Promise<JournalEntry | null> {
  const years = await listFiscalYearsByWorkspace(tenant);
  const year = years.find((row) => row.id === fiscalYearId);
  if (!year) throw Object.assign(new Error('Fiscal year not found'), { statusCode: 404, type: 'not_found' });
  const lines = buildOpeningEntryLines(balances);
  if (!lines) {
    throw Object.assign(new Error('Opening balances must form a balanced journal'), {
      statusCode: 422,
      type: 'validation_error',
    });
  }
  return persistGeneratedEntry(
    tenant,
    entryForSource('opening', fiscalYearId, year.startDate, `Opening balances ${year.label}`, lines, fiscalYearId),
    years,
  );
}

export async function tryPostInvoiceReversalJournal(tenant: string, invoice: Invoice): Promise<void> {
  const existingId = await findEntryIdBySource(tenant, 'invoice', invoice.id);
  if (!existingId) return;
  const original = await findEntryById(tenant, existingId);
  if (!original?.lines?.length) return;
  const date = postingDate(undefined);
  const lines = buildReversalLines(original.lines);
  const years = await listFiscalYearsByWorkspace(tenant);
  await persistGeneratedEntry(
    tenant,
    entryForSource('reversal', invoice.id, date, `Cancel ${invoice.invoiceNumber ?? invoice.id}`, lines, resolveYearId(years, date)),
    years,
  );
}

export async function tryPostLateFeeJournals(
  tenant: string,
  fees: readonly { invoice: Invoice; amount: number }[],
): Promise<void> {
  if (fees.length === 0) return;
  const accounts = await getPostingRules(tenant);
  const years = await listFiscalYearsByWorkspace(tenant);
  const date = postingDate(undefined);
  const yearId = resolveYearId(years, date);
  for (const fee of fees) {
    const lines = buildLateFeePostingLines({
      invoiceId: fee.invoice.id,
      amount: fee.amount,
      description: `Late fee ${fee.invoice.invoiceNumber ?? fee.invoice.id}`,
      accounts,
    });
    if (!lines) continue;
    await persistGeneratedEntry(
      tenant,
      entryForSource('invoice', `latefee:${fee.invoice.id}`, date, `Late fee ${fee.invoice.invoiceNumber ?? fee.invoice.id}`, lines, yearId),
      years,
    );
  }
}

export async function tryPostCreditNoteJournal(
  tenant: string,
  invoice: Invoice,
  creditNoteId: string,
  amount: number,
): Promise<void> {
  const accounts = await getPostingRules(tenant);
  const date = postingDate(undefined);
  const lines = buildCreditNotePostingLines({
    creditNoteId,
    amount,
    description: `Credit note ${invoice.invoiceNumber ?? invoice.id}`,
    accounts,
  });
  if (!lines) return;
  const years = await listFiscalYearsByWorkspace(tenant);
  await persistGeneratedEntry(
    tenant,
    entryForSource('reversal', creditNoteId, date, `Credit note ${invoice.invoiceNumber ?? invoice.id}`, lines, resolveYearId(years, date)),
    years,
  );
}
