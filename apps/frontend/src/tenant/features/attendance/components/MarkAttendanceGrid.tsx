import { useRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Card } from "@/components/ui/card";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { DirectoryCardMetaGrid } from "@/components/ui/DirectoryCardMetaGrid";
import { DirectoryCardMetaTile } from "@/components/ui/DirectoryCardMetaTile";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
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
import { useWorkCardAction } from "@/hooks/useWorkCardAction";
import { getAttendanceStatusInfo, type AttendanceStatus } from "@/lib/data/attendanceData";
import { MarkAttendanceFieldControl } from "@/tenant/features/attendance/components/MarkAttendanceFieldControl";
import { useWorkDirectoryViewMode, type WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { cn } from "@/lib/utils";
import type { ModuleFieldDef } from "@mms/shared";
import type { AttendanceRow } from "@/tenant/features/attendance/components/markAttendanceTypes";

export interface MarkAttendanceGridProps {
  rows: AttendanceRow[];
  orderedFields: ModuleFieldDef[];
  statuses: AttendanceStatus[];
  isFieldEnabled: (fieldId: string) => boolean;
  onFieldChange: (studentId: string, key: string, value: unknown) => void;
  viewMode?: WorkDirectoryViewMode;
}

function MarkAttendanceStudentCard({
  row,
  statusInfo,
  enabledFields,
  onFieldChange,
  motionProps,
}: {
  row: AttendanceRow;
  statusInfo: ReturnType<typeof getAttendanceStatusInfo>;
  enabledFields: ModuleFieldDef[];
  onFieldChange: (studentId: string, key: string, value: unknown) => void;
  motionProps?: HTMLMotionProps<"div">;
}): React.JSX.Element {
  const { cardProps } = useWorkCardAction({
    entity: { id: row.studentId, name: row.name },
    selectedIds: [],
    canSelect: false,
  });

  return (
    <DirectoryEntityCard
      className={cn("space-y-3 p-4", statusInfo?.bg)}
      {...cardProps}
      {...motionProps}
    >
      <DirectoryCardHeader
        id={row.studentId}
        displayName={row.name}
        subtitle={<span className="font-mono text-xs text-muted-foreground">{row.rollNo}</span>}
        isSelected={false}
        onSelect={() => {}}
        selectAriaLabel=""
        showSelect={false}
      />
      <DirectoryCardMetaGrid className="grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/40 ms-0">
        {enabledFields.map((field) => (
          <DirectoryCardMetaTile
            key={field.id}
            label={`${field.label}${field.required ? " *" : ""}`}
            className={field.id === "notes" ? "sm:col-span-2" : ""}
          >
            <div className={field.id === "status" ? "flex justify-start mt-0.5" : "mt-0.5"}>
              <MarkAttendanceFieldControl row={row} field={field} idPrefix="mobile" onFieldChange={onFieldChange} />
            </div>
          </DirectoryCardMetaTile>
        ))}
      </DirectoryCardMetaGrid>
    </DirectoryEntityCard>
  );
}

export function MarkAttendanceGrid({
  rows,
  orderedFields,
  statuses,
  isFieldEnabled,
  onFieldChange,
  viewMode: propViewMode,
}: MarkAttendanceGridProps): React.JSX.Element {
  const { t } = useTranslation();
  const { viewMode: hookViewMode } = useWorkDirectoryViewMode();
  const viewMode = propViewMode ?? hookViewMode;
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
    enabled: isVirtualized && viewMode === "table",
  });

  const mobileVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => mobileParentRef.current,
    estimateSize: () => 140,
    overscan: 3,
    enabled: isVirtualized && viewMode === "cards",
  });

  return (
    <Card accentColor="primary" className="p-0 overflow-hidden">
      {viewMode === "cards" ? (
        <div
          ref={mobileParentRef}
          className={isVirtualized ? "space-y-3 p-3 max-h-160 overflow-y-auto" : "space-y-3 p-3"}
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
                    <MarkAttendanceStudentCard
                      row={row}
                      statusInfo={statusInfo}
                      enabledFields={enabledFields}
                      onFieldChange={onFieldChange}
                      motionProps={rowMotion()}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            rows.map((row) => {
              const statusInfo = getAttendanceStatusInfo(row.status, statuses);
              return (
                <MarkAttendanceStudentCard
                  key={row.studentId}
                  row={row}
                  statusInfo={statusInfo}
                  enabledFields={enabledFields}
                  onFieldChange={onFieldChange}
                  motionProps={rowMotion()}
                />
              );
            })
          )}
        </div>
      ) : (
        <div
          ref={desktopParentRef}
          className={isVirtualized ? "max-h-160 overflow-y-auto" : ""}
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
      )}
    </Card>
  );
}
