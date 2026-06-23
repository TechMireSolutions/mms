import React from "react";
import { Users, MapPin, Radio } from "lucide-react";
import { motion } from "framer-motion";
import { useLiveCollection } from "../../hooks/useLiveCollection";
import { type Session } from "../../lib/data/sessionsData";

export interface UpcomingSessionItem {
  id: number;
  name: string;
  teacher: string;
  time: string;
  room: string;
  students: number;
  status: "live" | "upcoming";
}

function hashStringToId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
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
  const dbSessions = useLiveCollection<Session>("sessions");

  const sessions: UpcomingSessionItem[] = [];

  dbSessions.forEach((s) => {
    if (s.status !== "active") return;

    const classesList = s.classes || [];
    classesList.forEach((cls, idx) => {
      const timetable = s.timetable || [];
      const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const todayName = weekdayNames[new Date().getDay()];

      const classTimetable = timetable.filter(
        (t) => t.location === cls.room && t.day === todayName
      );

      const timeStr = classTimetable[0]
        ? `${classTimetable[0].startTime} - ${classTimetable[0].endTime}`
        : "09:00 - 11:00";
      const isLive = classTimetable.length > 0;

      sessions.push({
        id: hashStringToId(`${s.id}-${cls.id}-${idx}`),
        name: `${s.name} – ${cls.name}`,
        teacher: cls.teacherName || "Unassigned",
        time: timeStr,
        room: cls.room || "N/A",
        students: cls.enrolled || 0,
        status: isLive ? "live" : "upcoming",
      });
    });
  });

  return (
    <section aria-labelledby="sessions-table-heading" className="bg-card rounded-xl border border-border">
      <header className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h3 id="sessions-table-heading" className="text-sm font-semibold text-foreground m-0">
            {title || "Today's Sessions"}
          </h3>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {sessions.length} scheduled
          </span>
        </div>
        <button className="text-[12px] font-semibold text-primary hover:underline">View all</button>
      </header>

      <div className="divide-y divide-border/50">
        {sessions.map((s, i) => (
          <motion.article
            key={s.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors"
          >
            {/* Time */}
            <div className="w-14 flex-shrink-0 text-center">
              <p className="text-[13px] font-bold text-foreground m-0">{s.time}</p>
            </div>

            {/* Live indicator or dot */}
            <div className="flex-shrink-0">
              {s.status === "live" ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full" aria-label="Session is live">
                  <Radio className="w-2.5 h-2.5 animate-pulse" aria-hidden="true" /> LIVE
                </span>
              ) : (
                <div className="w-2 h-2 rounded-full bg-border" aria-hidden="true" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate m-0">{s.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 m-0">{s.teacher}</p>
            </div>

            {/* Meta */}
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground flex-shrink-0">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" aria-hidden="true" />
                <span className="sr-only">Room:</span> {s.room}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" aria-hidden="true" />
                <span className="sr-only">Students:</span> {s.students}
              </span>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
