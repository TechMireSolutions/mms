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
  const val = teacherFieldValue(teacher, filterField);
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
  const xAxis = query.xAxisField || 'status';
  const groups: Record<string, TeacherRow[]> = {};

  items.forEach((item) => {
    const keyVal = teacherFieldValue(item, xAxis);
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
