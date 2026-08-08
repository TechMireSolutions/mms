import { matchesWidgetFilter } from './utils.js';

export type SessionsWidgetOperation = 'count' | 'sum' | 'avg' | 'percentage';
export type SessionsWidgetFilterOperator = 'equals' | 'contains' | 'gt' | 'lt';

export interface SessionsWidgetQuery {
  id: string;
  operation: SessionsWidgetOperation;
  targetField?: string;
  filterField?: string;
  filterOperator?: SessionsWidgetFilterOperator;
  filterValue?: string;
  xAxisField?: string;
}

export interface SessionsWidgetAggregateResult {
  value: number;
  totalCount: number;
  chartData: { name: string; value: number }[];
}

type SessionRow = Record<string, unknown>;

function sessionFieldValue(session: SessionRow, field: string): unknown {
  return session[field];
}

function filterSessionsForWidget(sessions: SessionRow[], query: SessionsWidgetQuery): SessionRow[] {
  return sessions.filter((session) =>
    matchesWidgetFilter(session, query.filterField, query.filterOperator, query.filterValue),
  );
}

function aggregateNumericField(
  items: SessionRow[],
  operation: 'sum' | 'avg',
  targetField: string,
): number {
  let sum = 0;
  let count = 0;
  items.forEach((item) => {
    const numericFieldValue = Number(sessionFieldValue(item, targetField));
    if (!Number.isNaN(numericFieldValue)) {
      sum += numericFieldValue;
      count += 1;
    }
  });
  if (operation === 'sum') return sum;
  return count > 0 ? Math.round(sum / count) : 0;
}

function buildChartData(items: SessionRow[], query: SessionsWidgetQuery): { name: string; value: number }[] {
  const xAxisField = query.xAxisField || 'status';
  const groups: Record<string, SessionRow[]> = {};

  items.forEach((item) => {
    const groupValue = sessionFieldValue(item, xAxisField);
    const groupKey = groupValue === undefined || groupValue === null || groupValue === '' ? 'Unknown' : String(groupValue);
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(item);
  });

  const chartData = Object.entries(groups).map(([groupName, groupItems]) => {
    let aggregateValue = 0;
    if (query.operation === 'count' || query.operation === 'percentage') {
      aggregateValue = groupItems.length;
    } else if (query.operation === 'sum' || query.operation === 'avg') {
      aggregateValue = aggregateNumericField(groupItems, query.operation, query.targetField || '');
    }
    return { name: groupName, value: aggregateValue };
  });

  return chartData.sort((leftPoint, rightPoint) => rightPoint.value - leftPoint.value).slice(0, 8);
}

/** Server/client widget aggregate for sessions collection. */
export function computeSessionsWidgetAggregate(
  sessions: SessionRow[],
  query: SessionsWidgetQuery,
): SessionsWidgetAggregateResult {
  const totalCount = sessions.length;
  const filtered = filterSessionsForWidget(sessions, query);

  let value = 0;
  if (query.operation === 'count') {
    value = filtered.length;
  } else if (query.operation === 'percentage') {
    value = totalCount > 0 ? Math.round((filtered.length / totalCount) * 100) : 0;
  } else if (query.operation === 'sum' || query.operation === 'avg') {
    value = aggregateNumericField(filtered, query.operation, query.targetField || '');
  }

  return {
    value,
    totalCount,
    chartData: buildChartData(filtered, query),
  };
}

export function computeSessionsWidgetAggregates(
  sessions: SessionRow[],
  queries: SessionsWidgetQuery[],
): Record<string, SessionsWidgetAggregateResult> {
  const results: Record<string, SessionsWidgetAggregateResult> = {};
  for (const query of queries) {
    results[query.id] = computeSessionsWidgetAggregate(sessions, query);
  }
  return results;
}

export function sessionsWidgetQueryFromWidget(widget: {
  id: string;
  operation: SessionsWidgetOperation;
  targetField?: string;
  filterField?: string;
  filterOperator?: SessionsWidgetFilterOperator;
  filterValue?: string;
  xAxisField?: string;
}): SessionsWidgetQuery {
  return {
    id: widget.id,
    operation: widget.operation,
    targetField: widget.targetField,
    filterField: widget.filterField,
    filterOperator: widget.filterOperator,
    filterValue: widget.filterValue,
    xAxisField: widget.xAxisField,
  };
}
