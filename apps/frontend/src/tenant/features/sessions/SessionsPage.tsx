import React, { useState, useMemo } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useTranslation } from "@/hooks/useTranslation";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Calendar, Users, BookOpen,
  DollarSign, ChevronRight, Filter, ChevronDown,
} from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SearchBar } from "@/components/ui/SearchBar";
import { FilterChips } from "@/components/ui/FilterChips";
import { ActionButton } from "@/components/ui/ActionButton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SessionForm } from "@/tenant/features/sessions/components/SessionForm";
import { SessionDetail } from "@/tenant/features/sessions/components/SessionDetail";
import { SessionsSettings } from "@/tenant/features/sessions/components/SessionsSettings";
import ModuleReports from "@/tenant/features/reports/components/ModuleReports";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import { SESSION_TYPES, Session } from '@/lib/data/sessionsData';
import { formatDate } from "@/lib/db";
import { useSessionsCollection, useSessionMutations } from "@/tenant/features/sessions/hooks/useSessions";
import { useSessionColumnLayout } from "@/tenant/features/sessions/hooks/useSessionColumnLayout";
import { useSessionConfig } from "@/hooks/useStandardModuleConfig";
import { SessionsCommandMetrics } from "@/tenant/features/sessions/components/SessionsCommandMetrics";
import { ModuleColumnCustomizer } from "@/components/ui/ModuleColumnCustomizer";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { type AppTranslationKey, formatMoney, SESSIONS_MODULE_CONTRACT } from "@mms/shared";

type SessionStatus = string;
type SessionType = string;

import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";

const TYPE_COLORS: Record<string, string> = {
  "Hifz":            "bg-success/15 text-success",
  "Qaidah":          "bg-info/15 text-info",
  "Tajweed":         "bg-primary/15 text-primary",
  "Islamic Studies": "bg-warning/15 text-warning",
  "Arabic":          "bg-secondary/15 text-secondary",
};

interface SessionCardProps {
  session: Session;
  onClick: () => void;
  statusConfig: Record<string, StatusBadgeConfigItem>;
}

