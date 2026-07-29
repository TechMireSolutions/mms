import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

const MotionCard = motion.create(Card);
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSelect } from "@/components/ui/FormSelect";
import {
  CheckCircle2, XCircle, Save, Send, Users,
  WifiOff, Wifi, MapPin, Scan, UploadCloud,
} from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { ClassStudent, AttendanceRecord, AttendanceStatus, getAttendanceStatusInfo } from '@/lib/data/attendanceData';
import { useAttendanceConfig } from "@/hooks/useStandardModuleConfig";
import { useSessionsCollection } from '@/tenant/hooks/collections/sessions';
import { useEnrollmentsCollection } from "@/tenant/hooks/collections/enrollments";
import { useStudentsByIds } from '@/tenant/hooks/collections/students';
import type { Student } from "@/lib/data/studentsData";
import type { Enrollment } from "@/lib/data/enrollmentData";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { attendanceStatusLabel } from "@/lib/attendanceStatusUi";
import { ATTENDANCE_MODULE_MANIFEST } from "@mms/shared";
import { StatusToggle } from "@/tenant/features/attendance/components/StatusToggle";
import { AttendanceFilterState } from "@/tenant/features/attendance/components/AttendanceFilters";
import {
  type ModuleCustomField,
} from "@mms/shared";
import { notify } from "@/lib/notify";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GeoData {
  lat: number;
  lng: number;
}

export interface AttendanceRow {
  studentId: string;
  name: string;
  rollNo: string;
  status: AttendanceRecord["status"];
  timeIn: string;
  timeOut: string;
  notes: string;
  [key: string]: unknown;
}

export interface OfflinePayload {
  classId: string;
  date: string;
  rows: AttendanceRow[];
  geo: GeoData | null;
  submittedBy: string;
  ts: string;
}

interface MarkAttendanceProps {
  filters: AttendanceFilterState;
  role: string;
  records: AttendanceRecord[];
  persistBatch: (records: AttendanceRecord[]) => Promise<void>;
}

interface AuditEntry {
  action: string;
  ts?: string;
  studentId?: string;
  studentName?: string;
  field?: string;
  from?: string;
  to?: string;
  by?: string;
  status?: string;
  count?: number;
  geo?: GeoData | null;
}

// ── Offline queue (localStorage-backed) ─────────────────────────────────────
function loadQueue(): OfflinePayload[] {
  try { 
    return JSON.parse(localStorage.getItem("att_offline_queue") || "[]"); 
  } catch (error) {
    console.warn("Failed to load offline queue:", error);
    return []; 
  }
}

function saveQueue(queue: OfflinePayload[]) {
  try {
    localStorage.setItem("att_offline_queue", JSON.stringify(queue));
  } catch (error) {
    console.error("Failed to save offline queue:", error);
  }
}

