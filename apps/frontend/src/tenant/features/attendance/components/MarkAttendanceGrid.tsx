import { useRef } from "react";
import { motion } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/hooks/useTranslation";
import { useListRowMotion } from "@/hooks/useListRowMotion";
import { getAttendanceStatusInfo, type AttendanceStatus } from "@/lib/data/attendanceData";
import { MarkAttendanceFieldControl } from "@/tenant/features/attendance/components/MarkAttendanceFieldControl";
import type { ModuleFieldDef } from "@mms/shared";
import type { AttendanceRow } from "@/tenant/features/attendance/components/markAttendanceTypes";

export interface MarkAttendanceGridProps {
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
}: MarkAttendanceGridProps): React.JSX.Element {
  const { t } = useTranslation();
  const rowMotion = useListRowMotion({ layout: true });
  const enabledFields = orderedFields.filter((field) => isFieldEnabled(field.id));

  const desktopParentRef = useRef<HTMLDivElement>(null);
  const mobileParentRef = useRef<HTMLDivElement>(null);
  const isVirtualized = rows.length > 30;

  const desktopVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => desktopParentRef.current,
    estimateSize: () => 48,
    overscan: 5,
    enabled: isVirtualized,
  });

  const mobileVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => mobileParentRef.current,
    estimateSize: () => 140,
    overscan: 3,
    enabled: isVirtualized,
  });

  return (
    <Card accentColor="primary" className="p-0 overflow-hidden">
      <div
        ref={mobileParentRef}
        className={isVirtualized ? "space-y-3 p-3 md:hidden max-h-160 overflow-y-auto" : "space-y-3 p-3 md:hidden"}
      >
        {rows.length === 0 ? (
          <EmptyState title={t("attendance.mark.noStudents")} compact />
        ) : isVirtualized ? (
          <div style={{ height: `${mobileVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
            {mobileVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              const statusInfo = getAttendanceStatusInfo(row.status, statuses);
              return (
                <div
                  key={row.studentId}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="pb-3"
                >
                  <motion.article
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
                </div>
              );
            })}
          </div>
        ) : (
          rows.map((row) => {
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
          })
        )}
      </div>
      <div
        ref={desktopParentRef}
        className={isVirtualized ? "hidden md:block max-h-160 overflow-y-auto" : "hidden md:block"}
      >
        <Table>
          <TableHeader className={`bg-muted/60 border-b border-border ${isVirtualized ? "sticky top-0 z-10 backdrop-blur-sm" : ""}`}>
            <TableRow>
              <TableHead className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase w-8">#</TableHead>
              <TableHead className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("attendance.columns.student")}</TableHead>
              {enabledFields.map((field) => (
                <TableHead
                  key={field.id}
                  className={`px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase ${
                    field.id === "status" ? "text-center" : "text-start"
                  } ${field.id === "timeIn" || field.id === "timeOut" ? "w-28" : ""}`}
                >
                  {field.label} {field.required ? "*" : ""}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={enabledFields.length + 2} className="py-4">
                  <EmptyState title={t("attendance.mark.noStudents")} compact />
                </TableCell>
              </TableRow>
            ) : isVirtualized ? (
              <>
                {desktopVirtualizer.getVirtualItems().length > 0 && (
                  <tr style={{ height: `${desktopVirtualizer.getVirtualItems()[0].start}px` }}>
                    <td colSpan={enabledFields.length + 2} />
                  </tr>
                )}
                {desktopVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  const statusInfo = getAttendanceStatusInfo(row.status, statuses);
                  return (
                    <motion.tr key={row.studentId} {...rowMotion()} className={`transition-colors hover:bg-muted/20 ${statusInfo?.bg || ""}`}>
                      <TableCell className="px-3 py-2.5 text-xs text-muted-foreground font-mono">{row.rollNo}</TableCell>
                      <TableCell className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{row.name}</TableCell>
                      {enabledFields.map((field) => (
                        <TableCell key={field.id} className="px-3 py-2.5">
                          <div className={field.id === "status" ? "flex justify-center" : ""}>
                            <MarkAttendanceFieldControl row={row} field={field} idPrefix="table" onFieldChange={onFieldChange} />
                          </div>
                        </TableCell>
                      ))}
                    </motion.tr>
                  );
                })}
                {desktopVirtualizer.getVirtualItems().length > 0 && (
                  <tr style={{ height: `${Math.max(0, desktopVirtualizer.getTotalSize() - (desktopVirtualizer.getVirtualItems()[desktopVirtualizer.getVirtualItems().length - 1]?.end ?? 0))}px` }}>
                    <td colSpan={enabledFields.length + 2} />
                  </tr>
                )}
              </>
            ) : (
              rows.map((row) => {
                const statusInfo = getAttendanceStatusInfo(row.status, statuses);
                return (
                  <motion.tr key={row.studentId} {...rowMotion()} className={`transition-colors hover:bg-muted/20 ${statusInfo?.bg || ""}`}>
                    <TableCell className="px-3 py-2.5 text-xs text-muted-foreground font-mono">{row.rollNo}</TableCell>
                    <TableCell className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{row.name}</TableCell>
                    {enabledFields.map((field) => (
                      <TableCell key={field.id} className="px-3 py-2.5">
                        <div className={field.id === "status" ? "flex justify-center" : ""}>
                          <MarkAttendanceFieldControl row={row} field={field} idPrefix="table" onFieldChange={onFieldChange} />
                        </div>
                      </TableCell>
                    ))}
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
