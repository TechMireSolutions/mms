import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { AttendanceRecord, type ClassStudent } from '@/lib/data/attendanceData';
import { useAttendanceConfig } from "@/hooks/useStandardModuleConfig";
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { useEnrollmentsCollection } from "@/tenant/hooks/collections/enrollments";
import { useStudentsByIds } from '@/tenant/hooks/collections/students';
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { ATTENDANCE_MODULE_MANIFEST } from "@mms/shared";
import { notify } from "@/lib/notify";
import { MarkAttendanceActions } from "@/tenant/features/attendance/components/MarkAttendanceActions";
import { MarkAttendanceClassBar } from "@/tenant/features/attendance/components/MarkAttendanceClassBar";
import { MarkAttendanceFacePlaceholder } from "@/tenant/features/attendance/components/MarkAttendanceFacePlaceholder";
import { MarkAttendanceGrid } from "@/tenant/features/attendance/components/MarkAttendanceGrid";
import { MarkAttendanceOfflineBanner } from "@/tenant/features/attendance/components/MarkAttendanceOfflineBanner";
import { MarkAttendanceStatsStrip } from "@/tenant/features/attendance/components/MarkAttendanceStatsStrip";
import { addAuditEntry, loadQueue, saveQueue } from "@/tenant/features/attendance/components/markAttendanceQueue";
import {
  attendanceRecordsFromRows,
  attendanceRowsFromRecords,
  buildDefaultRows,
  buildOfflinePayload,
  enrolledStudentsForClass,
} from "@/tenant/features/attendance/components/markAttendanceRowUtils";
import type { AttendanceRow, GeoData, MarkAttendanceProps, OfflinePayload } from "@/tenant/features/attendance/components/markAttendanceTypes";

export type { AuditEntry, AttendanceRow, GeoData, OfflinePayload } from "@/tenant/features/attendance/components/markAttendanceTypes";
export { getAuditLog } from "@/tenant/features/attendance/components/markAttendanceQueue";

