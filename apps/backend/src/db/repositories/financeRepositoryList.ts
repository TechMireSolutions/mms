import { and, eq, ilike, or, isNull, isNotNull, type SQL, desc, asc, sql } from 'drizzle-orm';
import type {
  FinanceListQuery,
  FinanceInvoicesListPageResult,
  FinancePaymentsListPageResult,
} from '@mms/shared';
import { financeInvoices, financePayments } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { invoiceRowToRecord, paymentRowToRecord } from './financeRepository.js';

function buildInvoiceListConditions(subdomain: string, query: FinanceListQuery): SQL[] {
  const conditions: SQL[] = [eq(financeInvoices.workspaceSubdomain, subdomain)];
  
  if (query.includeDeleted) {
    conditions.push(isNotNull(financeInvoices.deletedAt));
  } else {
    conditions.push(isNull(financeInvoices.deletedAt));
  }
  
  const search = query.search?.trim();
  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        ilike(financeInvoices.id, searchPattern),
        ilike(financeInvoices.studentName, searchPattern),
        ilike(financeInvoices.class, searchPattern),
        ilike(financeInvoices.session, searchPattern),
      ) as SQL,
    );
  }
  
  return conditions;
}

function buildPaymentListConditions(subdomain: string, query: FinanceListQuery): SQL[] {
  const conditions: SQL[] = [eq(financePayments.workspaceSubdomain, subdomain)];
  
  if (query.includeDeleted) {
    conditions.push(isNotNull(financePayments.deletedAt));
  } else {
    conditions.push(isNull(financePayments.deletedAt));
  }
  
  const search = query.search?.trim();
  if (search) {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        ilike(financePayments.id, searchPattern),
        ilike(financePayments.invoiceId, searchPattern),
        ilike(financePayments.studentName, searchPattern),
        ilike(financePayments.method, searchPattern),
      ) as SQL,
    );
  }
  
  return conditions;
}

function buildInvoiceOrderBy(sortField?: string, sortDir?: 'asc' | 'desc'): SQL {
  const field = sortField?.trim() || 'createdAt';
  let column: SQL;
  switch (field) {
    case 'createdAt':
      column = financeInvoices.createdAt as unknown as SQL;
      break;
    case 'id':
      column = financeInvoices.id as unknown as SQL;
      break;
    case 'studentName':
      column = financeInvoices.studentName as unknown as SQL;
      break;
    case 'class':
      column = financeInvoices.class as unknown as SQL;
      break;
    case 'session':
      column = financeInvoices.session as unknown as SQL;
      break;
    case 'totalAmount':
      column = financeInvoices.finalAmt as unknown as SQL;
      break;
    case 'status':
      column = financeInvoices.status as unknown as SQL;
      break;
    default:
      column = financeInvoices.createdAt as unknown as SQL;
  }
  return sortDir === 'asc' ? asc(column) : desc(column);
}

function buildPaymentOrderBy(sortField?: string, sortDir?: 'asc' | 'desc'): SQL {
  const field = sortField?.trim() || 'createdAt';
  let column: SQL;
  switch (field) {
    case 'createdAt':
      column = financePayments.createdAt as unknown as SQL;
      break;
    case 'id':
      column = financePayments.id as unknown as SQL;
      break;
    case 'invoiceId':
      column = financePayments.invoiceId as unknown as SQL;
      break;
    case 'studentName':
      column = financePayments.studentName as unknown as SQL;
      break;
    case 'method':
      column = financePayments.method as unknown as SQL;
      break;
    case 'amount':
      column = financePayments.amount as unknown as SQL;
      break;
    default:
      column = financePayments.createdAt as unknown as SQL;
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

    const items = rows.map(invoiceRowToRecord);

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

    const items = rows.map(paymentRowToRecord);

    return {
      payments: items,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  });
}
