import { getCollection } from "@/lib/db";
import type { CustomWidget } from "./types";

export function getWidgetCollections() {
  const contacts = getCollection("contacts");
  const invoices = getCollection("finance_invoices");
  const students = getCollection("students");
  const attendance = getCollection("attendance_records");
  const distributions = getCollection("hasanat_distributions");
  const sessions = getCollection("sessions");
  const questions = getCollection("questions");
  const tests = getCollection("tests");
  const results = getCollection("assessment_results");
  
  return {
    students,
    sessions,
    finance_invoices: invoices,
    attendance_records: attendance,
    hasanat_distributions: distributions,
    contacts,
    questions,
    tests,
    assessment_results: results
  };
}

/**
 * Filters a collection in real-time based on widget query conditions.
 * 
 * @param widget The custom widget schema configuration.
 * @param collections Loaded client database collections.
 * @returns Array of filtered record objects.
 */
export function getFilteredRecords(
  widget: CustomWidget,
  collections: ReturnType<typeof getWidgetCollections>
): Record<string, unknown>[] {
  const list = (collections[widget.collection] || []) as Record<string, unknown>[];
  if (!widget.filterField) return list;
  
  return list.filter((item) => {
    if (!item) return false;
    const val = item[widget.filterField || ""];
    if (val === undefined || val === null) return false;
    
    const strVal = String(val).toLowerCase();
    const strTargetVal = String(widget.filterValue || "").toLowerCase();
    
    switch (widget.filterOperator) {
      case "equals":
        return strVal === strTargetVal;
      case "contains":
        return strVal.includes(strTargetVal);
      case "gt":
        return Number(val) > Number(widget.filterValue);
      case "lt":
        return Number(val) < Number(widget.filterValue);
      default:
        return true;
    }
  });
}

/**
 * Computes the single metric conclusion of a widget in real-time.
 * 
 * @param widget The custom widget schema.
 * @param collections Loaded client databases.
 * @returns Aggregated number, formatted string value, and threshold alarm state.
 */
export function computeWidgetSingleValue(
  widget: CustomWidget,
  collections: ReturnType<typeof getWidgetCollections>
): { value: number; formattedValue: string; isAlert: boolean; totalCount: number } {
  const filtered = getFilteredRecords(widget, collections);
  const totalInCollection = (collections[widget.collection] || []).length;
  let finalVal = 0;
  
  if (widget.operation === "count") {
    finalVal = filtered.length;
  } else if (widget.operation === "percentage") {
    finalVal = totalInCollection > 0 ? Math.round((filtered.length / totalInCollection) * 100) : 0;
  } else {
    const field = widget.targetField || "";
    let sum = 0;
    let count = 0;
    filtered.forEach((item) => {
      if (widget.collection === "hasanat_distributions" && field === "points") {
        let points = 50;
        const denom = String(item.denominationName || "").toLowerCase();
        if (denom.includes("silver")) points = 150;
        else if (denom.includes("gold")) points = 500;
        else if (denom.includes("platinum")) points = 1000;
        else if (denom.includes("diamond")) points = 2500;
        sum += Number(item.quantity || 1) * points;
        count++;
      } else {
        const num = Number(item[field]);
        if (!isNaN(num)) {
          sum += num;
          count++;
        }
      }
    });
    finalVal = widget.operation === "sum" ? sum : (count > 0 ? Math.round(sum / count) : 0);
  }

  let formattedValue = String(finalVal);
  if (widget.widgetType === "progress" || widget.operation === "percentage") {
    formattedValue = `${finalVal}%`;
  } else if (widget.collection === "finance_invoices" && widget.operation !== "count") {
    formattedValue = `₨ ${finalVal.toLocaleString()}`;
  } else {
    formattedValue = finalVal.toLocaleString();
  }

  let isAlert = false;
  if (widget.thresholdEnabled && widget.thresholdValue !== undefined) {
    const numVal = Number(finalVal);
    const numThreshold = Number(widget.thresholdValue);
    switch (widget.thresholdCondition) {
      case "lt":
        isAlert = numVal < numThreshold;
        break;
      case "gt":
        isAlert = numVal > numThreshold;
        break;
      case "equals":
        isAlert = numVal === numThreshold;
        break;
    }
  }

  return { value: finalVal, formattedValue, isAlert, totalCount: totalInCollection };
}

/**
 * Computes grouped data records specifically for visualizer chart fallbacks.
 */
export function computeWidgetChartData(
  widget: CustomWidget,
  collections: ReturnType<typeof getWidgetCollections>
): { name: string; value: number }[] {
  const list = collections[widget.collection] || [];
  const filteredList = list.filter((item) => {
    if (!item) return false;
    if (!widget.filterField) return true;
    const val = (item as Record<string, unknown>)[widget.filterField];
    if (val === undefined || val === null) return false;
    const strVal = String(val).toLowerCase();
    const strTargetVal = String(widget.filterValue || "").toLowerCase();
    switch (widget.filterOperator) {
      case "equals":
        return strVal === strTargetVal;
      case "contains":
        return strVal.includes(strTargetVal);
      case "gt":
        return Number(val) > Number(widget.filterValue);
      case "lt":
        return Number(val) < Number(widget.filterValue);
      default:
        return true;
    }
  });

  const xAxis = widget.xAxisField || "status";
  const groups: Record<string, Record<string, unknown>[]> = {};
  filteredList.forEach((item) => {
    const keyVal = (item as Record<string, unknown>)[xAxis];
    const key = keyVal === undefined || keyVal === null || keyVal === "" ? "Unknown" : String(keyVal);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item as Record<string, unknown>);
  });

  const data = Object.entries(groups).map(([groupName, items]) => {
    let finalVal = 0;
    if (widget.operation === "count") {
      finalVal = items.length;
    } else {
      const field = widget.targetField || "";
      let sum = 0;
      let count = 0;
      items.forEach((item) => {
        if (widget.collection === "hasanat_distributions" && field === "points") {
          let points = 50;
          const denom = String(item.denominationName || "").toLowerCase();
          if (denom.includes("silver")) points = 150;
          else if (denom.includes("gold")) points = 500;
          else if (denom.includes("platinum")) points = 1000;
          else if (denom.includes("diamond")) points = 2500;
          sum += Number(item.quantity || 1) * points;
          count++;
        } else {
          const num = Number(item[field]);
          if (!isNaN(num)) {
            sum += num;
            count++;
          }
        }
      });
      finalVal = widget.operation === "sum" ? sum : (count > 0 ? Math.round(sum / count) : 0);
    }
    return { name: groupName, value: finalVal };
  });

  return data.sort((a, b) => b.value - a.value).slice(0, 8);
}
