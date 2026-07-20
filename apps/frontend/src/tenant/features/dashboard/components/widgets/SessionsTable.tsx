import React, { useMemo } from "react";
import { Users, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useSessionsCollection } from "@/tenant/features/sessions/hooks/useSessions";
import { Button } from "@/components/ui/button";
import { WidgetCard } from "@/components/ui/WidgetCard";
import { useTranslation } from "@/hooks/useTranslation";
import { SearchBar } from "@/components/ui/SearchBar";
import { SimplePagination } from "@/components/ui/SimplePagination";
import { useLocalPagination } from "@/hooks/useLocalPagination";

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

  const {
    searchQuery,
    currentPage,
    setCurrentPage,
    handleSearchChange,
    paginatedItems: paginatedSessions,
    filteredItems: filteredSessions,
    totalPages,
  } = useLocalPagination({
    items: sessions,
    pageSize: 5,
    searchFields: (s) => [s.name, s.teacher, s.room],
  });

  return (
    <WidgetCard ariaLabelledby="sessions-table-heading" accentColor="primary">
      <header className="px-6 py-4 border-b border-border/45 flex items-center justify-between ps-6.5 select-none">

        <div className="flex items-center gap-2.5">
          <h3 id="sessions-table-heading" className="text-sm font-bold text-foreground m-0">
            {title || t("dashboard.widgets.todaysSessions")}
          </h3>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
            {t("dashboard.widgets.sessionsScheduled", { count: filteredSessions.length })}
          </span>
        </div>
        <Button variant="link" className="text-[12px] font-bold h-auto p-0">
          {t("dashboard.widgets.viewAll")}
        </Button>
      </header>

      <div className="p-3 px-6 border-b border-border/40 flex items-center gap-2 bg-muted/10">
        <SearchBar
          placeholder={t("contacts.searchPlaceholder") || "Search class, teacher or room..."}
          value={searchQuery}
          onChange={handleSearchChange}
          className="flex-1"
        />
      </div>

      <div className="divide-y divide-border/40 min-h-[200px]">
        {paginatedSessions.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground select-none">
            {t("sessions.report.noData")}
          </div>
        ) : (
          paginatedSessions.map((session, sessionIndex) => (
            <motion.article
              key={session.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: sessionIndex * 0.05, duration: 0.3, ease: "easeOut" }}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
            >
              {/* Time */}
              <div className="w-24 flex-shrink-0 text-left">
                <p className="text-[13px] font-bold text-foreground m-0 tabular-nums">{session.time}</p>
              </div>

              {/* Live indicator or dot */}
              <div className="flex-shrink-0">
                {session.status === "live" ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20 select-none animate-pulse" aria-label="Session is live">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping shrink-0" />
                    <span>{t("dashboard.widgets.live")}</span>
                  </span>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-border/80 ml-2" aria-hidden="true" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground truncate m-0">{session.name}</p>
                <p className="text-[11px] text-muted-foreground/80 mt-0.5 m-0 font-medium">{session.teacher}</p>
              </div>

              {/* Meta */}
              <div className="hidden sm:flex items-center gap-3.5 text-[11px] text-muted-foreground/75 flex-shrink-0 font-semibold select-none">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="sr-only">Room:</span> {session.room}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="sr-only">Students:</span> <span className="tabular-nums">{session.students}</span>
                </span>
              </div>
            </motion.article>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <footer className="px-5 py-3.5 border-t border-border/40 flex items-center justify-end gap-2 bg-muted/10 select-none">
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </footer>
      )}
    </WidgetCard>
  );
}
