import React, { useState, useEffect, useCallback } from "react";
import { formatDateTime, todayISO, type AppTranslationKey } from "@mms/shared";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClipboardList, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/DatePicker";
import { getAuditLog } from "@/tenant/features/attendance/components/MarkAttendance";
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { type AttendanceFilterState } from "@/tenant/features/attendance/components/AttendanceFilters";
import { useTranslation } from "@/hooks/useTranslation";
import { FormSelect } from "@/components/ui/FormSelect";
import { ModuleTableHeaderCell } from "@/components/ui/ModuleTableHeaderCell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge, type StatusBadgeConfigItem } from '@/components/ui/StatusBadge';
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WORK_SURFACE, WORK_SURFACE_INNER } from "@/components/ui/formStyles";

export interface AuditEntry {
  ts?: string | number;
  action: string;
  studentId?: string;
  field?: string;
  from?: string;
  to?: string;
  studentName?: string;
  count?: number;
  status?: string;
  geo?: boolean | { lat: number; lng: number } | null;
  by?: string;
}

export interface AuditLogProps {
  filters: Partial<AttendanceFilterState>;
}

import { useStudentsByIds } from "@/tenant/hooks/collections/students";
import { uniqueRegistryIds } from "@/lib/registryResolve";

function describeEntry(entry: AuditEntry, studentNameFor: (id?: string) => string, t: (key: AppTranslationKey, vars?: Record<string, string | number>) => string): string {
  if (entry.action === "edit") {
    const studentLabel = studentNameFor(entry.studentId) || entry.studentName || "student";
    return t("attendance.audit.desc.edit", { field: entry.field ?? "", from: entry.from ?? "", to: entry.to ?? "", name: studentLabel });
  }
  if (entry.action === "bulk_mark") {
    return t("attendance.audit.desc.bulkMark", { count: entry.count ?? 0, status: entry.status ?? "" });
  }
  if (entry.action === "submitted") {
    return entry.geo
      ? t("attendance.audit.desc.submittedGeo", { count: entry.count ?? 0 })
      : t("attendance.audit.desc.submitted", { count: entry.count ?? 0 });
  }
  if (entry.action === "draft_saved") {
    return t("attendance.audit.desc.draftSaved");
  }
  return entry.action;
}

/**
 * AuditLog
 * 
 * Displays a log of actions taken regarding attendance (e.g., editing, bulk marking).
 * Allows filtering by class and date.
 * 
 * @param props - The component props.
 * @returns The rendered audit log component.
 */
export function AuditLog({ filters }: AuditLogProps): React.JSX.Element {
  const { t } = useTranslation();
  const sessions = useSessionsCollection();
  const [log, setLog] = useState<AuditEntry[]>([]);
  const studentIds = (() => uniqueRegistryIds(log.map((entry) => entry.studentId)))();
  const { data: students = [] } = useStudentsByIds(studentIds);
  const actionConfig = (() => ({
    edit: { label: t("attendance.audit.action.edit"), cls: SEMANTIC_BADGE.info },
    bulk_mark: { label: t("attendance.audit.action.bulkMark"), cls: SEMANTIC_BADGE.warning },
    submitted: { label: t("attendance.audit.action.submitted"), cls: SEMANTIC_BADGE.success },
    draft_saved: { label: t("attendance.audit.action.draftSaved"), cls: SEMANTIC_BADGE.muted },
  }))() as Record<string, StatusBadgeConfigItem>;

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
  
  const allClasses = (() => {
    return sessions.flatMap((session) =>
      (session.classes || []).map((sessionClass) => ({ ...sessionClass, sessionId: session.id, sessionName: session.name }))
    );
  })();

  const [classId, setClassId] = useState(filters.classId || "");
  const [date, setDate] = useState(filters.date || todayISO());

  const reload = useCallback(() => {
    try {
      const result = getAuditLog(classId, date);
      setLog(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Failed to load audit log", error);
      setLog([]);
    }
  }, [classId, date]);

  useEffect(() => { reload(); }, [reload]);
  
  useEffect(() => {
    if (filters.classId) setClassId(filters.classId);
    if (filters.date)    setDate(filters.date);
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
            className="text-muted-foreground hover:text-foreground"
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
          <div className="space-y-3 p-3 md:hidden">
            {log.map((entry, index) => (
              <article key={index} className={`${WORK_SURFACE_INNER} space-y-2 p-3`}>
                <div className="flex items-start justify-between gap-2">
                  <time className="text-xs font-mono text-muted-foreground">{formatDateTime(entry.ts)}</time>
                  <StatusBadge status={entry.action} config={actionConfig} size="sm" />
                </div>
                <p className="text-xs text-foreground m-0">{describeEntry(entry, studentNameFor, t)}</p>
                {entry.by && (
                  <p className="text-xs font-semibold text-muted-foreground capitalize m-0">{entry.by}</p>
                )}
              </article>
            ))}
          </div>
          <div className="hidden md:block">
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
                    <TableCell className="px-3 py-2.5 text-xs text-foreground">{describeEntry(entry, studentNameFor, t)}</TableCell>
                    <TableCell className="px-3 py-2.5 text-xs font-semibold text-muted-foreground capitalize">{entry.by || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </section>
  );
}
