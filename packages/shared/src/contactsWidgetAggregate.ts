import type { Contact } from './contactTypes.js';
import { isContactDeleted } from './contactSoftDelete.js';

export type ContactsWidgetOperation = 'count' | 'sum' | 'avg' | 'percentage';
export type ContactsWidgetFilterOperator = 'equals' | 'contains' | 'gt' | 'lt';

export interface ContactsWidgetQuery {
  id: string;
  operation: ContactsWidgetOperation;
  targetField?: string;
  filterField?: string;
  filterOperator?: ContactsWidgetFilterOperator;
  filterValue?: string;
  xAxisField?: string;
}

export interface ContactsWidgetAggregateResult {
  value: number;
  totalCount: number;
  chartData: { name: string; value: number }[];
}

function contactFieldValue(contact: Contact, field: string): unknown {
  return contact[field as keyof Contact];
}

function matchesWidgetFilter(
  contact: Contact,
  filterField?: string,
  filterOperator?: ContactsWidgetFilterOperator,
  filterValue?: string,
): boolean {
  if (!filterField) return true;
  const val = contactFieldValue(contact, filterField);
  if (val === undefined || val === null) return false;

  const strVal = String(val).toLowerCase();
  const strTargetVal = String(filterValue ?? '').toLowerCase();

  switch (filterOperator) {
    case 'equals':
      return strVal === strTargetVal;
    case 'contains':
      return strVal.includes(strTargetVal);
    case 'gt':
      return Number(val) > Number(filterValue);
    case 'lt':
      return Number(val) < Number(filterValue);
    default:
      return true;
  }
}

function filterContactsForWidget(contacts: Contact[], query: ContactsWidgetQuery): Contact[] {
  const active = contacts.filter((c) => !isContactDeleted(c));
  return active.filter((contact) =>
    matchesWidgetFilter(contact, query.filterField, query.filterOperator, query.filterValue),
  );
}

function aggregateNumericField(
  items: Contact[],
  operation: 'sum' | 'avg',
  targetField: string,
): number {
  let sum = 0;
  let count = 0;
  items.forEach((item) => {
    const num = Number(contactFieldValue(item, targetField));
    if (!Number.isNaN(num)) {
      sum += num;
      count += 1;
    }
  });
  if (operation === 'sum') return sum;
  return count > 0 ? Math.round(sum / count) : 0;
}

function buildChartData(items: Contact[], query: ContactsWidgetQuery): { name: string; value: number }[] {
  const xAxis = query.xAxisField || 'lifecycleStage';
  const groups: Record<string, Contact[]> = {};

  items.forEach((item) => {
    const keyVal = contactFieldValue(item, xAxis);
    const key = keyVal === undefined || keyVal === null || keyVal === '' ? 'Unknown' : String(keyVal);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  const data = Object.entries(groups).map(([groupName, groupItems]) => {
    let finalVal = 0;
    if (query.operation === 'count' || query.operation === 'percentage') {
      finalVal = groupItems.length;
    } else if (query.operation === 'sum' || query.operation === 'avg') {
      finalVal = aggregateNumericField(groupItems, query.operation, query.targetField || '');
    }
    return { name: groupName, value: finalVal };
  });

  return data.sort((a, b) => b.value - a.value).slice(0, 8);
}

/** Server/client widget aggregate for contacts collection (globle2 §10). */
export function computeContactsWidgetAggregate(
  contacts: Contact[],
  query: ContactsWidgetQuery,
): ContactsWidgetAggregateResult {
  const active = contacts.filter((c) => !isContactDeleted(c));
  const filtered = filterContactsForWidget(contacts, query);
  const totalCount = active.length;

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

export function computeContactsWidgetAggregates(
  contacts: Contact[],
  queries: ContactsWidgetQuery[],
): Record<string, ContactsWidgetAggregateResult> {
  const results: Record<string, ContactsWidgetAggregateResult> = {};
  for (const query of queries) {
    results[query.id] = computeContactsWidgetAggregate(contacts, query);
  }
  return results;
}

export function contactsWidgetQueryFromWidget(widget: {
  id: string;
  operation: ContactsWidgetOperation;
  targetField?: string;
  filterField?: string;
  filterOperator?: ContactsWidgetFilterOperator;
  filterValue?: string;
  xAxisField?: string;
}): ContactsWidgetQuery {
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