// ── Audit log ─────────────────────────────────────────────────────────────────
function addAuditEntry(classId: string, date: string, entry: AuditEntry) {
  try {
    const key = `att_audit_${classId}_${date}`;
    const existing: AuditEntry[] = JSON.parse(localStorage.getItem(key) || "[]");
    existing.unshift({ ...entry, ts: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
  } catch (error) {
    console.error("Failed to save audit entry:", error);
  }
}

/**
 * Retrieves the audit log of attendance changes for a specific class and date.
 */
export function getAuditLog(classId: string, date: string): AuditEntry[] {
  try {
    const key = `att_audit_${classId}_${date}`;
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch (error) {
    console.error("Failed to read audit log:", error);
    return [];
  }
}

// ── Default rows ──────────────────────────────────────────────────────────────
function buildDefaultRows(students: ClassStudent[], customFields: ModuleCustomField[] = []): AttendanceRow[] {
  return students.map((student) => {
    const row: AttendanceRow = {
      studentId: student.id,
      name: student.name,
      rollNo: student.rollNo,
      status: "present",
      timeIn: "07:00",
      timeOut: "08:30",
      notes: "",
    };
    customFields.forEach((customField) => {
      row[customField.id] = customField.defaultValue ?? "";
    });
    return row;
  });
}

function studentRollNo(student: Student | undefined, studentId: string): string {
  const grNumber = typeof student?.grNumber === "string" ? student.grNumber.trim() : "";
  if (grNumber) return grNumber;
  const numeric = studentId.replace(/\D/g, "");
  return numeric ? `STU-${numeric.padStart(3, "0")}` : studentId;
}

function enrolledStudentsForClass(
  classId: string,
  enrollments: Enrollment[],
  students: Student[],
  unnamedStudentLabel: string,
): ClassStudent[] {
  if (!classId) return [];

  const studentsById = new Map(students.map((student) => [String(student.id), student]));
  const seen = new Set<string>();

  return enrollments
    .filter((enrollment) =>
      enrollment.classId === classId &&
      enrollment.status !== "cancelled" &&
      enrollment.status !== "completed"
    )
    .flatMap((enrollment) => {
      const studentId = String(enrollment.studentId || "");
      if (!studentId || seen.has(studentId)) return [];
      seen.add(studentId);

      const student = studentsById.get(studentId);
      const name = student?.name || enrollment.studentName || unnamedStudentLabel;
      const gender = student?.gender === "female" || student?.gender === "male"
        ? student.gender
        : "male";

      return [{
        id: studentId,
        name,
        gender,
        rollNo: studentRollNo(student, studentId),
      }];
    });
}

// ── Offline Banner ────────────────────────────────────────────────────────────
function OfflineBanner({ offline, queue, onSync }: { offline: boolean; queue: OfflinePayload[]; onSync: () => void }) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {offline && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-warning/10 border border-warning/30 text-warning">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <WifiOff className="w-4 h-4" aria-hidden="true" />
            {t("attendance.mark.offlineBannerOffline")}
            {queue.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-warning/30 text-[10px] font-bold">{queue.length} {t("attendance.mark.pending")}</span>}
          </div>
          <Button onClick={onSync} variant="ghost" size="sm" className="text-xs font-bold px-2.5 py-2 rounded-lg bg-warning/30 hover:bg-warning/40 hover:text-warning transition-colors flex min-h-11 items-center gap-1">
            <UploadCloud className="w-3 h-3" aria-hidden="true" /> {t("attendance.mark.syncNow")}
          </Button>
        </motion.div>
      )}
      {!offline && queue.length > 0 && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
          className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-success/10 border border-success/30 text-success">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Wifi className="w-4 h-4" aria-hidden="true" />
            {t("attendance.mark.offlineBannerOnline", { count: queue.length })}
          </div>
          <Button onClick={onSync} variant="ghost" size="sm" className="text-xs font-bold px-2.5 py-2 rounded-lg bg-success/30 hover:bg-success/40 hover:text-success transition-colors flex min-h-11 items-center gap-1">
            <UploadCloud className="w-3 h-3" aria-hidden="true" /> {t("attendance.mark.syncNow")}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Geo tag pill ──────────────────────────────────────────────────────────────
function GeoTag({ geo, onRequest }: { geo: GeoData | "loading" | null; onRequest: () => void }) {
  const { t } = useTranslation();
  if (geo === "loading") return (
    <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium px-2 py-1 rounded-lg bg-muted animate-pulse">
      <MapPin className="w-3 h-3" aria-hidden="true" /> {t("attendance.mark.gettingLocation")}
    </span>
  );
  if (geo) return (
    <span className="flex items-center gap-1 text-[11px] text-success font-medium px-2 py-1 rounded-lg bg-success/10 border border-success/30">
      <MapPin className="w-3 h-3" aria-hidden="true" /> {geo.lat.toFixed(4)}, {geo.lng.toFixed(4)}
    </span>
  );
  return (
    <Button onClick={onRequest} variant="outline" size="sm"
      className="flex min-h-11 items-center gap-1 text-xs text-muted-foreground font-medium px-2 py-2 rounded-lg border border-dashed border-border hover:bg-muted hover:text-muted-foreground transition-colors bg-transparent">
      <MapPin className="w-3 h-3" aria-hidden="true" /> {t("attendance.mark.tagLocation")}
    </Button>
  );
}

// ── Facial Recognition Placeholder ───────────────────────────────────────────
function FaceRecognitionPlaceholder({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <MotionCard initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      accentColor="primary" className="p-6 text-center space-y-4 shadow-sm">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <Scan className="w-8 h-8 text-primary" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-foreground m-0">{t("attendance.mark.facialRecognition")}</h3>
        <p className="text-xs text-muted-foreground mt-1">{t("attendance.mark.facialRecognitionDesc")}</p>
        <span className="inline-block mt-2 px-2.5 py-1 rounded-full bg-warning/15 text-warning text-[11px] font-bold">{t("attendance.mark.comingSoon")}</span>
      </div>
      <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center" style={{ height: 160 }}>
        <div className="text-center space-y-2">
          <div className="w-16 h-20 border-2 border-primary/30 rounded-lg mx-auto flex items-center justify-center">
            <div className="w-8 h-10 border border-primary/20 rounded-sm" />
          </div>
          <p className="text-[11px] text-muted-foreground">{t("attendance.mark.cameraPreview")}</p>
        </div>
      </div>
      <Button onClick={onClose} variant="ghost" size="sm" className="min-h-11 text-xs text-muted-foreground hover:text-foreground transition-colors py-2">{t("attendance.mark.dismiss")}</Button>
    </MotionCard>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * MarkAttendance
 */
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
      return existing.map((attendanceRecord) => ({
        studentId: attendanceRecord.studentId || "",
        name: attendanceRecord.studentName || "",
        rollNo: (attendanceRecord as AttendanceRecord & { rollNo?: string }).rollNo ?? "",
        status: attendanceRecord.status,
        timeIn: attendanceRecord.timeIn || "07:00",
        timeOut: attendanceRecord.timeOut || "08:30",
        notes: attendanceRecord.notes || "",
        ...((attendanceRecord as unknown as { customFields?: Record<string, unknown> }).customFields || {}),
      }));
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

  // Watch online/offline
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
      nextRows = existing.map((attendanceRecord) => ({
        studentId: attendanceRecord.studentId || "",
        name: attendanceRecord.studentName || "",
        rollNo: (attendanceRecord as AttendanceRecord & { rollNo?: string }).rollNo ?? "",
        status: attendanceRecord.status,
        timeIn: attendanceRecord.timeIn || "07:00",
        timeOut: attendanceRecord.timeOut || "08:30",
        notes: attendanceRecord.notes || "",
        ...((attendanceRecord as unknown as { customFields?: Record<string, unknown> }).customFields || {}),
      }));
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
    attendanceRows.map((row) => {
      const customFieldValues: Record<string, unknown> = {};
      customFields.forEach((customField: ModuleCustomField) => {
        customFieldValues[customField.id] = row[customField.id];
      });

      return {
        id: `${classId}-${date}-${row.studentId}`,
        classId,
        date,
        studentId: row.studentId,
        studentName: row.name,
        rollNo: row.rollNo,
        status: row.status,
        timeIn: row.status !== "absent" ? row.timeIn : "",
        timeOut: row.status !== "absent" ? row.timeOut : "",
        notes: row.notes || "",
        customFields: customFieldValues,
      } as unknown as AttendanceRecord;
    });

  const queueOfflinePayload = (payload: OfflinePayload) => {
    const nextQueue = [
      ...offlineQueue.filter((queued) => !(queued.classId === payload.classId && queued.date === payload.date)),
      payload,
    ];
    saveQueue(nextQueue);
    setOfflineQueue(nextQueue);
  };

  const currentOfflinePayload = (): OfflinePayload => ({
    classId: filters.classId,
    date: filters.date,
    rows,
    geo: typeof geo === "object" ? geo : null,
    submittedBy: role,
    ts: new Date().toISOString(),
  });

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
      {/* Offline Banner */}
      <OfflineBanner offline={isOffline} queue={offlineQueue} onSync={() => void handleSync()} />
      {syncedMsg && <div className="px-4 py-2 rounded-xl bg-success/10 border border-success/30 text-success text-sm font-semibold">✓ {t("attendance.mark.syncSuccess")}</div>}

      {/* Facial Recognition Placeholder */}
      <AnimatePresence>
        {showFaceAI && <FaceRecognitionPlaceholder onClose={() => setShowFaceAI(false)} />}
      </AnimatePresence>

      {/* Class Info Bar */}
      <header className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground m-0">{classInfo?.name}</h2>
            {submitted && (
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-success/15 text-success font-bold">
                <CheckCircle2 className="w-2.5 h-2.5" aria-hidden="true" /> {t("attendance.mark.submitted")}
              </span>
            )}
            {isOffline && (
              <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-warning/15 text-warning font-bold">
                <WifiOff className="w-2.5 h-2.5" aria-hidden="true" /> {t("attendance.mark.offline")}
              </span>
            )}
          </div>
          <p className="text-[12px] text-muted-foreground">
            {sessionInfo?.name} · {classInfo?.teacherName} · {filters.date}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <GeoTag geo={geo} onRequest={requestGeo} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isDraft && <span className="px-2 py-1 rounded-lg bg-warning/15 text-warning text-[11px] font-bold">{t("attendance.mark.draftSaved")}</span>}
          <Button onClick={() => setShowFaceAI((isOpen) => !isOpen)} variant="outline" size="sm"
            className="flex min-h-11 items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Scan className="w-3 h-3" aria-hidden="true" /> {t("attendance.mark.faceAi")}
          </Button>
          <div className="flex max-w-full overflow-x-auto rounded-lg border border-border text-xs font-semibold" role="group" aria-label={t("attendance.mark.bulkActionsAria")}>
            <Button onClick={() => markAll("present")} variant="ghost" className="shrink-0 min-h-11 px-3 py-2 rounded-none bg-success/10 text-success hover:bg-success/15 hover:text-success transition-colors flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> {t("attendance.mark.allPresent")}
            </Button>
            <Button onClick={() => markAll("absent")} variant="ghost" className="shrink-0 min-h-11 px-3 py-2 rounded-none bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive transition-colors flex items-center gap-1 font-semibold">
              <XCircle className="w-3 h-3" aria-hidden="true" /> {t("attendance.mark.allAbsent")}
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Strip */}
      <div 
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${statuses.length || 4}, minmax(0, 1fr))` }}
      >
        {statuses.map((status: AttendanceStatus) => (
          <div key={status.id} className={`rounded-xl ${status.bg} ${status.text} border ${status.border} px-3 py-2 text-center`}>
            <p className="text-lg font-bold">{stats[status.id] || 0}</p>
            <p className="text-[11px] font-semibold">{attendanceStatusLabel(status, t)}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={t("attendance.searchStudent")}
        className="w-full"
      />

      {/* Attendance Grid */}
      <Card accentColor="primary" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm border-border/80 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 border-b border-border">
              <tr>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase w-8">#</th>
                <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">{t("attendance.columns.student")}</th>
                {orderedFields.map((field) => {
                  const isEnabled = isFieldEnabled(field.id);
                  if (!isEnabled) return null;
                  return (
                    <th
                      key={field.id}
                      className={`px-3 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase ${
                        field.id === "status" ? "text-center" : "text-left"
                      } ${field.id === "timeIn" || field.id === "timeOut" ? "w-28" : ""}`}
                    >
                      {field.label} {field.required ? "*" : ""}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRows.length === 0 ? (
                <tr><td colSpan={orderedFields.filter((field) => isFieldEnabled(field.id)).length + 2} className="px-4 py-10 text-center text-muted-foreground text-sm">{t("attendance.mark.noStudents")}</td></tr>
              ) : filteredRows.map((row) => {
                const statusInfo = getAttendanceStatusInfo(row.status, statuses);
                return (
                  <motion.tr key={row.studentId} layout className={`transition-colors hover:bg-muted/20 ${statusInfo?.bg || ""}`}>
                    <td className="px-3 py-2.5 text-[11px] text-muted-foreground font-mono">{row.rollNo}</td>
                    <td className="px-3 py-2.5 font-semibold text-foreground whitespace-nowrap">{row.name}</td>
                    {orderedFields.map((field) => {
                      const isEnabled = isFieldEnabled(field.id);
                      if (!isEnabled) return null;

                      if (field.id === "status") {
                        return (
                          <td key="status" className="px-3 py-2.5">
                            <div className="flex justify-center">
                              <StatusToggle value={row.status} onChange={(value) => setRow(row.studentId, "status", value as AttendanceRecord["status"])} />
                            </div>
                          </td>
                        );
                      }

                      if (field.id === "timeIn") {
                        return (
                          <td key="timeIn" className="px-3 py-2.5">
                            <label htmlFor={`time-in-${row.studentId}`} className="sr-only">{t("attendance.columns.timeIn")}</label>
                            <Input 
                              id={`time-in-${row.studentId}`}
                              type="time" 
                              value={row.timeIn}
                              onChange={(event) => setRow(row.studentId, "timeIn", event.target.value)}
                              disabled={row.status === "absent"}
                              className="text-xs rounded-lg border border-border bg-background px-2 py-1 w-24 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-40 h-8" 
                            />
                          </td>
                        );
                      }

                      if (field.id === "timeOut") {
                        return (
                          <td key="timeOut" className="px-3 py-2.5">
                            <label htmlFor={`time-out-${row.studentId}`} className="sr-only">{t("attendance.columns.timeOut")}</label>
                            <Input 
                              id={`time-out-${row.studentId}`}
                              type="time" 
                              value={row.timeOut}
                              onChange={(event) => setRow(row.studentId, "timeOut", event.target.value)}
                              disabled={row.status === "absent"}
                              className="text-xs rounded-lg border border-border bg-background px-2 py-1 w-24 focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-40 h-8" 
                            />
                          </td>
                        );
                      }

                      if (field.id === "notes") {
                        return (
                          <td key="notes" className="px-3 py-2.5">
                            <label htmlFor={`notes-${row.studentId}`} className="sr-only">{t("attendance.mark.notes")}</label>
                            <Input 
                              id={`notes-${row.studentId}`}
                              type="text" 
                              value={row.notes} 
                              placeholder={t("attendance.mark.notesPlaceholder")}
                              onChange={(event) => setRow(row.studentId, "notes", event.target.value)}
                              className="text-xs rounded-lg border border-border bg-background px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground h-8" 
                            />
                          </td>
                        );
                      }

                      // Custom column field
                      if (!["status", "timeIn", "timeOut", "notes"].includes(field.id)) {
                        const rawValue = row[field.id];
                        const stringValue = typeof rawValue === "string" || typeof rawValue === "number" ? String(rawValue) : "";
                        const boolValue = Boolean(rawValue);
                        return (
                          <td key={field.id} className="px-3 py-2.5">
                            {field.type === "select" ? (
                              <FormSelect
                                id={`custom-select-${row.studentId}-${field.id}`}
                                value={stringValue}
                                onChange={(value: string) => setRow(row.studentId, field.id, value)}
                                options={field.options || []}
                                placeholder={t("common.selectPlaceholder")}
                                className="min-w-[120px]"
                              />
                            ) : field.type === "boolean" ? (
                              <Checkbox
                                checked={boolValue}
                                onCheckedChange={(checked) => setRow(row.studentId, field.id, !!checked)}
                                className="w-4 h-4 rounded border border-border cursor-pointer"
                              />
                            ) : (
                              <Input
                                type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                                value={stringValue}
                                onChange={(event) => setRow(row.studentId, field.id, event.target.value)}
                                placeholder={field.placeholder || t("common.enterPlaceholder")}
                                className="text-xs rounded-lg border border-border bg-background px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground h-8"
                              />
                            )}
                          </td>
                        );
                      }

                      return null;
                    })}
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Actions */}
      <footer className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted-foreground">{t("attendance.mark.summary", { total: rows.length, shown: filteredRows.length })}</p>
        <div className="flex gap-2">
          <Button onClick={() => void handleSaveDraft()} variant="outline"
            className="flex min-h-11 items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Save className="w-3.5 h-3.5" aria-hidden="true" /> {t("attendance.mark.saveDraft")}
          </Button>
          <Button onClick={() => void handleSubmit()}
            disabled={!canWriteAttendance}
            className="flex min-h-11 items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            {isOffline ? t("attendance.mark.saveOffline") : submitted ? t("attendance.mark.updateAttendance") : t("attendance.mark.submitAttendance")}
          </Button>
        </div>
      </footer>
    </section>
  );
}
