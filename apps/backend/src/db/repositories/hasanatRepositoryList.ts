import {
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
  asc,
  desc,
  type SQL,
} from 'drizzle-orm';
import type {
  Distribution,
  HasanatListQuery,
  HasanatDistributionsListPageResult,
} from '@mms/shared';
import { hasanatDistributions } from '../schema.js';
import { withTenantTransaction } from '../withTenantTransaction.js';
import { mergeCustomData, runListPage } from './listPageHelper.js';

function buildDistributionsListConditions(
  subdomain: string,
  query: HasanatListQuery,
): SQL[] {
  const conditions: SQL[] = [eq(hasanatDistributions.workspaceSubdomain, subdomain)];

  // Manifest softDelete.workExcludesDeleted — Work = active, trash = deleted-only.
  if (query.includeDeleted) {
    conditions.push(isNotNull(sql`(${hasanatDistributions.customData}->>'deletedAt')`));
  } else {
    conditions.push(isNull(sql`(${hasanatDistributions.customData}->>'deletedAt')`));
  }

  const search = query.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(sql`(${hasanatDistributions.customData}->>'recipientName')`, pattern),
        ilike(sql`(${hasanatDistributions.customData}->>'denominationName')`, pattern),
        ilike(sql`(${hasanatDistributions.customData}->>'reason')`, pattern),
      ) as SQL,
    );
  }

  const statuses = query.status?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  if (statuses.length) {
    conditions.push(inArray(sql`(${hasanatDistributions.customData}->>'status')`, statuses));
  }

  return conditions;
}

const DISTRIBUTION_SORT_FIELDS = new Set([
  'recipientName',
  'denominationName',
  'reason',
  'status',
  'issuedDate',
  'updatedAt',
]);

function buildDistributionsOrderBy(sortField?: string, sortDir?: 'asc' | 'desc'): SQL {
  const field = sortField?.trim();
  let column: SQL;
  if (field && DISTRIBUTION_SORT_FIELDS.has(field)) {
    switch (field) {
      case 'updatedAt':
        column = hasanatDistributions.updatedAt as unknown as SQL;
        break;
      case 'recipientName':
        column = sql`(${hasanatDistributions.customData}->>'recipientName')`;
        break;
      case 'denominationName':
        column = sql`(${hasanatDistributions.customData}->>'denominationName')`;
        break;
      case 'reason':
        column = sql`(${hasanatDistributions.customData}->>'reason')`;
        break;
      case 'status':
        column = sql`(${hasanatDistributions.customData}->>'status')`;
        break;
      case 'issuedDate':
        column = sql`(${hasanatDistributions.customData}->>'issuedDate')`;
        break;
      default:
        column = hasanatDistributions.updatedAt as unknown as SQL;
    }
  } else {
    column = hasanatDistributions.updatedAt as unknown as SQL;
  }
  return sortDir === 'asc' ? asc(column) : desc(column);
}

type DistributionRow = typeof hasanatDistributions.$inferSelect;

export async function listDistributionsPage(
  tenant: string,
  query: HasanatListQuery,
): Promise<HasanatDistributionsListPageResult> {
  const subdomain = tenant.trim().toLowerCase();
  return withTenantTransaction(subdomain, async (tx) => {
    const result = await runListPage<DistributionRow, Distribution>(tx, hasanatDistributions, {
      conditions: buildDistributionsListConditions(subdomain, query),
      orderBy: buildDistributionsOrderBy(query.sortField, query.sortDir),
      page: query.page,
      limit: query.limit,
      defaultPageSize: 15,
      rowMapper: (row) => mergeCustomData(row) as unknown as Distribution,
    });
    return {
      distributions: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    };
  });
}