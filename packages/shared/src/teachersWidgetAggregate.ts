export type TeachersWidgetOperation = 'count' | 'sum' | 'avg' | 'percentage';
export type TeachersWidgetFilterOperator = 'equals' | 'contains' | 'gt' | 'lt';

export interface TeachersWidgetQuery {
  id: string;
  operation: TeachersWidgetOperation;
  targetField?: string;
  filterField?: string;
  filterOperator?: TeachersWidgetFilterOperator;
  filterValue?: string;
  xAxisField?: string;
}

export interface TeachersWidgetAggregateResult {
  value: number;
  totalCount: number;
  chartData: { name: string; value: number }[];
}

type TeacherRow = Record<string, unknown>;

function teacherFieldValue(teacher: TeacherRow, field: string): unknown {
  return teacher[field];
}

function matchesWidgetFilter(
  teacher: TeacherRow,
  filterField?: string,
  filterOperator?: TeachersWidgetFilterOperator,
  filterValue?: string,
): boolean {
  if (!filterField) return true;
  const fieldValue = teacherFieldValue(teacher, filterField);
  if (fieldValue === undefined || fieldValue === null) return false;

  const normalizedFieldValue = String(fieldValue).toLowerCase();
  const normalizedTargetValue = String(filterValue ?? '').toLowerCase();

  switch (filterOperator) {
    case 'equals':
      return normalizedFieldValue === normalizedTargetValue;
    case 'contains':
      return normalizedFieldValue.includes(normalizedTargetValue);
    case 'gt':
      return Number(fieldValue) > Number(filterValue);
    case 'lt':
      return Number(fieldValue) < Number(filterValue);
    default:
      return true;
  }
}

function filterTeachersForWidget(teachers: TeacherRow[], query: TeachersWidgetQuery): TeacherRow[] {
  return teachers.filter((teacher) =>
    matchesWidgetFilter(teacher, query.filterField, query.filterOperator, query.filterValue),
  );
}

function aggregateNumericField(
  items: TeacherRow[],
  operation: 'sum' | 'avg',
  targetField: string,
): number {
  let sum = 0;
  let count = 0;
  items.forEach((item) => {
    const num = Number(teacherFieldValue(item, targetField));
    if (!Number.isNaN(num)) {
      sum += num;
      count += 1;
    }
  });
  if (operation === 'sum') return sum;
  return count > 0 ? Math.round(sum / count) : 0;
}

function buildChartData(items: TeacherRow[], query: TeachersWidgetQuery): { name: string; value: number }[] {
  const xAxisField = query.xAxisField || 'status';
  const groups: Record<string, TeacherRow[]> = {};

  items.forEach((item) => {
    const groupValue = teacherFieldValue(item, xAxisField);
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

/** Server/client widget aggregate for teachers collection (globle2 §10). */
export function computeTeachersWidgetAggregate(
  teachers: TeacherRow[],
  query: TeachersWidgetQuery,
): TeachersWidgetAggregateResult {
  const totalCount = teachers.length;
  const filtered = filterTeachersForWidget(teachers, query);

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

export function computeTeachersWidgetAggregates(
  teachers: TeacherRow[],
  queries: TeachersWidgetQuery[],
): Record<string, TeachersWidgetAggregateResult> {
  const results: Record<string, TeachersWidgetAggregateResult> = {};
  for (const query of queries) {
    results[query.id] = computeTeachersWidgetAggregate(teachers, query);
  }
  return results;
}

export function teachersWidgetQueryFromWidget(widget: {
  id: string;
  operation: TeachersWidgetOperation;
  targetField?: string;
  filterField?: string;
  filterOperator?: TeachersWidgetFilterOperator;
  filterValue?: string;
  xAxisField?: string;
}): TeachersWidgetQuery {
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
