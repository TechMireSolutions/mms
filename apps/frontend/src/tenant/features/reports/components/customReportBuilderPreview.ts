import type { AppTranslationKey } from "@mms/shared";
import {
  getContactReportCellValue,
  isContactsReportFieldId,
} from "@mms/shared";
import type { AggregateFn, DataSource, PreviewRow } from "./customReportBuilderFields";

interface PreviewCollections {
  contacts: readonly Record<string, unknown>[];
  students: readonly Record<string, unknown>[];
  sessions: readonly Record<string, unknown>[];
  financial: readonly Record<string, unknown>[];
  attendance: readonly Record<string, unknown>[];
  hasanat: readonly Record<string, unknown>[];
  academic: readonly Record<string, unknown>[];
}

interface BuildPreviewRowsParams {
  source: DataSource;
  selectedFields: readonly string[];
  aggregate: AggregateFn;
  groupBy: string;
  collections: PreviewCollections;
  currencyCode: string;
  translate: (key: AppTranslationKey) => string;
  resolveFieldLabel: (field: string) => string;
}

function toCamelCase(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9 ]/g, "");
  return cleaned
    .split(" ")
    .map((word, index) => index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function getSourceRows(
  source: DataSource,
  collections: PreviewCollections,
  translate: (key: AppTranslationKey) => string,
): readonly Record<string, unknown>[] {
  if (source === "contacts") return collections.contacts;
  if (source === "students") return collections.students;
  if (source === "sessions") return collections.sessions;
  if (source === "financial") return collections.financial;
  if (source === "attendance") return collections.attendance;
  if (source === "hasanat") return collections.hasanat;
  if (source === "academic") return collections.academic;

  const workloadByFacultyName: Record<string, { classes: Set<string>, sessions: Set<string>, students: number }> = {};
  collections.sessions.forEach((session) => {
    const classes = session.classes as { id: string; teacherName?: string; enrolled: number }[] | undefined;
    if (classes) {
      classes.forEach((sessionClass) => {
        const facultyName = sessionClass.teacherName || translate("reports.builder.unassigned");
        if (!workloadByFacultyName[facultyName]) {
          workloadByFacultyName[facultyName] = { classes: new Set(), sessions: new Set(), students: 0 };
        }
        workloadByFacultyName[facultyName].classes.add(sessionClass.id);
        workloadByFacultyName[facultyName].sessions.add(String(session.id));
        workloadByFacultyName[facultyName].students += Number(sessionClass.enrolled || 0);
      });
    }
  });

  return Object.entries(workloadByFacultyName).map(([facultyName, workload]) => ({
    facultyName,
    classes: workload.classes.size,
    sessions: workload.sessions.size,
    totalStudents: workload.students,
    // Legacy "Hours/Week" column maps to class count — hours are not tracked.
    hoursWeek: workload.classes.size,
    specialization: translate("reports.builder.generalStudies"),
  }));
}

function buildFlatPreviewRows({
  source,
  selectedFields,
  collections,
  currencyCode,
  translate,
  resolveFieldLabel,
}: BuildPreviewRowsParams): PreviewRow[] {
  const sourceRows = getSourceRows(source, collections, translate);
  const cellLabels = { yes: translate("common.yes"), no: translate("common.no") };

  return sourceRows.map((sourceRow) => {
    const row: PreviewRow = {};
    selectedFields.forEach((selectedField) => {
      const label = resolveFieldLabel(selectedField);
      if (source === "contacts" && isContactsReportFieldId(selectedField)) {
        row[label] = getContactReportCellValue(sourceRow, selectedField, cellLabels);
        return;
      }
      const camel = toCamelCase(selectedField);
      if (selectedField === "Name" || selectedField === "Student Name" || selectedField === "Faculty Name" || selectedField === "Faculty") {
        row[label] = String(sourceRow.name || sourceRow.studentName || sourceRow.facultyName || sourceRow.faculty || "—");
      }
      else if (selectedField === "Status") row[label] = String(sourceRow.status || "—");
      else if (selectedField === "Class") row[label] = String(sourceRow.class || sourceRow.className || (sourceRow.classes as { name: string }[] | undefined)?.[0]?.name || "—");
      else if (selectedField === "Session") row[label] = String(sourceRow.session || "—");
      else if (selectedField === "Teacher") row[label] = String(sourceRow.teacher || sourceRow.teacherName || "—");
      else if (selectedField === "Room") row[label] = String(sourceRow.room || "—");
      else if (selectedField === "Time") row[label] = String(sourceRow.time || "—");
      else if (selectedField === "Days") row[label] = Array.isArray(sourceRow.days) ? sourceRow.days.join(", ") : String(sourceRow.days || "—");
      else if (selectedField === "Discount Type") row[label] = String(sourceRow.discountType || "None");
      else if (selectedField === "Discount %" || selectedField === "Discount") {
        row[label] = sourceRow.discountPct !== undefined ? `${sourceRow.discountPct}%` : (sourceRow.discountAmt ? `${currencyCode} ${sourceRow.discountAmt}` : "0");
      }
      else if (selectedField === "Final Amount") row[label] = sourceRow.finalAmt ? `${currencyCode} ${sourceRow.finalAmt}` : "0";
      else if (selectedField === "Utilisation %" || selectedField === "Rate %") {
        row[label] = (Number(sourceRow.capacity || 0) > 0 ? `${Math.round((Number(sourceRow.enrolled || 0) / Number(sourceRow.capacity || 1)) * 100)}%` : (sourceRow.rate ? `${sourceRow.rate}%` : "100%"));
      }
      else if (selectedField === "Registration Date" || selectedField === "Issued Date" || selectedField === "Due Date" || selectedField === "Date" || selectedField === "Last Marked" || selectedField === "Last Awarded") {
        row[label] = String(sourceRow.registeredDate || sourceRow.issuedDate || sourceRow.dueDate || sourceRow.date || sourceRow.lastMarked || sourceRow.lastAwarded || "—");
      }
      else {
        const rawValue = sourceRow[camel] !== undefined ? sourceRow[camel] : sourceRow[selectedField.toLowerCase().replace(/ /g, "")];
        row[label] = rawValue !== undefined ? String(rawValue) : "—";
      }
    });
    return row;
  });
}

function applyPreviewAggregates(
  rows: readonly PreviewRow[],
  selectedFields: readonly string[],
  aggregate: AggregateFn,
  groupBy: string,
  resolveFieldLabel: (field: string) => string,
): PreviewRow[] {
  if (!groupBy || aggregate === "None") {
    return [...rows];
  }

  const groupByLabel = resolveFieldLabel(groupBy);
  const groups: Record<string, PreviewRow[]> = {};
  rows.forEach((row) => {
    const groupValue = String(row[groupByLabel] || "Unspecified");
    if (!groups[groupValue]) groups[groupValue] = [];
    groups[groupValue].push(row);
  });

  return Object.entries(groups).map(([groupName, groupRows]) => {
    const summaryRow: PreviewRow = { [groupByLabel]: groupName };
    selectedFields.forEach((selectedField) => {
      if (selectedField === groupBy) return;
      const fieldLabel = resolveFieldLabel(selectedField);
      const values = groupRows
        .map((row) => Number(String(row[fieldLabel]).replace(/[^0-9.-]/g, "")))
        .filter((value) => !isNaN(value));

      if (aggregate === "Count") {
        summaryRow[fieldLabel] = groupRows.length;
      } else if (values.length === 0) {
        summaryRow[fieldLabel] = "—";
      } else {
        switch (aggregate) {
          case "Sum":
            summaryRow[fieldLabel] = values.reduce((sum, value) => sum + value, 0);
            break;
          case "Average":
            summaryRow[fieldLabel] = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
            break;
          case "Max":
            summaryRow[fieldLabel] = Math.max(...values);
            break;
          case "Min":
            summaryRow[fieldLabel] = Math.min(...values);
            break;
          default:
            summaryRow[fieldLabel] = "—";
        }
      }
    });
    return summaryRow;
  });
}

export function buildCustomReportPreviewRows(params: BuildPreviewRowsParams): PreviewRow[] {
  const flatRows = buildFlatPreviewRows(params);
  return applyPreviewAggregates(
    flatRows,
    params.selectedFields,
    params.aggregate,
    params.groupBy,
    params.resolveFieldLabel,
  ).slice(0, 20);
}