function SessionCard({ session, onClick, statusConfig }: SessionCardProps) {
  const totalEnrolled = session.classes?.reduce((sum, sessionClass) => sum + sessionClass.enrolled, 0) ?? 0;
  const totalCapacity = session.classes?.reduce((sum, sessionClass) => sum + sessionClass.capacity, 0) ?? 0;
  const capacityPercent = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  const formatSessionDate = (date: string | undefined) => formatDate(date, true);

  const stripeColor = session.status === "active"
    ? "bg-success/45 group-hover:bg-success"
    : session.status === "upcoming"
    ? "bg-info/45 group-hover:bg-info"
    : "bg-muted-foreground/35 group-hover:bg-muted-foreground";

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="relative overflow-hidden text-left w-full rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5 pl-6.5 hover:shadow-md hover:border-primary/40 transition-all duration-300 group"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${stripeColor} transition-colors duration-300`} />
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TYPE_COLORS[session.type as SessionType] ?? "bg-muted text-muted-foreground"}`}>
              {session.type}
            </span>
            <StatusBadge status={session.status} config={statusConfig} size="sm" />
          </div>
          <h3 className="text-[14px] font-bold text-foreground truncate group-hover:text-primary transition-colors">{session.name}</h3>
          {session.description && (
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{session.description}</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { icon: Calendar, label: "Start", value: formatSessionDate(session.startDate) },
          { icon: Users,    label: "Enrolled", value: `${totalEnrolled}/${totalCapacity || "—"}` },
          { icon: DollarSign, label: "Fee", value: formatMoney(session.baseFee, session.currency) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg bg-muted/30 px-2.5 py-2">
            <div className="flex items-center gap-1 mb-0.5">
              <Icon className="w-2.5 h-2.5 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-[11px] font-bold text-foreground truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Capacity bar */}
      {totalCapacity > 0 && (
        <div>
          <div className="h-1 rounded-full bg-border overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${capacityPercent >= 100 ? "bg-destructive" : capacityPercent >= 80 ? "bg-warning" : "bg-success"}`}
              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{capacityPercent}% capacity used · {session.classes?.length ?? 0} class{session.classes?.length !== 1 ? "es" : ""}</p>
        </div>
      )}
    </motion.button>
  );
}

/**
 * Sessions management — Work | Reports | Setup.
 * @returns The Sessions page.
 */
export default function Sessions() {
  const {
    canWrite,
    canReports: canViewReports,
    canViewSetup,
  } = useModulePermissions(SESSIONS_MODULE_CONTRACT);
  const PAGE_TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const { t } = useTranslation();
  const sessions = useSessionsCollection();
  const { createSession, updateSession } = useSessionMutations();
  const { settings, statuses, types } = useSessionConfig();
  
  const statusOptions = useMemo(() => {
    return statuses.length > 0 ? statuses : ["active", "upcoming", "completed", "cancelled"];
  }, [statuses]);
  const typeOptions = useMemo(() => {
    return types.length > 0 ? types : [...SESSION_TYPES];
  }, [types]);

  const columnLayout = useSessionColumnLayout();
  const listLayout = (settings.defaultViewLayout || "cards") === "list";
  const showName = columnLayout.isColumnVisible("name");
  const showType = columnLayout.isColumnVisible("type");
  const showDuration = columnLayout.isColumnVisible("duration");
  const showFee = columnLayout.isColumnVisible("fee");
  const showEnrolled = columnLayout.isColumnVisible("enrolled");
  const showStatus = columnLayout.isColumnVisible("status");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<SessionStatus[]>([]);
  const [filterType, setFilterType] = useState<SessionType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [detailSession, setDetailSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = usePersistedTabState<string>("sessions_active_tab", "work");

  const filtered = useMemo(() => {
    return sessions.filter((sessionItem) => {
      const normalizedSearch = search.toLowerCase();
      const matchSearch = !normalizedSearch || sessionItem.name.toLowerCase().includes(normalizedSearch) || sessionItem.type.toLowerCase().includes(normalizedSearch);
      const matchStatus = filterStatus.length === 0 || filterStatus.includes(sessionItem.status as SessionStatus);
      const matchType = filterType.length === 0 || filterType.includes(sessionItem.type as SessionType);
      return matchSearch && matchStatus && matchType;
    });
  }, [sessions, search, filterStatus, filterType]);

  const handleSave = (sessionToSave: Session) => {
    const existingSession = sessions.find((sessionItem) => sessionItem.id === sessionToSave.id);
    const handleSessionSaveSuccess = () => {
      if (detailSession?.id === sessionToSave.id) setDetailSession(sessionToSave);
      setShowForm(false);
      setEditSession(null);
    };
    if (existingSession) {
      updateSession.mutate({ id: sessionToSave.id, session: sessionToSave }, { onSuccess: handleSessionSaveSuccess });
    } else {
      createSession.mutate(sessionToSave, { onSuccess: handleSessionSaveSuccess });
    }
  };

  const handleUpdate = (updatedSession: Session) => {
    updateSession.mutate(
      { id: updatedSession.id, session: updatedSession },
      { onSuccess: () => setDetailSession(updatedSession) },
    );
  };

  const toggleFilter = <T,>(selectedValues: T[], setSelectedValues: React.Dispatch<React.SetStateAction<T[]>>, nextValue: T) =>
    setSelectedValues((currentValues) => currentValues.includes(nextValue)
      ? currentValues.filter((selectedValue) => selectedValue !== nextValue)
      : [...currentValues, nextValue]);


  const statusLabels = useMemo(() => {
    const sessionStatusLabelsByValue: Record<string, string> = {};
    for (const statusOption of statusOptions) {
      const translationKey = `sessions.status.${statusOption}` as AppTranslationKey;
      const translated = t(translationKey);
      sessionStatusLabelsByValue[statusOption] = translated === translationKey ? statusOption.charAt(0).toUpperCase() + statusOption.slice(1) : translated;
    }
    return sessionStatusLabelsByValue;
  }, [statusOptions, t]);

  const statusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    active:    { label: statusLabels.active || t("sessions.status.active") || "Active",       cls: SEMANTIC_BADGE.success },
    upcoming:  { label: statusLabels.upcoming || t("sessions.status.upcoming") || "Upcoming",   cls: SEMANTIC_BADGE.info },
    completed: { label: statusLabels.completed || t("sessions.status.completed") || "Completed", cls: SEMANTIC_BADGE.muted },
    cancelled: { label: statusLabels.cancelled || t("sessions.status.cancelled") || "Cancelled", cls: SEMANTIC_BADGE.destructive },
  }), [statusLabels, t]);

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.sessions")}`}
      seoDescription={t("page.sessions.subtitle")}
      headerIcon={Calendar}
      headerTitle={t("nav.sessions")}
      headerSubtitle={t("page.sessions.subtitle")}
      headerActions={
        canWrite && (
          <ActionButton variant="primary" icon={Plus} onClick={() => { setEditSession(null); setShowForm(true); }}>
            New Session
          </ActionButton>
        )
      }
      metricsStrip={
        <SessionsCommandMetrics total={sessions.length} shown={filtered.length} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={PAGE_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        panelIdPrefix="sessions-tab"
      >
      <AnimatePresence mode="wait">
        {activeTab === "work" ? (
          <motion.div
            key="work"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Search + filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar value={search} onChange={setSearch} placeholder="Search sessions…" className="flex-1" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${filterStatus.length > 0 ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:bg-muted"}`}>
                    <Filter className="w-3.5 h-3.5" /> Status {filterStatus.length > 0 && <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{filterStatus.length}</span>}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel className="text-xs">Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {statusOptions.map((statusOption) => (
                    <DropdownMenuCheckboxItem key={statusOption} checked={filterStatus.includes(statusOption)} onCheckedChange={() => toggleFilter(filterStatus, setFilterStatus, statusOption)}>
                      {statusLabels[statusOption]}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${filterType.length > 0 ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:bg-muted"}`}>
                    <BookOpen className="w-3.5 h-3.5" /> Type {filterType.length > 0 && <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{filterType.length}</span>}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel className="text-xs">Type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {typeOptions.map((typeOption) => (
                    <DropdownMenuCheckboxItem key={typeOption} checked={filterType.includes(typeOption)} onCheckedChange={() => toggleFilter(filterType, setFilterType, typeOption)}>
                      {typeOption}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {listLayout && (
                <ModuleColumnCustomizer
                  columnRegistry={columnLayout.columnRegistry}
                  updateUserColumnLayout={columnLayout.updateUserColumnLayout}
                  labels={columnLayout.customizerLabels}
                />
              )}
            </div>

            <FilterChips
              chips={[
                ...filterStatus.map((statusOption) => ({ key: statusOption, label: statusLabels[statusOption], onRemove: () => toggleFilter(filterStatus, setFilterStatus, statusOption) })),
                ...filterType.map((typeOption) => ({ key: typeOption, label: typeOption, onRemove: () => toggleFilter(filterType, setFilterType, typeOption) })),
              ]}
              onClearAll={() => { setFilterStatus([]); setFilterType([]); }}
            />

            {/* Session grid or list */}
            {filtered.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title={t("sessions.empty.title")}
                description="Try adjusting your filters or create a new session."
                action={<ActionButton variant="primary" icon={Plus} onClick={() => setShowForm(true)}>New Session</ActionButton>}
              />
            ) : listLayout ? (
              <div className="rounded-2xl border border-border bg-card/45 backdrop-blur-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/20">
                        {showName && (
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            {t("sessions.columns.name")}
                          </th>
                        )}
                        {showType && (
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            {t("sessions.columns.type")}
                          </th>
                        )}
                        {showDuration && (
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            {t("sessions.columns.duration")}
                          </th>
                        )}
                        {showFee && (
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            {t("sessions.columns.fee")}
                          </th>
                        )}
                        {showEnrolled && (
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            {t("sessions.columns.enrolled")}
                          </th>
                        )}
                        {showStatus && (
                          <th className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            {t("sessions.columns.status")}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filtered.map((sessionItem) => {
                        const totalEnrolled = sessionItem.classes?.reduce((sum: number, sessionClass: { enrolled: number }) => sum + sessionClass.enrolled, 0) ?? 0;
                        const totalCapacity = sessionItem.classes?.reduce((sum: number, sessionClass: { capacity: number }) => sum + sessionClass.capacity, 0) ?? 0;
                        return (
                          <tr key={sessionItem.id} onClick={() => setDetailSession(sessionItem)} className="hover:bg-muted/20 cursor-pointer transition-colors group">
                            {showName && (
                              <td className="px-4 py-3 font-semibold text-foreground group-hover:text-primary transition-colors">{sessionItem.name}</td>
                            )}
                            {showType && (
                              <td className="px-4 py-3">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TYPE_COLORS[sessionItem.type as SessionType] ?? "bg-muted text-muted-foreground"}`}>
                                  {sessionItem.type}
                                </span>
                              </td>
                            )}
                            {showDuration && (
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                {formatDate(sessionItem.startDate, true)} — {formatDate(sessionItem.endDate, true)}
                              </td>
                            )}
                            {showFee && (
                              <td className="px-4 py-3 text-xs font-medium">
                                {formatMoney(sessionItem.baseFee, sessionItem.currency)}
                              </td>
                            )}
                            {showEnrolled && (
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                {totalEnrolled}/{totalCapacity || "—"}
                              </td>
                            )}
                            {showStatus && (
                              <td className="px-4 py-3">
                                <StatusBadge status={sessionItem.status} config={statusConfig} size="sm" />
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((sessionItem) => (
                  <SessionCard
                    key={sessionItem.id}
                    session={sessionItem}
                    onClick={() => setDetailSession(sessionItem)}
                    statusConfig={statusConfig}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : activeTab === "reports" ? (
          <motion.div key="reports" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="space-y-4">
            <KPISummary category="sessions" />
            <ModuleReports category="sessions" />
          </motion.div>
        ) : activeTab === "setup" ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <ErrorBoundary>
              <SessionsSettings mode="preferences" />
            </ErrorBoundary>
          </motion.div>
        ) : null}
      </AnimatePresence>
      </ResponsiveAccordionTabs>

      {/* Modals */}
      <AnimatePresence>
        <SessionForm
          open={showForm}
          session={editSession}
          onClose={() => { setShowForm(false); setEditSession(null); }}
          onSave={handleSave}
        />
        {detailSession && (
          <SessionDetail
            session={detailSession}
            onClose={() => setDetailSession(null)}
            onUpdate={handleUpdate}
            onEdit={(sessionToEdit: Session) => { setEditSession(sessionToEdit); setShowForm(true); }}
          />
        )}
      </AnimatePresence>
    </ModulePageShell>
  );
}
