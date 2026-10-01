import React, { useState, useEffect, useCallback } from "react";
import { formatDateTime, todayISO } from "@mms/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClipboardList, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import { getAuditLog } from "@/tenant/features/attendance/components/MarkAttendance";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { type AttendanceFilterState } from "@/tenant/features/attendance/components/AttendanceFilters";
import { useTranslation } from "@/hooks/useTranslation";
import { FormSelect } from "@/components/ui/FormSelect";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import { reportClientError } from "@/lib/clientErrorReporting";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useWorkDirectoryViewMode, type WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { DirectoryCardsGrid } from "@/components/ui/DirectoryCardsGrid";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";
import { useStudentsByIds } from "@/tenant/hooks/collections/students";
import { uniqueRegistryIds } from "@/lib/registryResolve";
import {
  type AuditEntry,
  describeAuditEntry,
  buildAuditActionConfig,
} from "@/tenant/features/attendance/components/auditLogFormatters";

export type { AuditEntry };

export interface AuditLogProps {
  filters: Partial<AttendanceFilterState>;
  viewMode?: WorkDirectoryViewMode;
}

/**
 * AuditLog
 * 
 * Displays a log of actions taken regarding attendance (e.g., editing, bulk marking).
 * Allows filtering by class and date.
 */
export function AuditLog({ filters, viewMode: propViewMode }: AuditLogProps): React.JSX.Element {
  const { t } = useTranslation();
  const { viewMode: hookViewMode } = useWorkDirectoryViewMode();
  const viewMode = propViewMode ?? hookViewMode;
  const sessions = useSessionsCollection();
  const [log, setLog] = useState<AuditEntry[]>([]);
  const studentIds = uniqueRegistryIds(log.map((entry) => entry.studentId));
  const { data: students = [] } = useStudentsByIds(studentIds);
  const actionConfig = buildAuditActionConfig(t);

  const studentMap = (() => {
    const map = new Map<string, string>();
    for (const student of students) {
      if (student?.id != null && student.name) {
        map.set(String(student.id), student.name);
      }
    }
    return map;
  })();

  const studentNameFor = (id?: string): string => {
    if (!id) return "";
    return studentMap.get(String(id)) ?? "";
  };
  
  const allClasses = sessions.flatMap((session) =>
    (session.classes || []).map((sessionClass) => ({ ...sessionClass, sessionId: session.id, sessionName: session.name }))
  );

  const [classId, setClassId] = useState(filters.classId || "");
  const [date, setDate] = useState(filters.date || todayISO());

  const reload = useCallback(() => {
    try {
      const result = getAuditLog(classId, date);
      setLog(Array.isArray(result) ? result : []);
    } catch (error) {
      reportClientError(error, { context: "attendance.loadAuditLog" });
      setLog([]);
    }
  }, [classId, date]);

  useEffect(() => { reload(); }, [reload]);
  
  useEffect(() => {
    if (filters.classId) setClassId(filters.classId);
    if (filters.date) setDate(filters.date);
  }, [filters.classId, filters.date]);

  return (
    <section className="space-y-4">
      <SectionHeader
        layout="row"
        icon={<ClipboardList className="w-4 h-4 text-primary" aria-hidden="true" />}
        title={t("attendance.audit.title")}
        badge={<span className="text-xs text-muted-foreground">{t("attendance.audit.entriesCount", { count: log.length })}</span>}
        actions={
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={reload}
            aria-label={t("attendance.audit.reload")}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <label htmlFor="audit-class-select" className="sr-only">{t("attendance.audit.filterClass")}</label>
        <FormSelect
          id="audit-class-select"
          value={classId}
          onChange={setClassId}
          placeholder={t("attendance.audit.allClasses")}
          options={allClasses.map((sessionClass) => ({ value: sessionClass.id, label: sessionClass.name }))}
          className="text-sm min-w-audit-action"
        />
        
        <DatePicker
          id="audit-date-select"
          name="auditDate"
          value={date}
          onChange={setDate}
          aria-label={t("attendance.filters.date")}
          className="text-sm"
        />
      </div>

      {/* Log */}
      {log.length === 0 ? (
        <EmptyState
          variant="dashed"
          icon={ClipboardList}
          title={t("attendance.audit.emptyTitle")}
          description={t("attendance.audit.emptyDesc")}
          compact
        />
      ) : (
        <div className={WORK_SURFACE}>
          {viewMode === "cards" ? (
            <div className="p-3">
              <DirectoryCardsGrid className="grid-cols-1 sm:grid-cols-2">
                {log.map((entry, index) => (
                  <article key={index} className={`${WORK_SURFACE_INNER} space-y-2 p-3 rounded-lg border border-border/60`}>
                    <div className="flex items-start justify-between gap-2">
                      <time className="text-xs font-mono text-muted-foreground">{formatDateTime(entry.ts)}</time>
                      <StatusBadge status={entry.action} config={actionConfig} size="sm" />
                    </div>
                    <p className="text-xs text-foreground m-0">{describeAuditEntry(entry, studentNameFor, t)}</p>
                    {entry.by && (
                      <p className="text-xs font-semibold text-muted-foreground capitalize m-0">{entry.by}</p>
                    )}
                  </article>
                ))}
              </DirectoryCardsGrid>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                  <ModuleTableHeaderCell columnKey="time" className="px-3 py-2.5">{t("attendance.audit.colTime")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="action" className="px-3 py-2.5">{t("attendance.audit.colAction")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="details" className="px-3 py-2.5">{t("attendance.audit.colDetails")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="by" className="px-3 py-2.5">{t("attendance.audit.colBy")}</ModuleTableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/50">
                {log.map((entry, index) => (
                  <TableRow key={index} className="transition-colors hover:bg-muted/20">
                    <TableCell className="px-3 py-2.5 text-xs font-mono text-muted-foreground whitespace-nowrap">{formatDateTime(entry.ts)}</TableCell>
                    <TableCell className="px-3 py-2.5">
                      <StatusBadge status={entry.action} config={actionConfig} size="sm" />
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-xs text-foreground">{describeAuditEntry(entry, studentNameFor, t)}</TableCell>
                    <TableCell className="px-3 py-2.5 text-xs font-semibold text-muted-foreground capitalize">{entry.by || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </section>
  );
}
