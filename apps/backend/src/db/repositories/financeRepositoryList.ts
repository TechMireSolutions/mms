import { and, eq, ilike, or, sql, isNull, type SQL, desc, asc } from 'drizzle-orm';
import type {
  Invoice,
  Payment,
  FinanceListQuery,
  FinanceInvoicesListPageResult,
  FinancePaymentsListPageResult,
} from '@mms/shared';
import { financeInvoices, financePayments } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';

function buildInvoiceListConditions(subdomain: string, query: FinanceListQuery): SQL[] {
  const conditions: SQL[] = [eq(financeInvoices.workspaceSubdomain, subdomain)];
  
  if (!query.includeDeleted) {
    conditions.push(isNull(sql`(${financeInvoices.customData}->>'deletedAt')`));
  }
  
  const search = query.search?.trim();
  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        ilike(financeInvoices.id, searchPattern),
        ilike(sql`(${financeInvoices.customData}->>'studentName')`, searchPattern),
        ilike(sql`(${financeInvoices.customData}->>'class')`, searchPattern),
        ilike(sql`(${financeInvoices.customData}->>'session')`, searchPattern)
      ) as SQL
    );
  }
  
  return conditions;
}

function buildPaymentListConditions(subdomain: string, query: FinanceListQuery): SQL[] {
  const conditions: SQL[] = [eq(financePayments.workspaceSubdomain, subdomain)];
  
  if (!query.includeDeleted) {
    conditions.push(isNull(sql`(${financePayments.customData}->>'deletedAt')`));
  }
  
  const search = query.search?.trim();
  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        ilike(financePayments.id, searchPattern),
        ilike(sql`(${financePayments.customData}->>'invoiceId')`, searchPattern),
        ilike(sql`(${financePayments.customData}->>'studentName')`, searchPattern),
        ilike(sql`(${financePayments.customData}->>'method')`, searchPattern)
      ) as SQL
    );
  }
  
  return conditions;
}

function buildInvoiceOrderBy(sortField?: string, sortDir?: 'asc' | 'desc'): SQL {
  const field = sortField?.trim() || 'createdAt';
  let column: SQL;
  switch (field) {
    case 'createdAt':
      column = sql`(${financeInvoices.customData}->>'createdAt')::timestamp`;
      break;
    case 'id':
      column = financeInvoices.id as unknown as SQL;
      break;
    case 'studentName':
      column = sql`(${financeInvoices.customData}->>'studentName')`;
      break;
    case 'class':
      column = sql`(${financeInvoices.customData}->>'class')`;
      break;
    case 'session':
      column = sql`(${financeInvoices.customData}->>'session')`;
      break;
    case 'totalAmount':
      column = sql`(${financeInvoices.customData}->>'totalAmount')::numeric`;
      break;
    case 'status':
      column = sql`(${financeInvoices.customData}->>'status')`;
      break;
    default:
      column = sql`(${financeInvoices.customData}->>'createdAt')::timestamp`;
  }
  return sortDir === 'asc' ? asc(column) : desc(column);
}

function buildPaymentOrderBy(sortField?: string, sortDir?: 'asc' | 'desc'): SQL {
  const field = sortField?.trim() || 'createdAt';
  let column: SQL;
  switch (field) {
    case 'createdAt':
      column = sql`(${financePayments.customData}->>'createdAt')::timestamp`;
      break;
    case 'id':
      column = financePayments.id as unknown as SQL;
      break;
    case 'invoiceId':
      column = sql`(${financePayments.customData}->>'invoiceId')`;
      break;
    case 'studentName':
      column = sql`(${financePayments.customData}->>'studentName')`;
      break;
    case 'method':
      column = sql`(${financePayments.customData}->>'method')`;
      break;
    case 'amount':
      column = sql`(${financePayments.customData}->>'amount')::numeric`;
      break;
    default:
      column = sql`(${financePayments.customData}->>'createdAt')::timestamp`;
  }
  return sortDir === 'asc' ? asc(column) : desc(column);
}

export async function listInvoicesPage(
  tenant: string,
  query: FinanceListQuery,
): Promise<FinanceInvoicesListPageResult> {
  const subdomain = tenant.trim().toLowerCase();
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(Math.max(1, query.limit ?? 12), 500);
  const offset = (page - 1) * limit;

  return withTenantTransaction(subdomain, async (tx) => {
    const conditions = buildInvoiceListConditions(subdomain, query);
    const whereClause = and(...conditions);
    const orderBy = buildInvoiceOrderBy(query.sortField, query.sortDir);

    const countRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(financeInvoices)
      .where(whereClause);
    const total = Number(countRows[0]?.count ?? 0);

    const rows = await tx
      .select()
      .from(financeInvoices)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Simple mapping, assuming the generic repository structure (customData merging)
    const items = rows.map((row) => ({
      ...row,
      ...(row.customData as any || {}),
    })) as Invoice[];

    return {
      invoices: items,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  });
}

export async function listPaymentsPage(
  tenant: string,
  query: FinanceListQuery,
): Promise<FinancePaymentsListPageResult> {
  const subdomain = tenant.trim().toLowerCase();
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(Math.max(1, query.limit ?? 12), 500);
  const offset = (page - 1) * limit;

  return withTenantTransaction(subdomain, async (tx) => {
    const conditions = buildPaymentListConditions(subdomain, query);
    const whereClause = and(...conditions);
    const orderBy = buildPaymentOrderBy(query.sortField, query.sortDir);

    const countRows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(financePayments)
      .where(whereClause);
    const total = Number(countRows[0]?.count ?? 0);

    const rows = await tx
      .select()
      .from(financePayments)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const items = rows.map((row) => ({
      ...row,
      ...(row.customData as any || {}),
    })) as Payment[];

    return {
      payments: items,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  });
}
