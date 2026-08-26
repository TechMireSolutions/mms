export interface WidgetQuery {
  id: string;
  operation: 'count' | 'sum' | 'avg' | 'percentage';
  targetField?: string;
  filterField?: string;
  filterOperator?: 'equals' | 'contains' | 'startsWith' | 'gt' | 'lt';
  filterValue?: string;
  xAxisField?: string;
  chartLimit?: number;
}

export interface WidgetAggregateResult {
  value: number;
  totalCount: number;
  chartData: { name: string; value: number }[];
}
