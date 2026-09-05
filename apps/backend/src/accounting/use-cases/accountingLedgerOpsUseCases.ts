import {
  bankReconciliationMatchSchema,
  bankStatementInsertSchema,
  bankStatementRecordSchema,
  openingBalancesReplaceSchema,
  postingRulesUpdateSchema,
  type BankStatement,
  type FiscalYear,
  type OpeningBalance,
  type PostingRules,
} from '@mms/shared';
import { getRequestTenant } from '../../lib/tenantContext.js';
import {
  getPostingRules,
  listBankStatements,
  listOpeningBalances,
  matchBankReconciliation,
  replaceOpeningBalances,
  saveBankStatement,
  savePostingRules,
} from '../../db/repositories/accountingLedgerOpsRepository.js';
import { closeFiscalYearForTenant } from './accountingPeriodClose.js';
import { tryPostOpeningJournal } from '../ledgerPosting/ledgerPostingService.js';

function requireTenant(): string {
  const tenant = getRequestTenant();
  if (!tenant) throw new Error('Tenant context required');
  return tenant;
}

async function broadcast(tenant: string, collection: string): Promise<void> {
  const { broadcastTenantUpdate } = await import('../../services/websocketService.js');
  broadcastTenantUpdate(tenant, 'collection', collection);
}

export async function loadPostingRules(): Promise<PostingRules> {
  return getPostingRules(requireTenant());
}

export async function upsertPostingRules(input: PostingRules): Promise<PostingRules> {
  const tenant = requireTenant();
  const parsed = postingRulesUpdateSchema.parse(input);
  await savePostingRules(tenant, parsed);
  await broadcast(tenant, 'accounting_posting_rules');
  return parsed;
}

export async function loadOpeningBalances(fiscalYearId: string): Promise<OpeningBalance[]> {
  return listOpeningBalances(requireTenant(), fiscalYearId);
}

export async function upsertOpeningBalances(
  fiscalYearId: string,
  balances: OpeningBalance[],
): Promise<OpeningBalance[]> {
  const tenant = requireTenant();
  const parsed = openingBalancesReplaceSchema.parse({ fiscalYearId, balances });
  const records = parsed.balances.map((row, index) => ({
    ...row,
    id: row.id ?? `ob-${index + 1}`,
    fiscalYearId,
  }));
  await replaceOpeningBalances(tenant, fiscalYearId, records);
  await broadcast(tenant, 'accounting_opening_balances');
  return records;
}

export async function postOpeningBalances(fiscalYearId: string): Promise<void> {
  const tenant = requireTenant();
  const balances = await listOpeningBalances(tenant, fiscalYearId);
  await tryPostOpeningJournal(tenant, fiscalYearId, balances);
  await broadcast(tenant, 'accounting_entries');
}

export async function closeFiscalYear(
  fiscalYearId: string,
  closedBy: string,
  retainedEarningsAccountId?: string,
): Promise<FiscalYear> {
  const tenant = requireTenant();
  const closed = await closeFiscalYearForTenant(tenant, fiscalYearId, closedBy, retainedEarningsAccountId);
  await broadcast(tenant, 'accounting_fiscal_years');
  await broadcast(tenant, 'accounting_entries');
  return closed;
}

export async function loadBankStatements(): Promise<BankStatement[]> {
  return listBankStatements(requireTenant());
}

export async function upsertBankStatement(input: unknown): Promise<BankStatement> {
  const tenant = requireTenant();
  const parsed = bankStatementInsertSchema.parse(input);
  const record = bankStatementRecordSchema.parse({
    ...parsed,
    id: parsed.id || `bs-${Date.now()}`,
    lines: (parsed.lines ?? []).map((line, index) => ({
      ...line,
      id: line.id ?? `bsl-${index + 1}`,
    })),
  });
  await saveBankStatement(tenant, record);
  await broadcast(tenant, 'accounting_bank_statements');
  return record;
}

export async function matchBankStatementLine(input: unknown): Promise<void> {
  const tenant = requireTenant();
  const parsed = bankReconciliationMatchSchema.parse(input);
  await matchBankReconciliation(tenant, parsed);
  await broadcast(tenant, 'accounting_bank_reconciliations');
}
