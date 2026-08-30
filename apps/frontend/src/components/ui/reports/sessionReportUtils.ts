import type { Session } from "@/lib/data/sessionsData";
import type {
  CapacityBarDatum,
  EnrollmentTrendItem,
  SessionCapacityItem,
  TodaySessionItem,
} from "./sessionReportTypes";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { formatMonthYear } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

export function utilisationColour(rate: number): string {
  if (rate >= 80) return "bg-success";
  if (rate >= 50) return "bg-warning";
  return "bg-destructive";
}

export function buildSessionStatusConfig(
  t: TranslationFunction,
): Record<string, StatusBadgeConfigItem> {
  return {
    active: { label: t("sessions.status.active") || "Active", cls: SEMANTIC_BADGE.success },
    upcoming: { label: t("sessions.status.upcoming") || "Upcoming", cls: SEMANTIC_BADGE.info },
    completed: { label: t("sessions.status.completed") || "Completed", cls: SEMANTIC_BADGE.muted },
    cancelled: { label: t("sessions.status.cancelled") || "Cancelled", cls: SEMANTIC_BADGE.destructive },
  };
}

export function buildSessionCapacityData(sessions: Session[]): SessionCapacityItem[] {
  const result: SessionCapacityItem[] = [];
  for (const session of sessions) {
    for (const cls of session.classes || []) {
      const enrolled = cls.enrolled ?? 0;
      const capacity = cls.capacity || 0;
      const rate = capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0;
      result.push({
        sessionId: session.id,
        classId: cls.id,
        session: session.name,
        class: cls.name,
        enrolled,
        capacity,
        rate,
        status: session.status || "active",
      });
    }
  }
  return result;
}

export function buildCapacityChartData(sessions: Session[]): CapacityBarDatum[] {
  const capacityData = buildSessionCapacityData(sessions);
  return capacityData.map((item) => ({
    class: item.class,
    enrolled: item.enrolled,
    available: Math.max(0, item.capacity - item.enrolled),
  }));
}

export function buildEnrollmentTrends(sessions: Session[]): EnrollmentTrendItem[] {
  const trendMap: Record<string, { month: string; students: number; sessionName: string | null }> = {};
  for (const session of sessions) {
    const date = session.startDate ? new Date(session.startDate) : new Date();
    const monthKey = isNaN(date.getTime()) ? "Current" : formatMonthYear(date);
    const totalEnrolled = (session.classes || []).reduce((acc, c) => acc + (c.enrolled ?? 0), 0);
    if (!trendMap[monthKey]) {
      trendMap[monthKey] = { month: monthKey, students: 0, sessionName: session.name };
    }
    trendMap[monthKey].students += totalEnrolled;
  }
  return Object.values(trendMap);
}

export function buildTodaysSessions(sessions: Session[]): TodaySessionItem[] {
  const result: TodaySessionItem[] = [];
  for (const session of sessions) {
    const timetableList = session.timetable || [];
    if (timetableList.length === 0) {
      for (const cls of session.classes || []) {
        result.push({
          id: `${session.id}-${cls.id}`,
          name: `${cls.name} (${session.name})`,
          teacher: cls.teacherName || session.name,
          time: "Standard",
          room: cls.room || "Room 1",
          students: cls.enrolled ?? 0,
          status: "upcoming",
        });
      }
    } else {
      for (const timetable of timetableList) {
        result.push({
          id: `${session.id}-${timetable.id || timetable.day}`,
          name: `${timetable.activity} (${session.name})`,
          teacher: session.name,
          time: `${timetable.startTime} - ${timetable.endTime}`,
          room: timetable.location || "Room 1",
          students: (session.classes || []).reduce((acc, c) => acc + (c.enrolled ?? 0), 0),
          status: "upcoming",
        });
      }
    }
  }
  return result;
}

