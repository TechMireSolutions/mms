import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { useListRowMotion } from "@/hooks/useListRowMotion";
import { getAttendanceStatusInfo, type AttendanceStatus } from "@/lib/data/attendanceData";
import { MarkAttendanceFieldControl } from "@/tenant/features/attendance/components/MarkAttendanceFieldControl";
import type { ModuleFieldDef } from "@mms/shared";
import type { AttendanceRow } from "@/tenant/features/attendance/components/markAttendanceTypes";

interface MarkAttendanceGridProps {
  rows: AttendanceRow[];
  orderedFields: ModuleFieldDef[];
  statuses: AttendanceStatus[];
  isFieldEnabled: (fieldId: string) => boolean;
  onFieldChange: (studentId: string, key: string, value: unknown) => void;
}

export function MarkAttendanceGrid({
  rows,
  orderedFields,
  statuses,
  isFieldEnabled,
  onFieldChange,
}: MarkAttendanceGridProps) {
  const { t } = useTranslation();
  const rowMotion = useListRowMotion({ layout: true });
  const enabledFields = orderedFields.filter((field) => isFieldEnabled(field.id));

  return (
    <Card accentColor="primary" className="p-0 overflow-hidden">
      <div className="space-y-3 p-3 md:hidden">
        {rows.length === 0 ? (
          <EmptyState title={t("attendance.mark.noStudents")} compact />
        ) : rows.map((row) => {
          const statusInfo = getAttendanceStatusInfo(row.status, statuses);
          return (
            <motion.article
              key={row.studentId}
              {...rowMotion()}
              className={`space-y-3 rounded-xl border border-border p-3 ${statusInfo?.bg || ""}`}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <h3 className="min-w-0 break-words text-sm font-semibold text-foreground">{row.name}</h3>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">{row.rollNo}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {enabledFields.map((field) => (
                  <div key={field.id} className={field.id === "notes" ? "sm:col-span-2" : ""}>
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">
                      {field.label} {field.required ? "*" : ""}
                    </p>
                    <div className={field.id === "status" ? "flex justify-start" : ""}>
                      <MarkAttendanceFieldControl row={row} field={field} idPrefix="mobile" onFieldChange={onFieldChange} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.article>
          );
        })}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 border-b border-border">
            <tr>
              <th className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase w-8">#</th>
              <th className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("attendance.columns.student")}</th>
              {enabledFields.map((field) => (
                <th
                  key={field.id}
                  className={`px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase ${
                    field.id === "status" ? "text-center" : "text-start"
                  } ${field.id === "timeIn" || field.id === "timeOut" ? "w-28" : ""}`}
                >
                  {field.label} {field.required ? "*" : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr><td colSpan={enabledFields.length + 2} className="py-4"><EmptyState title={t("attendance.mark.noStudents")} compact /></td></tr>
            ) : rows.map((row) => {
              const statusInfo = getAttendanceStatusInfo(row.status, statuses);
              return (
                <motion.tr key={row.studentId} {...rowMotion()} className={`transition-colors hover:bg-muted/20 ${statusInfo?.bg || ""}`}>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground font-mono">{row.rollNo}</td>
                  <td className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{row.name}</td>
                  {enabledFields.map((field) => (
                    <td key={field.id} className="px-3 py-2.5">
                      <div className={field.id === "status" ? "flex justify-center" : ""}>
                        <MarkAttendanceFieldControl row={row} field={field} idPrefix="table" onFieldChange={onFieldChange} />
                      </div>
                    </td>
                  ))}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
