export type StudentsWidgetOperation = 'count' | 'sum' | 'avg' | 'percentage';
export type StudentsWidgetFilterOperator = 'equals' | 'contains' | 'gt' | 'lt';

export interface StudentsWidgetQuery {
  id: string;
  operation: StudentsWidgetOperation;
  targetField?: string;
  filterField?: string;
  filterOperator?: StudentsWidgetFilterOperator;
  filterValue?: string;
  xAxisField?: string;
}

export interface StudentsWidgetAggregateResult {
  value: number;
  totalCount: number;
  chartData: { name: string; value: number }[];
}

type StudentRow = Record<string, unknown>;

function studentFieldValue(student: StudentRow, field: string): unknown {
  return student[field];
}

function matchesWidgetFilter(
  student: StudentRow,
  filterField?: string,
  filterOperator?: StudentsWidgetFilterOperator,
  filterValue?: string,
): boolean {
  if (!filterField) return true;
  const val = studentFieldValue(student, filterField);
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

function filterStudentsForWidget(students: StudentRow[], query: StudentsWidgetQuery): StudentRow[] {
  return students.filter((student) =>
    matchesWidgetFilter(student, query.filterField, query.filterOperator, query.filterValue),
  );
}

function aggregateNumericField(
  items: StudentRow[],
  operation: 'sum' | 'avg',
  targetField: string,
): number {
  let sum = 0;
  let count = 0;
  items.forEach((item) => {
    const num = Number(studentFieldValue(item, targetField));
    if (!Number.isNaN(num)) {
      sum += num;
      count += 1;
    }
  });
  if (operation === 'sum') return sum;
  return count > 0 ? Math.round(sum / count) : 0;
}

function buildChartData(items: StudentRow[], query: StudentsWidgetQuery): { name: string; value: number }[] {
  const xAxis = query.xAxisField || 'status';
  const groups: Record<string, StudentRow[]> = {};

  items.forEach((item) => {
    const keyVal = studentFieldValue(item, xAxis);
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

/** Server/client widget aggregate for students collection (globle2 §10). */
export function computeStudentsWidgetAggregate(
  students: StudentRow[],
  query: StudentsWidgetQuery,
): StudentsWidgetAggregateResult {
  const totalCount = students.length;
  const filtered = filterStudentsForWidget(students, query);

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

export function computeStudentsWidgetAggregates(
  students: StudentRow[],
  queries: StudentsWidgetQuery[],
): Record<string, StudentsWidgetAggregateResult> {
  const results: Record<string, StudentsWidgetAggregateResult> = {};
  for (const query of queries) {
    results[query.id] = computeStudentsWidgetAggregate(students, query);
  }
  return results;
}

export function studentsWidgetQueryFromWidget(widget: {
  id: string;
  operation: StudentsWidgetOperation;
  targetField?: string;
  filterField?: string;
  filterOperator?: StudentsWidgetFilterOperator;
  filterValue?: string;
  xAxisField?: string;
}): StudentsWidgetQuery {
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
