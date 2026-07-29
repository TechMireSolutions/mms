import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Users, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useSessionsCollection } from "@/tenant/hooks/collections/sessions";
import { WidgetCard } from "@/components/ui/WidgetCard";
import { useTranslation } from "@/hooks/useTranslation";
import { SearchBar } from "@/components/ui/SearchBar";
import { SimplePagination } from "@/components/ui/SimplePagination";
import { useLocalPagination } from "@/hooks/useLocalPagination";
import { ROUTES } from "@/lib/config/routes";

export interface UpcomingSessionItem {
  id: number;
  name: string;
  teacher: string;
  time: string;
  room: string;
  students: number;
  status: "live" | "upcoming";
}

/** Timetable day keys are stored in English abbreviations — match only, do not localize. */
const WEEKDAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function hashStringToId(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index++) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/**
 * Today's scheduled sessions widget.
 */
export default function SessionsTable({ title }: { title?: string }) {
  const { t } = useTranslation();
  const dbSessions = useSessionsCollection();

  const sessions = useMemo(() => {
    const list: UpcomingSessionItem[] = [];
    const todayName = WEEKDAY_KEYS[new Date().getDay()];

    dbSessions.forEach((session) => {
      if (session.status !== "active") return;

      const classesList = session.classes || [];
      classesList.forEach((sessionClass, classIndex) => {
        const timetable = session.timetable || [];

        const classTimetable = timetable.filter(
          (timetableEntry) => timetableEntry.location === sessionClass.room && timetableEntry.day === todayName,
        );

        const timeStr = classTimetable[0]
          ? `${classTimetable[0].startTime} - ${classTimetable[0].endTime}`
          : t("dashboard.widgets.defaultSessionTime");
        const isLive = classTimetable.length > 0;

        list.push({
          id: hashStringToId(`${session.id}-${sessionClass.id}-${classIndex}`),
          name: `${session.name} – ${sessionClass.name}`,
          teacher: sessionClass.teacherName || t("sessions.classes.unassigned"),
          time: timeStr,
          room: sessionClass.room || t("common.notAvailable"),
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
    searchFields: (session) => [session.name, session.teacher, session.room],
  });

  return (
    <WidgetCard ariaLabelledby="sessions-table-heading" accentColor="primary">
      <header className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 ps-6.5 border-b border-border/45 select-none">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <h3 id="sessions-table-heading" className="min-w-0 truncate text-sm font-bold text-foreground m-0">
            {title || t("dashboard.widgets.todaysSessions")}
          </h3>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
            {t("dashboard.widgets.sessionsScheduled", { count: filteredSessions.length })}
          </span>
        </div>
        <Link to={ROUTES.sessions} className="inline-flex min-h-11 shrink-0 items-center text-xs font-bold text-primary hover:underline">
          {t("dashboard.widgets.viewAll")}
        </Link>
      </header>

      <div className="p-3 px-6 border-b border-border/40 flex items-center gap-2 bg-muted/10">
        <SearchBar
          placeholder={t("contacts.searchPlaceholder")}
          value={searchQuery}
          onChange={handleSearchChange}
          className="flex-1"
        />
      </div>

      <div className="divide-y divide-border/40 min-h-[12.5rem]">
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
              <div className="w-24 flex-shrink-0 text-start">
                <p className="text-sm font-bold text-foreground m-0 tabular-nums">{session.time}</p>
              </div>

              <div className="flex-shrink-0">
                {session.status === "live" ? (
                  <span
                    className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20 select-none animate-pulse"
                    aria-label={t("dashboard.widgets.sessionLiveAria")}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping shrink-0" />
                    <span>{t("dashboard.widgets.live")}</span>
                  </span>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-border/80 ms-2" aria-hidden="true" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate m-0">{session.name}</p>
                <p className="text-xs text-muted-foreground/80 mt-0.5 m-0 font-medium">{session.teacher}</p>
              </div>

              <div className="hidden sm:flex items-center gap-3.5 text-xs text-muted-foreground/75 flex-shrink-0 font-semibold select-none">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="sr-only">{t("dashboard.widgets.roomLabel")}</span> {session.room}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="sr-only">{t("sessions.report.studentsLabel")}</span>{" "}
                  <span className="tabular-nums">{session.students}</span>
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
