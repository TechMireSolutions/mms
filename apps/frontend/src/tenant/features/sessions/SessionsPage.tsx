import React, { useEffect, useMemo, useState } from "react";
import { usePersistedTabState } from "@/hooks/usePersistedTabState";
import { useTranslation } from "@/hooks/useTranslation";
import { useFilteredModuleTierTabs } from "@/tenant/hooks/useModuleTierTabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Calendar, Users, BookOpen, Archive, RotateCcw, Trash2,
  DollarSign, ChevronRight, Filter, ChevronDown, ChevronUp,
} from "lucide-react";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { SearchBar } from "@/components/ui/SearchBar";
import { FilterChips } from "@/components/ui/FilterChips";
import { ActionButton } from "@/components/ui/ActionButton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { SessionForm } from "@/tenant/features/sessions/components/SessionForm";
import { SessionDetail } from "@/tenant/features/sessions/components/SessionDetail";
import { SessionsSettings } from "@/tenant/features/sessions/components/SessionsSettings";
import ModuleReports from "@/tenant/features/reports/components/ModuleReports";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import { SESSION_TYPES, Session } from "@/lib/data/sessionsData";
import {
  useSessionsPaginated,
  useSessionMutations,
} from "@/tenant/features/sessions/hooks/useSessions";
import { useSessionColumnLayout } from "@/tenant/features/sessions/hooks/useSessionColumnLayout";
import { useSessionConfig } from "@/hooks/useStandardModuleConfig";
import { SessionsCommandMetrics } from "@/tenant/features/sessions/components/SessionsCommandMetrics";
import { ModuleColumnCustomizer } from "@/components/ui/ModuleColumnCustomizer";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { type AppTranslationKey, formatMoney, SESSIONS_MODULE_MANIFEST, toTitleCase, formatDate } from "@mms/shared";
import { notify } from "@/lib/notify";
import { ListPagination } from "@/components/ui/ListPagination";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { TableSkeleton } from "@/components/ui/LoadingState";

type SessionStatus = string;
type SessionType = string;
type SessionSortField = "name" | "type" | "status" | "baseFee";

import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { Card } from "@/components/ui/card";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { ResizableTableHead } from "@/components/ui/ResizableTableHead";

const MotionCard = motion.create(Card);

const TYPE_COLORS: Record<string, string> = {
  Hifz: "bg-success/15 text-success",
  Qaidah: "bg-info/15 text-info",
  Tajweed: "bg-primary/15 text-primary",
  "Islamic Studies": "bg-warning/15 text-warning",
  Arabic: "bg-secondary/15 text-secondary",
};

interface SessionCardProps {
  session: Session;
  onClick: () => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  canDelete?: boolean;
  showDeleted?: boolean;
  statusConfig: Record<string, StatusBadgeConfigItem>;
}

