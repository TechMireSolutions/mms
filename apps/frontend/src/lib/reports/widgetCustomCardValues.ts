import type { CustomWidget } from './pinnedWidgetTypes';
import {
  readContactsWidgetAggregate,
  readStudentsWidgetAggregate,
  readTeachersWidgetAggregate,
  readSessionsWidgetAggregate,
} from './widgetAggregateReaders.js';

function computeGenericCustomCardValue(
  card: {
    operation: CustomWidget['operation'];
  },
  aggregate: { value: number; totalCount: number } | undefined,
): { numericValue: number; finalValue: string | number; totalCount: number } | null {
  if (!aggregate) return null;

  let displayValue: string | number = aggregate.value;
  if (card.operation === 'percentage') {
    displayValue = `${aggregate.value}%`;
  }

  return {
    numericValue: aggregate.value,
    finalValue: displayValue,
    totalCount: aggregate.totalCount,
  };
}

/** Resolve dashboard card values for contacts via server widget aggregates. */
export function computeContactsCustomCardValue(
  card: {
    id: string;
    operation: CustomWidget['operation'];
    targetField?: string;
    filterField?: string;
    filterOperator?: CustomWidget['filterOperator'];
    filterValue?: string;
  },
) {
  return computeGenericCustomCardValue(card, readContactsWidgetAggregate(card.id));
}

/** Resolve dashboard card values for students via server widget aggregates. */
export function computeStudentsCustomCardValue(
  card: {
    id: string;
    operation: CustomWidget['operation'];
    targetField?: string;
    filterField?: string;
    filterOperator?: CustomWidget['filterOperator'];
    filterValue?: string;
  },
) {
  return computeGenericCustomCardValue(card, readStudentsWidgetAggregate(card.id));
}

/** Resolve dashboard card values for teachers via server widget aggregates. */
export function computeTeachersCustomCardValue(
  card: {
    id: string;
    operation: CustomWidget['operation'];
    targetField?: string;
    filterField?: string;
    filterOperator?: CustomWidget['filterOperator'];
    filterValue?: string;
  },
) {
  return computeGenericCustomCardValue(card, readTeachersWidgetAggregate(card.id));
}

/** Resolve dashboard card values for sessions via server widget aggregates. */
export function computeSessionsCustomCardValue(
  card: {
    id: string;
    operation: CustomWidget['operation'];
    targetField?: string;
    filterField?: string;
    filterOperator?: CustomWidget['filterOperator'];
    filterValue?: string;
  },
) {
  return computeGenericCustomCardValue(card, readSessionsWidgetAggregate(card.id));
}
