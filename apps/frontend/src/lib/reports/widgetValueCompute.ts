import type { CustomWidget } from "./pinnedWidgetTypes";
import type { ReportCollectionsSnapshot } from "@/lib/reports/useReportCollections";
import type { Denomination } from "@/lib/data/hasanatData";
import { getDenominationPoints, matchesWidgetFilter } from "@mms/shared";
import {
  formatGenericWidgetValue,
  readContactsTotalFromMetrics,
  readContactsWidgetAggregate,
  readStudentsTotalFromMetrics,
  readStudentsWidgetAggregate,
  readTeachersTotalFromMetrics,
  readTeachersWidgetAggregate,
} from "./widgetAggregateReaders.js";
import { getFilteredRecords } from "./widgetCollectionSnapshot.js";

export {
  computeContactsCustomCardValue,
  computeStudentsCustomCardValue,
  computeTeachersCustomCardValue,
} from "./widgetCustomCardValues";

function resolveHasanatPoints(
  record: Record<string, unknown>,
  denominations: Denomination[] | undefined,
): number {
  return getDenominationPoints(
    typeof record.denominationId === "string" ? record.denominationId : null,
    typeof record.denominationName === "string" ? record.denominationName : null,
    denominations,
  );
}

export function computeWidgetSingleValue(
  widget: CustomWidget,
  collections: ReportCollectionsSnapshot,
): { value: number; formattedValue: string; isAlert: boolean; totalCount: number } {
  if (widget.collection === "contacts") {
    const aggregate = readContactsWidgetAggregate(widget.id);
    if (aggregate) {
      return formatGenericWidgetValue(widget, aggregate);
    }
    const totalCount = readContactsTotalFromMetrics();
    return {
      value: 0,
      formattedValue: widget.operation === "percentage" ? "0%" : "0",
      isAlert: false,
      totalCount,
    };
  }

  if (widget.collection === "students") {
    const aggregate = readStudentsWidgetAggregate(widget.id);
    if (aggregate) {
      return formatGenericWidgetValue(widget, aggregate);
    }
    const totalCount = readStudentsTotalFromMetrics();
    return {
      value: 0,
      formattedValue: widget.operation === "percentage" ? "0%" : "0",
      isAlert: false,
      totalCount,
    };
  }

  if (widget.collection === "teachers") {
    const aggregate = readTeachersWidgetAggregate(widget.id);
    if (aggregate) {
      return formatGenericWidgetValue(widget, aggregate);
    }
    const totalCount = readTeachersTotalFromMetrics();
    return {
      value: 0,
      formattedValue: widget.operation === "percentage" ? "0%" : "0",
      isAlert: false,
      totalCount,
    };
  }

  const filteredRecords = getFilteredRecords(widget, collections);
  const totalInCollection = (collections[widget.collection] || []).length;
  let computedValue = 0;

  if (widget.operation === "count") {
    computedValue = filteredRecords.length;
  } else if (widget.operation === "percentage") {
    computedValue = totalInCollection > 0 ? Math.round((filteredRecords.length / totalInCollection) * 100) : 0;
  } else {
    const targetField = widget.targetField || "";
    let numericTotal = 0;
    let numericRecordCount = 0;
    filteredRecords.forEach((filteredRecord) => {
      if (widget.collection === "hasanat_distributions" && targetField === "points") {
        numericTotal += Number(filteredRecord.quantity || 1) * resolveHasanatPoints(
          filteredRecord,
          collections.hasanat_denoms,
        );
        numericRecordCount++;
      } else {
        const numericValue = Number(filteredRecord[targetField]);
        if (!isNaN(numericValue)) {
          numericTotal += numericValue;
          numericRecordCount++;
        }
      }
    });
    computedValue = widget.operation === "sum" ? numericTotal : (numericRecordCount > 0 ? Math.round(numericTotal / numericRecordCount) : 0);
  }

  return formatGenericWidgetValue(widget, { value: computedValue, totalCount: totalInCollection });
}

export function computeWidgetChartData(
  widget: CustomWidget,
  collections: ReportCollectionsSnapshot,
): { name: string; value: number }[] {
  if (widget.collection === "contacts") {
    const aggregate = readContactsWidgetAggregate(widget.id);
    return aggregate?.chartData ?? [];
  }
  if (widget.collection === "students") {
    const aggregate = readStudentsWidgetAggregate(widget.id);
    return aggregate?.chartData ?? [];
  }
  if (widget.collection === "teachers") {
    const aggregate = readTeachersWidgetAggregate(widget.id);
    return aggregate?.chartData ?? [];
  }

  const collectionRecords = collections[widget.collection] || [];
  const filteredRecords = collectionRecords.filter((collectionRecord) =>
    matchesWidgetFilter(
      collectionRecord as Record<string, unknown>,
      widget.filterField,
      widget.filterOperator,
      widget.filterValue,
    )
  );

  const xAxis = widget.xAxisField || "status";
  const groups: Record<string, Record<string, unknown>[]> = {};
  filteredRecords.forEach((filteredRecord) => {
    const groupValue = (filteredRecord as Record<string, unknown>)[xAxis];
    const groupKey = groupValue === undefined || groupValue === null || groupValue === "" ? "Unknown" : String(groupValue);
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(filteredRecord as Record<string, unknown>);
  });

  const chartData = Object.entries(groups).map(([groupName, groupRecords]) => {
    let computedValue = 0;
    if (widget.operation === "count") {
      computedValue = groupRecords.length;
    } else {
      const targetField = widget.targetField || "";
      let numericTotal = 0;
      let numericRecordCount = 0;
      groupRecords.forEach((groupRecord) => {
        if (widget.collection === "hasanat_distributions" && targetField === "points") {
          numericTotal += Number(groupRecord.quantity || 1) * resolveHasanatPoints(
            groupRecord,
            collections.hasanat_denoms,
          );
          numericRecordCount++;
        } else {
          const numericValue = Number(groupRecord[targetField]);
          if (!isNaN(numericValue)) {
            numericTotal += numericValue;
            numericRecordCount++;
          }
        }
      });
      computedValue = widget.operation === "sum" ? numericTotal : (numericRecordCount > 0 ? Math.round(numericTotal / numericRecordCount) : 0);
    }
    return { name: groupName, value: computedValue };
  });

  return chartData.sort((firstItem, secondItem) => secondItem.value - firstItem.value).slice(0, 8);
}
