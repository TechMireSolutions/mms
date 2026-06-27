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
  const fieldValue = contactFieldValue(contact, filterField);
  if (fieldValue === undefined || fieldValue === null) return false;

  const fieldValueText = String(fieldValue).toLowerCase();
  const targetValueText = String(filterValue ?? '').toLowerCase();

  switch (filterOperator) {
    case 'equals':
      return fieldValueText === targetValueText;
    case 'contains':
      return fieldValueText.includes(targetValueText);
    case 'gt':
      return Number(fieldValue) > Number(filterValue);
    case 'lt':
      return Number(fieldValue) < Number(filterValue);
    default:
      return true;
  }
}

function filterContactsForWidget(contacts: Contact[], query: ContactsWidgetQuery): Contact[] {
  const active = contacts.filter((contact) => !isContactDeleted(contact));
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
    const groupValue = contactFieldValue(item, xAxis);
    const key = groupValue === undefined || groupValue === null || groupValue === '' ? 'Unknown' : String(groupValue);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  const chartData = Object.entries(groups).map(([groupName, groupItems]) => {
    let finalValue = 0;
    if (query.operation === 'count' || query.operation === 'percentage') {
      finalValue = groupItems.length;
    } else if (query.operation === 'sum' || query.operation === 'avg') {
      finalValue = aggregateNumericField(groupItems, query.operation, query.targetField || '');
    }
    return { name: groupName, value: finalValue };
  });

  return chartData.sort((a, b) => b.value - a.value).slice(0, 8);
}

/** Server/client widget aggregate for contacts collection (globle2 §10). */
export function computeContactsWidgetAggregate(
  contacts: Contact[],
  query: ContactsWidgetQuery,
): ContactsWidgetAggregateResult {
  const active = contacts.filter((contact) => !isContactDeleted(contact));
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