function SessionCard({
  session,
  onClick,
  onDelete,
  onRestore,
  canDelete,
  showDeleted,
  statusConfig,
}: SessionCardProps) {
  const { t } = useTranslation();
  const totalEnrolled = session.classes?.reduce((sum, sessionClass) => sum + sessionClass.enrolled, 0) ?? 0;
  const totalCapacity = session.classes?.reduce((sum, sessionClass) => sum + sessionClass.capacity, 0) ?? 0;
  const capacityPercent = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
  const classCount = session.classes?.length ?? 0;

  const accentColor = session.status === "active"
    ? "success" as const
    : session.status === "upcoming"
    ? "info" as const
    : undefined;

  return (
    <MotionCard
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      accentColor={accentColor}
      className="text-start w-full p-5 ps-6.5 hover:border-primary/40 group relative"
    >
      <button type="button" onClick={onClick} className="w-full text-start">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pe-3">
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

        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { icon: Calendar, label: t("sessions.card.start"), value: formatDate(session.startDate, true) },
            { icon: Users, label: t("sessions.card.enrolled"), value: `${totalEnrolled}/${totalCapacity || t("common.notSpecified")}` },
            { icon: DollarSign, label: t("sessions.card.fee"), value: formatMoney(session.baseFee, session.currency) },
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

        {totalCapacity > 0 && (
          <div>
            <div className="h-1 rounded-full bg-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${capacityPercent >= 100 ? "bg-destructive" : capacityPercent >= 80 ? "bg-warning" : "bg-success"}`}
                style={{ width: `${Math.min(capacityPercent, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {t("sessions.card.capacityUsed", {
                percent: capacityPercent,
                count: classCount,
                classesLabel: classCount === 1 ? t("sessions.card.classSingular") : t("sessions.card.classPlural"),
              })}
            </p>
          </div>
        )}
      </button>

      {canDelete && (
        <div className="absolute top-3 end-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {showDeleted ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={t("sessions.restore")}
              onClick={(event) => {
                event.stopPropagation();
                onRestore?.(session.id);
              }}
            >
              <RotateCcw className="w-3.5 h-3.5 text-primary" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={t("common.delete")}
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.(session.id);
              }}
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          )}
        </div>
      )}
    </MotionCard>
  );
}

export default function Sessions() {
  const {
    canWrite,
    canDelete,
    canReports: canViewReports,
    canViewSetup,
  } = useModulePermissions(SESSIONS_MODULE_MANIFEST);
  const PAGE_TABS = useFilteredModuleTierTabs({ canViewSetup, canViewReports });
  const { t } = useTranslation();
  const {
    createSession,
    updateSession,
    deleteSession,
    restoreSession,
    bulkDeleteSessions,
    bulkRestoreSessions,
  } = useSessionMutations();
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
  const [showDeleted, setShowDeleted] = useState(false);
  const [listPage, setListPage] = useState(1);
  const [sortField, setSortField] = useState<SessionSortField>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [confirmBulkRestoreOpen, setConfirmBulkRestoreOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = usePersistedTabState<string>("sessions_active_tab", "work");

  const useServerWork = activeTab === "work";
  const {
    data: workPageData,
    isLoading: isWorkLoading,
    isFetching: isWorkFetching,
    isError,
    refetch,
  } = useSessionsPaginated({
    page: listPage,
    limit: SESSIONS_MODULE_MANIFEST.defaultPageSize,
    search,
    status: filterStatus.length > 0 ? filterStatus.join(",") : undefined,
    type: filterType.length > 0 ? filterType.join(",") : undefined,
    sortField,
    sortDir,
    includeDeleted: showDeleted,
    enabled: useServerWork,
  });

  useEffect(() => {
    setListPage(1);
    setSelectedIds([]);
  }, [search, filterStatus, filterType, showDeleted, sortField, sortDir, listLayout]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        if (canWrite && !showDeleted) {
          event.preventDefault();
          setEditSession(null);
          setShowForm(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canWrite, showDeleted]);

  const sessions = useMemo(
    () => (workPageData?.sessions ?? []) as Session[],
    [workPageData],
  );
  const shownCount = workPageData?.total ?? sessions.length;

  const handleSave = async (sessionToSave: Session) => {
    if (editSession?.id) {
      await updateSession.mutateAsync({ id: sessionToSave.id, session: sessionToSave });
      notify.success(t("sessions.toast.updated"));
      if (detailSession?.id === sessionToSave.id) setDetailSession(sessionToSave);
    } else {
      const created = await createSession.mutateAsync(sessionToSave);
      notify.success(t("sessions.toast.created"));
      if (created.session) setDetailSession(created.session);
    }
  };

  const handleUpdate = async (updatedSession: Session) => {
    try {
      const response = await updateSession.mutateAsync(
        { id: updatedSession.id, session: updatedSession },
      );
      setDetailSession(response.session ?? updatedSession);
      notify.success(t("sessions.toast.updated"));
    } catch (error) {
      notify.error(t("sessions.toast.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const handleDelete = (id: string) => {
    deleteSession.mutate(id, {
      onSuccess: () => {
        notify.info(t("sessions.toast.deleted"));
        if (detailSession?.id === id) setDetailSession(null);
      },
      onError: (err) => notify.error(t("settings.serverSaveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handleRestore = (id: string) => {
    restoreSession.mutate(id, {
      onSuccess: () => notify.success(t("sessions.toast.restored")),
      onError: (err) => notify.error(t("settings.serverSaveFailed"), {
        description: err instanceof Error ? err.message : String(err),
      }),
    });
  };

  const handleBulkDelete = () => {
    bulkDeleteSessions.mutate(selectedIds, {
      onSuccess: (result) => {
        if (result.failed > 0) {
          notify.error(t("sessions.toast.bulkPartial", {
            succeeded: result.succeeded,
            failed: result.failed,
          }));
        } else {
          notify.success(t("sessions.toast.deleted"));
        }
        setSelectedIds([]);
      },
      onError: (error) => notify.error(t("sessions.toast.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      }),
    });
  };

  const handleBulkRestore = () => {
    bulkRestoreSessions.mutate(selectedIds, {
      onSuccess: (result) => {
        if (result.failed > 0) {
          notify.error(t("sessions.toast.bulkPartial", {
            succeeded: result.succeeded,
            failed: result.failed,
          }));
        } else {
          notify.success(t("sessions.toast.restored"));
        }
        setSelectedIds([]);
      },
      onError: (error) => notify.error(t("sessions.toast.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      }),
    });
  };

  const handleSort = (nextSortField: SessionSortField) => {
    if (sortField === nextSortField) {
      setSortDir((currentDirection) => currentDirection === "asc" ? "desc" : "asc");
      return;
    }
    setSortField(nextSortField);
    setSortDir("asc");
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
      sessionStatusLabelsByValue[statusOption] = translated === translationKey ? toTitleCase(statusOption) : translated;
    }
    return sessionStatusLabelsByValue;
  }, [statusOptions, t]);

  const statusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    active: { label: statusLabels.active || t("sessions.status.active"), cls: SEMANTIC_BADGE.success },
    upcoming: { label: statusLabels.upcoming || t("sessions.status.upcoming"), cls: SEMANTIC_BADGE.info },
    completed: { label: statusLabels.completed || t("sessions.status.completed"), cls: SEMANTIC_BADGE.muted },
    cancelled: { label: statusLabels.cancelled || t("sessions.status.cancelled"), cls: SEMANTIC_BADGE.destructive },
  }), [statusLabels, t]);
  const canSelectSessions = canWrite || canDelete;
  const allVisibleSelected = sessions.length > 0
    && sessions.every((sessionItem) => selectedIds.includes(sessionItem.id));
  const someVisibleSelected = sessions.some((sessionItem) => selectedIds.includes(sessionItem.id));

  const toggleSelectAll = (checked: boolean) => {
    const visibleIds = sessions.map((sessionItem) => sessionItem.id);
    setSelectedIds((currentIds) => checked
      ? [...new Set([...currentIds, ...visibleIds])]
      : currentIds.filter((id) => !visibleIds.includes(id)));
  };

  const toggleSelectedSession = (id: string, checked: boolean) => {
    setSelectedIds((currentIds) => checked
      ? [...currentIds, id]
      : currentIds.filter((selectedId) => selectedId !== id));
  };

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.sessions")}`}
      seoDescription={t("page.sessions.subtitle")}
      headerIcon={Calendar}
      headerTitle={t("nav.sessions")}
      headerSubtitle={t("page.sessions.subtitle")}
      headerActions={
        canWrite && !showDeleted ? (
          <ActionButton variant="primary" icon={Plus} onClick={() => { setEditSession(null); setShowForm(true); }}>
            {t("sessions.action.new")}
          </ActionButton>
        ) : undefined
      }
      metricsStrip={
        <SessionsCommandMetrics total={shownCount} shown={sessions.length} />
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
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar value={search} onChange={setSearch} placeholder={t("sessions.searchPlaceholder")} className="flex-1" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className={`flex items-center gap-2 px-3.5 min-h-[44px] rounded-xl border text-sm font-medium transition-colors ${filterStatus.length > 0 ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:bg-muted"}`}
                  >
                    <Filter className="w-3.5 h-3.5" /> {t("sessions.filter.status")} {filterStatus.length > 0 && <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{filterStatus.length}</span>}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel className="text-xs">{t("sessions.filter.status")}</DropdownMenuLabel>
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
                  <Button
                    type="button"
                    variant="ghost"
                    className={`flex items-center gap-2 px-3.5 min-h-[44px] rounded-xl border text-sm font-medium transition-colors ${filterType.length > 0 ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:bg-muted"}`}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> {t("sessions.filter.type")} {filterType.length > 0 && <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{filterType.length}</span>}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel className="text-xs">{t("sessions.filter.type")}</DropdownMenuLabel>
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

              {canDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowDeleted((previous) => !previous)}
                  aria-pressed={showDeleted}
                  className={`flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border text-sm font-medium transition-colors hover:bg-muted ${
                    showDeleted
                      ? "border-primary/40 bg-primary/10 text-primary hover:text-primary hover:bg-primary/10"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>{showDeleted ? t("sessions.showActive") : t("sessions.showDeleted")}</span>
                </Button>
              )}
            </div>

            <FilterChips
              chips={[
                ...filterStatus.map((statusOption) => ({ key: statusOption, label: statusLabels[statusOption], onRemove: () => toggleFilter(filterStatus, setFilterStatus, statusOption) })),
                ...filterType.map((typeOption) => ({ key: typeOption, label: typeOption, onRemove: () => toggleFilter(filterType, setFilterType, typeOption) })),
              ]}
              onClearAll={() => { setFilterStatus([]); setFilterType([]); }}
            />

            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-card/90 border border-primary/20 shadow-md backdrop-blur-md">
                <span className="text-sm font-semibold text-foreground">
                  {t("sessions.selectedCount", { count: selectedIds.length })}
                </span>
                {showDeleted ? (
                  <Button type="button" variant="outline" onClick={() => setConfirmBulkRestoreOpen(true)}>
                    <RotateCcw className="w-4 h-4 me-2" />
                    {t("sessions.restore")}
                  </Button>
                ) : (
                  <Button type="button" variant="destructive" onClick={() => setConfirmBulkDeleteOpen(true)}>
                    <Archive className="w-4 h-4 me-2" />
                    {t("sessions.archive")}
                  </Button>
                )}
              </div>
            )}

            {isError ? (
              <ErrorState
                title={t("sessions.toast.saveFailed")}
                description={t("common.retry")}
                onRetry={() => void refetch()}
              />
            ) : isWorkLoading ? (
              <TableSkeleton rows={6} cols={listLayout ? 6 : 3} />
            ) : sessions.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title={showDeleted ? t("sessions.empty.trashTitle") : t("sessions.empty.title")}
                description={showDeleted ? t("sessions.empty.trashSubtitle") : t("sessions.empty.subtitle")}
                action={!showDeleted && canWrite ? (
                  <ActionButton variant="primary" icon={Plus} onClick={() => setShowForm(true)}>
                    {t("sessions.action.new")}
                  </ActionButton>
                ) : undefined}
              />
            ) : listLayout ? (
              <div className="rounded-2xl border border-border bg-card/45 backdrop-blur-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm table-fixed">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/20">
                        {canSelectSessions && (
                          <th className="px-4 py-3 w-12">
                            <Checkbox
                              checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                              onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                              aria-label={t("sessions.selectedCount", { count: sessions.length })}
                            />
                          </th>
                        )}
                        {showName && (
                          <ResizableTableHead columnKey="name" width={columnLayout.getColumnWidth("name")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            <Button type="button" variant="ghost" className="h-auto p-0 text-[11px] font-semibold uppercase tracking-wide" onClick={() => handleSort("name")}>
                              {t("sessions.columns.name")}
                              {sortField === "name" && (sortDir === "asc" ? <ChevronUp className="ms-1 w-3 h-3" /> : <ChevronDown className="ms-1 w-3 h-3" />)}
                            </Button>
                          </ResizableTableHead>
                        )}
                        {showType && (
                          <ResizableTableHead columnKey="type" width={columnLayout.getColumnWidth("type")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            <Button type="button" variant="ghost" className="h-auto p-0 text-[11px] font-semibold uppercase tracking-wide" onClick={() => handleSort("type")}>
                              {t("sessions.columns.type")}
                              {sortField === "type" && (sortDir === "asc" ? <ChevronUp className="ms-1 w-3 h-3" /> : <ChevronDown className="ms-1 w-3 h-3" />)}
                            </Button>
                          </ResizableTableHead>
                        )}
                        {showDuration && (
                          <ResizableTableHead columnKey="duration" width={columnLayout.getColumnWidth("duration")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            {t("sessions.columns.duration")}
                          </ResizableTableHead>
                        )}
                        {showFee && (
                          <ResizableTableHead columnKey="fee" width={columnLayout.getColumnWidth("fee")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            <Button type="button" variant="ghost" className="h-auto p-0 text-[11px] font-semibold uppercase tracking-wide" onClick={() => handleSort("baseFee")}>
                              {t("sessions.columns.fee")}
                              {sortField === "baseFee" && (sortDir === "asc" ? <ChevronUp className="ms-1 w-3 h-3" /> : <ChevronDown className="ms-1 w-3 h-3" />)}
                            </Button>
                          </ResizableTableHead>
                        )}
                        {showEnrolled && (
                          <ResizableTableHead columnKey="enrolled" width={columnLayout.getColumnWidth("enrolled")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            {t("sessions.columns.enrolled")}
                          </ResizableTableHead>
                        )}
                        {showStatus && (
                          <ResizableTableHead columnKey="status" width={columnLayout.getColumnWidth("status")} onResize={columnLayout.setColumnWidth} className="px-4 py-3 text-start text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            <Button type="button" variant="ghost" className="h-auto p-0 text-[11px] font-semibold uppercase tracking-wide" onClick={() => handleSort("status")}>
                              {t("sessions.columns.status")}
                              {sortField === "status" && (sortDir === "asc" ? <ChevronUp className="ms-1 w-3 h-3" /> : <ChevronDown className="ms-1 w-3 h-3" />)}
                            </Button>
                          </ResizableTableHead>
                        )}
                        {canDelete && <th className="px-4 py-3 w-10"><span className="sr-only">{t("common.actions")}</span></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {sessions.map((sessionItem) => {
                        const totalEnrolled = sessionItem.classes?.reduce((sum: number, sessionClass: { enrolled: number }) => sum + sessionClass.enrolled, 0) ?? 0;
                        const totalCapacity = sessionItem.classes?.reduce((sum: number, sessionClass: { capacity: number }) => sum + sessionClass.capacity, 0) ?? 0;
                        return (
                          <tr key={sessionItem.id} onClick={() => !showDeleted && setDetailSession(sessionItem)} className="hover:bg-muted/20 cursor-pointer transition-colors group">
                            {canSelectSessions && (
                              <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                                <Checkbox
                                  checked={selectedIds.includes(sessionItem.id)}
                                  onCheckedChange={(checked) => toggleSelectedSession(sessionItem.id, checked === true)}
                                  aria-label={sessionItem.name}
                                />
                              </td>
                            )}
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
                                {totalEnrolled}/{totalCapacity || t("common.notSpecified")}
                              </td>
                            )}
                            {showStatus && (
                              <td className="px-4 py-3">
                                <StatusBadge status={sessionItem.status} config={statusConfig} size="sm" />
                              </td>
                            )}
                            {canDelete && (
                              <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label={t("common.actions")}>
                                      <ChevronDown className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {showDeleted ? (
                                      <DropdownMenuItem onClick={() => handleRestore(sessionItem.id)}>
                                        <RotateCcw className="w-3.5 h-3.5 me-2" /> {t("sessions.restore")}
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setPendingDeleteId(sessionItem.id)}>
                                        <Trash2 className="w-3.5 h-3.5 me-2" /> {t("common.delete")}
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
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
                {sessions.map((sessionItem) => (
                  <SessionCard
                    key={sessionItem.id}
                    session={sessionItem}
                    onClick={() => !showDeleted && setDetailSession(sessionItem)}
                    onDelete={(id) => setPendingDeleteId(id)}
                    onRestore={handleRestore}
                    canDelete={canDelete}
                    showDeleted={showDeleted}
                    statusConfig={statusConfig}
                  />
                ))}
              </div>
            )}

            {useServerWork && workPageData && (
              <ListPagination
                page={workPageData.page}
                total={workPageData.total}
                limit={workPageData.limit}
                hasMore={workPageData.hasMore}
                onPageChange={setListPage}
                i18nNamespace="sessions"
                variant="range"
              />
            )}
            {useServerWork && isWorkFetching && (
              <p className="text-xs text-muted-foreground px-1">{t("common.loading")}</p>
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
              <SessionsSettings />
            </ErrorBoundary>
          </motion.div>
        ) : null}
      </AnimatePresence>
      </ResponsiveAccordionTabs>

      <AnimatePresence>
        <SessionForm
          open={showForm}
          session={editSession}
          onClose={() => { setShowForm(false); setEditSession(null); }}
          onSave={handleSave}
        />
        {detailSession && !showDeleted && (
          <SessionDetail
            session={detailSession}
            onClose={() => setDetailSession(null)}
            onUpdate={handleUpdate}
            onEdit={(sessionToEdit: Session) => { setEditSession(sessionToEdit); setShowForm(true); }}
          />
        )}
      </AnimatePresence>

      <ConfirmAlertDialog
        open={pendingDeleteId != null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
        title={t("sessions.confirmDeleteTitle")}
        description={t("sessions.confirmDeleteDescription")}
        confirmLabel={t("sessions.archive")}
        cancelLabel={t("common.cancel")}
        onConfirm={() => {
          if (pendingDeleteId) handleDelete(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
      <ConfirmAlertDialog
        open={confirmBulkDeleteOpen}
        onOpenChange={setConfirmBulkDeleteOpen}
        title={t("sessions.confirmDeleteTitle")}
        description={t("sessions.bulkDeleteConfirm", { count: selectedIds.length })}
        confirmLabel={t("sessions.archive")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleBulkDelete}
      />
      <ConfirmAlertDialog
        open={confirmBulkRestoreOpen}
        onOpenChange={setConfirmBulkRestoreOpen}
        title={t("sessions.restore")}
        description={t("sessions.bulkRestoreConfirm", { count: selectedIds.length })}
        confirmLabel={t("sessions.restore")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleBulkRestore}
      />
    </ModulePageShell>
  );
}
