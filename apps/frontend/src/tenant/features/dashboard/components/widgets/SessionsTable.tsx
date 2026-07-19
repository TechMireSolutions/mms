import React, { useState, useMemo } from "react";
import { Users, MapPin, Radio, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useSessionsCollection } from "@/tenant/features/sessions/hooks/useSessions";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";

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
  const dbSessions = useSessionsCollection();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const sessions = useMemo(() => {
    const list: UpcomingSessionItem[] = [];
    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const todayName = weekdayNames[new Date().getDay()];

    dbSessions.forEach((session) => {
      if (session.status !== "active") return;

      const classesList = session.classes || [];
      classesList.forEach((sessionClass, classIndex) => {
        const timetable = session.timetable || [];

        const classTimetable = timetable.filter(
          (timetableEntry) => timetableEntry.location === sessionClass.room && timetableEntry.day === todayName
        );

        const timeStr = classTimetable[0]
          ? `${classTimetable[0].startTime} - ${classTimetable[0].endTime}`
          : "09:00 - 11:00";
        const isLive = classTimetable.length > 0;

        list.push({
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
    return list;
  }, [dbSessions, t]);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const query = searchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.teacher.toLowerCase().includes(query) ||
        s.room.toLowerCase().includes(query)
    );
  }, [sessions, searchQuery]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredSessions.length / pageSize));
  }, [filteredSessions]);

  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSessions.slice(startIndex, startIndex + pageSize);
  }, [filteredSessions, currentPage]);

  return (
    <section aria-labelledby="sessions-table-heading" className="relative overflow-hidden group/sessions bg-card/45 backdrop-blur-sm rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-300">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover/sessions:bg-primary" />
      <header className="px-6 py-4 border-b border-border/40 flex items-center justify-between pl-6.5">
        <div className="flex items-center gap-2.5">
          <h3 id="sessions-table-heading" className="text-sm font-semibold text-foreground m-0">
            {title || t("dashboard.widgets.todaysSessions")}
          </h3>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {t("dashboard.widgets.sessionsScheduled", { count: filteredSessions.length })}
          </span>
        </div>
        <Button variant="link" className="text-[12px] font-semibold h-auto p-0">
          {t("dashboard.widgets.viewAll")}
        </Button>
      </header>

      <div className="p-3 px-6 border-b border-border/30 flex items-center gap-2 bg-muted/10">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t("contacts.searchPlaceholder") || "Search class, teacher or room..."}
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-8 text-xs h-8.5 rounded-lg border-border/60 focus-visible:ring-1 focus-visible:ring-ring bg-background/50"
          />
        </div>
      </div>

      <div className="divide-y divide-border/50 min-h-[200px]">
        {paginatedSessions.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">
            {t("sessions.report.noData")}
          </div>
        ) : (
          paginatedSessions.map((session, sessionIndex) => (
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
          ))
        )}
      </div>

      {totalPages > 1 && (
        <footer className="px-5 py-3 border-t border-border flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-md"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <span className="text-[11px] font-medium text-muted-foreground select-none">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-md"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </footer>
      )}
    </section>
  );
}
