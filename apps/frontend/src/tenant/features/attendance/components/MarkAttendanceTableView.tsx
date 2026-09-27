import React, { useRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
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
import { getAttendanceStatusInfo, type AttendanceStatus } from "@/lib/data/attendanceData";
import { MarkAttendanceFieldControl } from "./MarkAttendanceFieldControl";
import type { ModuleFieldDef } from "@mms/shared";
import type { AttendanceRow } from "./markAttendanceTypes";

export interface MarkAttendanceTableViewProps {
  rows: AttendanceRow[];
  enabledFields: ModuleFieldDef[];
  statuses: AttendanceStatus[];
  onFieldChange: (studentId: string, key: string, value: unknown) => void;
  rowMotion: () => HTMLMotionProps<"tr">;
}

export function MarkAttendanceTableView({
  rows,
  enabledFields,
  statuses,
  onFieldChange,
  rowMotion,
}: MarkAttendanceTableViewProps): React.JSX.Element {
  const { t } = useTranslation();
  const desktopParentRef = useRef<HTMLDivElement>(null);
  const isVirtualized = rows.length > 30;

  const desktopVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => desktopParentRef.current,
    estimateSize: () => 48,
    overscan: 5,
    enabled: isVirtualized,
  });

  return (
    <div
      ref={desktopParentRef}
      className={isVirtualized ? "max-h-160 overflow-y-auto" : ""}
    >
      <Table>
        <TableHeader
          className={`bg-muted/60 border-b border-border ${
            isVirtualized ? "sticky top-0 z-10 backdrop-blur-sm" : ""
          }`}
        >
          <TableRow>
            <TableHead className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase w-8">
              #
            </TableHead>
            <TableHead className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">
              {t("attendance.columns.student")}
            </TableHead>
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
                  <motion.tr
                    key={row.studentId}
                    {...rowMotion()}
                    className={`transition-colors hover:bg-muted/20 ${statusInfo?.bg || ""}`}
                  >
                    <TableCell className="px-3 py-2.5 text-xs text-muted-foreground font-mono">
                      {row.rollNo}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">
                      {row.name}
                    </TableCell>
                    {enabledFields.map((field) => (
                      <TableCell key={field.id} className="px-3 py-2.5">
                        <div className={field.id === "status" ? "flex justify-center" : ""}>
                          <MarkAttendanceFieldControl
                            row={row}
                            field={field}
                            idPrefix="table"
                            onFieldChange={onFieldChange}
                          />
                        </div>
                      </TableCell>
                    ))}
                  </motion.tr>
                );
              })}
              {desktopVirtualizer.getVirtualItems().length > 0 && (
                <tr
                  style={{
                    height: `${Math.max(
                      0,
                      desktopVirtualizer.getTotalSize() -
                        (desktopVirtualizer.getVirtualItems()[
                          desktopVirtualizer.getVirtualItems().length - 1
                        ]?.end ?? 0),
                    )}px`,
                  }}
                >
                  <td colSpan={enabledFields.length + 2} />
                </tr>
              )}
            </>
          ) : (
            rows.map((row) => {
              const statusInfo = getAttendanceStatusInfo(row.status, statuses);
              return (
                <motion.tr
                  key={row.studentId}
                  {...rowMotion()}
                  className={`transition-colors hover:bg-muted/20 ${statusInfo?.bg || ""}`}
                >
                  <TableCell className="px-3 py-2.5 text-xs text-muted-foreground font-mono">
                    {row.rollNo}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">
                    {row.name}
                  </TableCell>
                  {enabledFields.map((field) => (
                    <TableCell key={field.id} className="px-3 py-2.5">
                      <div className={field.id === "status" ? "flex justify-center" : ""}>
                        <MarkAttendanceFieldControl
                          row={row}
                          field={field}
                          idPrefix="table"
                          onFieldChange={onFieldChange}
                        />
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
  );
}
