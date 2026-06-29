import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ChevronDown, ChevronUp, X, Calendar } from "lucide-react";
import { DatePicker } from "../ui/DatePicker";
import { useSessionsCollection } from "@/hooks/useSessions";
import { useTranslation } from "@/hooks/useTranslation";

const STATUSES: string[] = ["all", "active", "inactive", "completed"];

export interface ReportFilterFields {
  session: string;
  class: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  student: string;
}

interface ReportFiltersProps {
  category: string;
  filters: ReportFilterFields;
  onChange: (filters: ReportFilterFields) => void;
}

const CATEGORY_FILTERS: Record<string, (keyof ReportFilterFields)[]> = {
  attendance: ["session", "class", "dateFrom", "dateTo", "student"],
  students:   ["session", "class", "status", "student"],
  contacts:   ["status", "student"],
  financial:  ["session", "dateFrom", "dateTo", "status"],
  academic:   ["session", "class", "status", "student"],
  hasanat:    ["session", "class", "dateFrom", "dateTo"],
  sessions:   ["status"],
};

export default function ReportFilters({ category, filters, onChange }: ReportFiltersProps): React.JSX.Element {
  const { t } = useTranslation();
  const [open, setOpen] = useState<boolean>(true);

  const allowed = CATEGORY_FILTERS[category] || ["session", "class", "status", "dateFrom", "dateTo", "student"];

  const rawSessions = useSessionsCollection();

  const sessions = useMemo(() => {
    return [{ id: "all", name: t("reports.filters.allSessions") }, ...rawSessions.map((session) => ({ id: session.id, name: session.name }))];
  }, [rawSessions, t]);

  const classes = useMemo(() => {
    const uniqueClasses = new Set<string>();
    rawSessions.forEach((session) => (session.classes || []).forEach((sessionClass) => uniqueClasses.add(sessionClass.name)));
    return [{ id: "all", name: t("reports.filters.allClasses") }, ...Array.from(uniqueClasses).map((name) => ({ id: name, name }))];
  }, [rawSessions, t]);

  const set = (key: keyof ReportFilterFields, value: string): void => {
    onChange({ ...filters, [key]: value });
  };

  const activeCount = [
    filters.session !== "all",
    filters.class !== "all",
    filters.status !== "all",
    !!(filters.dateFrom || filters.dateTo),
    !!filters.student,
  ].filter(Boolean).length;

  const reset = (): void => {
    onChange({
      session: "all",
      class: "all",
      status: "all",
      dateFrom: "",
      dateTo: "",
      student: "",
    });
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
        type="button"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{t("reports.filters.title")}</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                reset();
              }}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
              type="button"
            >
              <X className="w-3 h-3" /> {t("reports.filters.clearAll")}
            </button>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Filter fields */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-wrap gap-4 border-t border-border/50 pt-4">
              {/* Session */}
              {allowed.includes("session") && (
                <div className="flex flex-col gap-1 text-left min-w-[140px] flex-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{t("reports.filters.session")}</label>
                  <select
                    value={filters.session}
                    onChange={(event) => set("session", event.target.value)}
                    className="text-sm rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>{session.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Class */}
              {allowed.includes("class") && (
                <div className="flex flex-col gap-1 text-left min-w-[140px] flex-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{t("reports.filters.class")}</label>
                  <select
                    value={filters.class}
                    onChange={(event) => set("class", event.target.value)}
                    className="text-sm rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {classes.map((sessionClass) => (
                      <option key={sessionClass.id} value={sessionClass.id}>{sessionClass.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status */}
              {allowed.includes("status") && (
                <div className="flex flex-col gap-1 text-left min-w-[120px] flex-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{t("reports.filters.status")}</label>
                  <select
                    value={filters.status}
                    onChange={(event) => set("status", event.target.value)}
                    className="text-sm rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status === "all"
                          ? t("reports.filters.allStatuses")
                          : t(`reports.filters.status${status.charAt(0).toUpperCase() + status.slice(1)}` as any)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date From */}
              {allowed.includes("dateFrom") && (
                <div className="flex flex-col gap-1 text-left min-w-[130px] flex-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Calendar className="w-3 h-3" />{t("reports.filters.from")}</label>
                  <DatePicker
                    value={filters.dateFrom}
                    onChange={(value) => set("dateFrom", value)}
                  />
                </div>
              )}

              {/* Date To */}
              {allowed.includes("dateTo") && (
                <div className="flex flex-col gap-1 text-left min-w-[130px] flex-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Calendar className="w-3 h-3" />{t("reports.filters.to")}</label>
                  <DatePicker
                    value={filters.dateTo}
                    onChange={(value) => set("dateTo", value)}
                  />
                </div>
              )}

              {/* Student */}
              {allowed.includes("student") && (
                <div className="flex flex-col gap-1 text-left min-w-[150px] flex-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{t("reports.filters.student")}</label>
                  <input
                    type="text"
                    value={filters.student}
                    onChange={(event) => set("student", event.target.value)}
                    placeholder={t("reports.filters.searchName")}
                    className="text-sm rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