export function MarkAttendance({ filters, role, records, persistBatch }: MarkAttendanceProps) {
  const { t } = useTranslation();
  const { statuses, customFields, orderedFields, isFieldEnabled } = useAttendanceConfig();
  const { canWrite: canWriteAttendance } = useModulePermissions(ATTENDANCE_MODULE_MANIFEST);
  const sessions = useSessionsCollection();
  const enrollments = useEnrollmentsCollection();
  const studentIds = useMemo(() => {
    if (!filters.classId) return [];
    return enrollments
      .filter((enrollment) =>
        enrollment.classId === filters.classId &&
        enrollment.status !== "cancelled" &&
        enrollment.status !== "completed"
      )
      .map((enrollment) => enrollment.studentId);
  }, [enrollments, filters.classId]);

  const { data: enrolledStudents = [] } = useStudentsByIds(studentIds);
  
  const allClasses = useMemo(() => {
    return sessions.flatMap((session) =>
      (session.classes || []).map((sessionClass) => ({ ...sessionClass, sessionId: session.id, sessionName: session.name }))
    );
  }, [sessions]);

  const classInfo  = useMemo(() => allClasses.find((sessionClass) => sessionClass.id === filters.classId), [allClasses, filters.classId]);
  const sessionInfo = useMemo(() => classInfo ? sessions.find((session) => session.id === classInfo.sessionId) : null, [sessions, classInfo]);
  const students: ClassStudent[] = useMemo(() => {
    if (!filters.classId) return [];
    const fromEnrollments = enrolledStudentsForClass(
      filters.classId,
      enrollments,
      enrolledStudents,
      t("common.unnamedStudent"),
    );
    return fromEnrollments;
  }, [enrollments, enrolledStudents, filters.classId, t]);

  const [rows, setRows] = useState<AttendanceRow[]>(() => {
    if (!filters.classId || !filters.date) return [];
    const existing = records.filter((attendanceRecord) => attendanceRecord.classId === filters.classId && attendanceRecord.date === filters.date);
    if (existing.length > 0) {
      return attendanceRowsFromRecords(existing);
    }
    return buildDefaultRows(students, customFields);
  });
  const [search, setSearch]       = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isDraft, setIsDraft]     = useState(false);
  const [geo, setGeo]             = useState<GeoData | "loading" | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<OfflinePayload[]>(loadQueue);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showFaceAI, setShowFaceAI] = useState(false);
  const [syncedMsg, setSyncedMsg] = useState(false);

  useEffect(() => {
    const handleOnline  = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => { window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline); };
  }, []);

  // Rebuild rows when class/date/roster changes — must be in useEffect, never in render body
  const studentRosterKey = students.map((student) => `${student.id}-${student.name}`).join("|");
  const stableKey = `${filters.classId}:${filters.date}:${studentRosterKey}`;

  useEffect(() => {
    if (!filters.classId || !filters.date) return;
    const existing = records.filter((attendanceRecord) => attendanceRecord.classId === filters.classId && attendanceRecord.date === filters.date);
    let nextRows: AttendanceRow[];
    if (existing.length > 0) {
      nextRows = attendanceRowsFromRecords(existing);
    } else {
      nextRows = buildDefaultRows(students, customFields);
    }
    setRows(nextRows);
    setSubmitted(false);
    setIsDraft(false);
    setGeo(null);
    setShowFaceAI(false);
  // stableKey encodes classId + date + roster — safe single dep
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey]);

  const filteredRows = useMemo(() =>
    rows.filter((row) => row.name.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach((row) => {
      counts[row.status] = (counts[row.status] || 0) + 1;
    });
    return counts;
  }, [rows]);

  const setRow = (studentId: string, key: string, value: unknown) => {
    const before = rows.find((row) => row.studentId === studentId);
    setRows((previousRows) => previousRows.map((row) => row.studentId === studentId ? { ...row, [key]: value } : row));
    // Audit
    if (filters.classId && filters.date && before) {
      addAuditEntry(filters.classId, filters.date, {
        action: "edit",
        studentId,
        field: key,
        from: String(before[key] ?? ""),
        to: String(value),
        by: role,
      });
    }
  };

  const markAll = (status: AttendanceRecord["status"]) => {
    setRows((previousRows) => previousRows.map((row) => ({ ...row, status })));
    addAuditEntry(filters.classId, filters.date, { action: "bulk_mark", status, count: rows.length, by: role });
  };

  const requestGeo = () => {
    setGeo("loading");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGeo(null)
      );
    } else {
      setGeo(null);
    }
  };

  const buildRecords = (attendanceRows: AttendanceRow[], classId = filters.classId, date = filters.date): AttendanceRecord[] =>
    attendanceRecordsFromRows(attendanceRows, customFields, classId, date);

  const queueOfflinePayload = (payload: OfflinePayload) => {
    const nextQueue = [
      ...offlineQueue.filter((queued) => !(queued.classId === payload.classId && queued.date === payload.date)),
      payload,
    ];
    saveQueue(nextQueue);
    setOfflineQueue(nextQueue);
  };

  const currentOfflinePayload = (): OfflinePayload =>
    buildOfflinePayload(filters.classId, filters.date, rows, typeof geo === "object" ? geo : null, role);

  const handleSaveDraft = async () => {
    if (isOffline) {
      queueOfflinePayload(currentOfflinePayload());
      setIsDraft(true);
      addAuditEntry(filters.classId, filters.date, { action: "draft_saved", by: role });
      return;
    }

    try {
      await persistBatch(buildRecords(rows));
      setIsDraft(true);
      addAuditEntry(filters.classId, filters.date, { action: "draft_saved", by: role });
      notify.success(t("attendance.toast.draftSaved"));
    } catch (error) {
      notify.error(t("attendance.toast.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleSubmit = async () => {
    const payload = currentOfflinePayload();
    if (isOffline) {
      queueOfflinePayload(payload);
      setSubmitted(true);
      addAuditEntry(filters.classId, filters.date, { action: "submitted", count: rows.length, by: role, geo: payload.geo });
      return;
    }

    try {
      await persistBatch(buildRecords(rows));
      setSubmitted(true);
      addAuditEntry(filters.classId, filters.date, { action: "submitted", count: rows.length, by: role, geo: payload.geo });
      notify.success(t("attendance.toast.submitted"));
    } catch (error) {
      notify.error(t("attendance.toast.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleSync = async () => {
    if (isOffline) return;

    try {
      const queuedRecords = offlineQueue.flatMap((payload) =>
        buildRecords(payload.rows, payload.classId, payload.date),
      );
      await persistBatch(queuedRecords);
      saveQueue([]);
      setOfflineQueue([]);
      setSyncedMsg(true);
      setTimeout(() => setSyncedMsg(false), 3000);
    } catch (error) {
      notify.error(t("attendance.toast.syncFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  if (!filters.classId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users className="w-12 h-12 text-muted-foreground/40 mb-3" aria-hidden="true" />
        <h2 className="text-base font-semibold text-foreground m-0">{t("attendance.mark.selectClassTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("attendance.mark.selectClassDesc")}</p>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <MarkAttendanceOfflineBanner offline={isOffline} queue={offlineQueue} onSync={() => void handleSync()} />
      {syncedMsg && <div className="px-4 py-2 rounded-xl bg-success/10 border border-success/30 text-success text-sm font-semibold">✓ {t("attendance.mark.syncSuccess")}</div>}

      <AnimatePresence>
        {showFaceAI && <MarkAttendanceFacePlaceholder onClose={() => setShowFaceAI(false)} />}
      </AnimatePresence>

      <MarkAttendanceClassBar
        classInfo={classInfo}
        sessionInfo={sessionInfo}
        date={filters.date}
        submitted={submitted}
        isOffline={isOffline}
        isDraft={isDraft}
        geo={geo}
        onRequestGeo={requestGeo}
        onToggleFaceAI={() => setShowFaceAI((isOpen) => !isOpen)}
        onMarkAll={markAll}
      />

      <MarkAttendanceStatsStrip statuses={statuses} stats={stats} />

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={t("attendance.searchStudent")}
        className="w-full"
      />

      <MarkAttendanceGrid
        rows={filteredRows}
        orderedFields={orderedFields}
        statuses={statuses}
        isFieldEnabled={isFieldEnabled}
        onFieldChange={setRow}
      />

      <MarkAttendanceActions
        totalRows={rows.length}
        visibleRows={filteredRows.length}
        isOffline={isOffline}
        submitted={submitted}
        canWriteAttendance={canWriteAttendance}
        onSaveDraft={() => void handleSaveDraft()}
        onSubmit={() => void handleSubmit()}
      />
    </section>
  );
}
