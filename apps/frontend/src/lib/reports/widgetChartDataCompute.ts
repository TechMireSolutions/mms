import type { CustomWidget } from "./pinnedWidgetTypes";
import type { ReportCollectionsSnapshot } from "@/lib/reports/useReportCollections";
import type { Denomination } from "@/lib/data/hasanatData";
import { getDenominationPoints, matchesWidgetFilter } from "@mms/shared";
import {
  readContactsWidgetAggregate,
  readStudentsWidgetAggregate,
  readTeachersWidgetAggregate,
  readSessionsWidgetAggregate,
  readEnrollmentsWidgetAggregate,
} from "./widgetAggregateReaders.js";

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
  if (widget.collection === "teachers" || widget.collection === "faculty") {
    const aggregate = readTeachersWidgetAggregate(widget.id);
    return aggregate?.chartData ?? [];
  }
  if (widget.collection === "sessions") {
    const aggregate = readSessionsWidgetAggregate(widget.id);
    return aggregate?.chartData ?? [];
  }
  if (widget.collection === "enrollments") {
    const aggregate = readEnrollmentsWidgetAggregate(widget.id);
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
