export type ContactsWidgetOperation = 'count' | 'sum' | 'avg' | 'percentage';
type ContactsWidgetFilterOperator = 'equals' | 'contains' | 'gt' | 'lt' | 'startsWith';

interface ContactsWidgetFilter {
  field: string;
  operator?: ContactsWidgetFilterOperator;
  value: string;
}

export interface ContactsWidgetQuery {
  id: string;
  operation: ContactsWidgetOperation;
  targetField?: string;
  filterField?: string;
  filterOperator?: ContactsWidgetFilterOperator;
  filterValue?: string;
  xAxisField?: string;
  /** Extra AND filters (visualizer multi-rule). */
  filters?: ContactsWidgetFilter[];
  /** Chart GROUP BY series cap (default 8). */
  chartLimit?: number;
}

export interface ContactsWidgetAggregateResult {
  value: number;
  totalCount: number;
  chartData: { name: string; value: number }[];
}

export function contactsWidgetQueryFromWidget(widget: {
  id: string;
  operation: ContactsWidgetOperation;
  targetField?: string;
  filterField?: string;
  filterOperator?: ContactsWidgetFilterOperator;
  filterValue?: string;
  xAxisField?: string;
  filters?: ContactsWidgetFilter[];
  chartLimit?: number;
}): ContactsWidgetQuery {
  return {
    id: widget.id,
    operation: widget.operation,
    targetField: widget.targetField,
    filterField: widget.filterField,
    filterOperator: widget.filterOperator,
    filterValue: widget.filterValue,
    xAxisField: widget.xAxisField,
    filters: widget.filters,
    chartLimit: widget.chartLimit,
  };
}
