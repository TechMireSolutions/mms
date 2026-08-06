import { formatDate, formatDateTime } from "@mms/shared";

/** Format a student custom field value for Work table/cards/detail read rows. */
export function formatStudentListCustomValue(
  value: unknown,
  t: (key: "common.yes" | "common.no" | "contacts.table.emptyDash") => string,
): string {
  if (value == null) return t("contacts.table.emptyDash");
  if (typeof value === "string" && !value.trim()) return t("contacts.table.emptyDash");
  if (Array.isArray(value)) {
    const joined = value.map(String).filter(Boolean).join(", ");
    return joined || t("contacts.table.emptyDash");
  }
  if (typeof value === "boolean") {
    return value ? t("common.yes") : t("common.no");
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.includes("T") ? formatDateTime(value, true) : formatDate(value, true);
  }
  return String(value);
}

export function studentCustomFieldKeyFromColumn(columnKey: string): string | null {
  if (!columnKey.startsWith("custom:")) return null;
  return columnKey.slice("custom:".length);
}
