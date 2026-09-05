import { randomUUID } from 'node:crypto';
import {
  canApplyLateFee,
  canCancelInvoice,
  canCreditInvoice,
  collectInvoicesBodySchema,
  computeLateFee,
  creditNoteInsertSchema,
  DEFAULT_FINANCE_SETTINGS,
  getOutstandingAmountForInvoice,
  invoiceOpenBalance,
  isInvoiceDueForReminder,
  remindInvoicesBodySchema,
  todayISO,
  toMessagingRecipient,
  wasRemindedRecently,
  type CollectInvoicesBody,
  type CollectInvoicesResult,
  type CreditNote,
  type CreditNoteInsert,
  type Invoice,
  type RemindInvoicesBody,
  type RemindInvoicesResult,
} from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import { loadFinanceModulePreferences } from '../../services/financePreferencesService.js';
import { loadContactsByIdsForTenant } from '../../services/contactService.js';
import { financeUseCases } from './financeUseCases.js';
import {
  applyLateFeeAmounts,
  listCreditNotesForInvoice,
  listInvoicesByIds,
  listOpenInvoicesForCollect,
  markInvoicesReminded,
  markOverdueInvoices,
  saveCreditNote,
} from '../../db/repositories/financeCollectRepository.js';
import {
  tryPostCreditNoteJournal,
  tryPostInvoiceReversalJournal,
  tryPostLateFeeJournals,
} from '../../accounting/ledgerPosting/ledgerPostingService.js';

function requireTenant(): string {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  return tenant;
}

function domainError(message: string, statusCode: number, type: string): Error {
  return Object.assign(new Error(message), { statusCode, type });
}

export async function collectOverdueInvoices(input: CollectInvoicesBody = {}): Promise<CollectInvoicesResult> {
  const tenant = requireTenant();
  const body = collectInvoicesBodySchema.parse(input);
  const today = todayISO();
  const prefs = await loadFinanceModulePreferences();
  const lateFeePercent = Number.parseFloat(prefs?.lateFeePercent ?? DEFAULT_FINANCE_SETTINGS.lateFeePercent) || 0;
  const markedOverdue = await markOverdueInvoices(tenant, today);
  let lateFeesApplied = 0;
  if (body.applyLateFee && lateFeePercent > 0) {
    const open = await listOpenInvoicesForCollect(tenant);
    const fees = open
      .filter((invoice) => canApplyLateFee(invoice, lateFeePercent, today))
      .map((invoice) => ({ invoice, amount: computeLateFee(invoice.finalAmt, lateFeePercent) }))
      .filter((fee) => fee.amount > 0);
    await applyLateFeeAmounts(tenant, fees.map((fee) => ({ invoiceId: fee.invoice.id, amount: fee.amount })));
    await tryPostLateFeeJournals(tenant, fees);
    lateFeesApplied = fees.length;
  }
  const { broadcastTenantUpdate } = await import('../../services/websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'finance_invoices');
  broadcastTenantUpdate(tenant, 'collection', 'finance_metrics');
  return { markedOverdue, lateFeesApplied };
}

export async function remindOpenInvoices(input: RemindInvoicesBody = {}): Promise<RemindInvoicesResult> {
  const tenant = requireTenant();
  const body = remindInvoicesBodySchema.parse(input);
  const prefs = await loadFinanceModulePreferences();
  if (prefs && !prefs.overdueReminder && !prefs.feeReminders) {
    return { reminded: 0, skipped: 0, recipients: [] };
  }
  const reminderDays = Number.parseInt(prefs?.reminderDaysBefore ?? DEFAULT_FINANCE_SETTINGS.reminderDaysBefore, 10) || 0;
  const today = todayISO();
  const invoices = body.invoiceIds?.length
    ? await listInvoicesByIds(tenant, body.invoiceIds)
    : await listOpenInvoicesForCollect(tenant);
  const eligible = invoices.filter(
    (invoice) =>
      invoiceOpenBalance(invoice) > 0
      && isInvoiceDueForReminder(invoice.dueDate, reminderDays, today)
      && !wasRemindedRecently(invoice.lastRemindedAt),
  );
  const contactIds = [...new Set(eligible.map((invoice) => invoice.familyContactId).filter((id): id is string => Boolean(id)))];
  const contacts = contactIds.length > 0 ? await loadContactsByIdsForTenant(tenant, contactIds) : [];
  const contactById = new Map(contacts.map((contact) => [String(contact.id), contact]));
  const recipients: RemindInvoicesResult['recipients'] = [];
  const remindedIds: string[] = [];
  for (const invoice of eligible) {
    const contact = invoice.familyContactId ? contactById.get(invoice.familyContactId) : undefined;
    if (!contact) continue;
    const recipient = toMessagingRecipient(contact);
    if (!recipient.phone && !recipient.email) continue;
    recipients.push({
      id: String(recipient.id),
      name: recipient.name,
      phone: recipient.phone ?? '',
      email: recipient.email,
      invoiceId: invoice.id,
      dueDate: invoice.dueDate,
      amount: getOutstandingAmountForInvoice(invoice),
    });
    remindedIds.push(invoice.id);
  }
  await markInvoicesReminded(tenant, remindedIds);
  const { broadcastTenantUpdate } = await import('../../services/websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'finance_invoices');
  return { reminded: remindedIds.length, skipped: invoices.length - remindedIds.length, recipients };
}

export async function cancelInvoice(invoiceId: string): Promise<Invoice> {
  const tenant = requireTenant();
  const invoice = await financeUseCases.getInvoiceById(invoiceId);
  if (!invoice || invoice.deletedAt) throw domainError('Invoice not found', 404, 'not_found');
  if (!canCancelInvoice(invoice)) {
    throw domainError('Only unpaid invoices can be cancelled', 422, 'validation_error');
  }
  const cancelled = await financeUseCases.updateInvoiceById(invoiceId, { ...invoice, status: 'cancelled' });
  if (!cancelled) throw domainError('Invoice not found', 404, 'not_found');
  await tryPostInvoiceReversalJournal(tenant, cancelled);
  const { broadcastTenantUpdate } = await import('../../services/websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'finance_invoices');
  return cancelled;
}

export async function createCreditNote(input: CreditNoteInsert): Promise<CreditNote> {
  const tenant = requireTenant();
  const parsed = creditNoteInsertSchema.parse(input);
  const invoice = await financeUseCases.getInvoiceById(parsed.invoiceId);
  if (!invoice || invoice.deletedAt) throw domainError('Invoice not found', 404, 'not_found');
  if (!canCreditInvoice(invoice, parsed.amount)) {
    throw domainError('Credit exceeds the open balance', 422, 'validation_error');
  }
  const note: CreditNote = {
    id: `cn-${randomUUID()}`,
    invoiceId: invoice.id,
    amount: parsed.amount,
    reason: parsed.reason ?? '',
    createdAt: new Date().toISOString(),
  };
  const creditedAmt = (invoice.creditedAmt ?? 0) + parsed.amount;
  const remaining = invoiceOpenBalance({ ...invoice, creditedAmt });
  await saveCreditNote(tenant, note);
  await financeUseCases.updateInvoiceById(invoice.id, {
    ...invoice,
    creditedAmt,
    status: remaining <= 0 ? 'paid' : invoice.status,
  });
  await tryPostCreditNoteJournal(tenant, invoice, note.id, parsed.amount);
  const { broadcastTenantUpdate } = await import('../../services/websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', 'finance_invoices');
  return note;
}

export async function loadCreditNotes(invoiceId: string): Promise<CreditNote[]> {
  return listCreditNotesForInvoice(requireTenant(), invoiceId);
}
