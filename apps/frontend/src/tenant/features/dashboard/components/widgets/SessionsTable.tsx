import React from "react";
import { Users, MapPin, Radio } from "lucide-react";
import { motion } from "framer-motion";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import { type Session } from "@/lib/data/sessionsData";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

export interface UpcomingSessionItem {
  id: number;
  name: string;
  teacher: string;
  time: string;
  room: string;
  students: number;
  status: "live" | "upcoming";
}

function hashStringToId(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/**
 * SessionsTable Component
 *
 * Displays a list of today's scheduled sessions with their status and details.
 *
 * @returns {React.ReactElement} The sessions table widget.
 */
export default function SessionsTable({ title }: { title?: string }) {
  const { t } = useTranslation();
  const dbSessions = useLiveCollection<Session>("sessions");

  const sessions: UpcomingSessionItem[] = [];

  dbSessions.forEach((session) => {
    if (session.status !== "active") return;

    const classesList = session.classes || [];
    classesList.forEach((sessionClass, classIndex) => {
      const timetable = session.timetable || [];
      const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const todayName = weekdayNames[new Date().getDay()];

      const classTimetable = timetable.filter(
        (timetableEntry) => timetableEntry.location === sessionClass.room && timetableEntry.day === todayName
      );

      const timeStr = classTimetable[0]
        ? `${classTimetable[0].startTime} - ${classTimetable[0].endTime}`
        : "09:00 - 11:00";
      const isLive = classTimetable.length > 0;

      sessions.push({
        id: hashStringToId(`${session.id}-${sessionClass.id}-${classIndex}`),
        name: `${session.name} – ${sessionClass.name}`,
        teacher: sessionClass.teacherName || t("sessions.classes.unassigned"),
        time: timeStr,
        room: sessionClass.room || "N/A",
        students: sessionClass.enrolled || 0,
        status: isLive ? "live" : "upcoming",
      });
    });
  });

  return (
    <section aria-labelledby="sessions-table-heading" className="relative overflow-hidden group/sessions bg-card/45 backdrop-blur-sm rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-300">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/sessions:bg-primary" />
      <header className="px-6 py-4 border-b border-border/40 flex items-center justify-between pl-6.5">
        <div className="flex items-center gap-2.5">
          <h3 id="sessions-table-heading" className="text-sm font-semibold text-foreground m-0">
            {title || t("dashboard.widgets.todaysSessions")}
          </h3>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {t("dashboard.widgets.sessionsScheduled", { count: sessions.length })}
          </span>
        </div>
        <Button variant="link" className="text-[12px] font-semibold h-auto p-0">
          {t("dashboard.widgets.viewAll")}
        </Button>
      </header>

      <div className="divide-y divide-border/50">
        {sessions.map((session, sessionIndex) => (
          <motion.article
            key={session.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: sessionIndex * 0.06 }}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors"
          >
            {/* Time */}
            <div className="w-14 flex-shrink-0 text-center">
              <p className="text-[13px] font-bold text-foreground m-0">{session.time}</p>
            </div>

            {/* Live indicator or dot */}
            <div className="flex-shrink-0">
              {session.status === "live" ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full" aria-label="Session is live">
                  <Radio className="w-2.5 h-2.5 animate-pulse" aria-hidden="true" /> {t("dashboard.widgets.live")}
                </span>
              ) : (
                <div className="w-2 h-2 rounded-full bg-border" aria-hidden="true" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate m-0">{session.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 m-0">{session.teacher}</p>
            </div>

            {/* Meta */}
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground flex-shrink-0">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" aria-hidden="true" />
                <span className="sr-only">Room:</span> {session.room}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" aria-hidden="true" />
                <span className="sr-only">Students:</span> {session.students}
              </span>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
