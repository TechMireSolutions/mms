import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { FilterChips } from "@/components/ui/FilterChips";
import { ModuleClearFiltersButton } from "@/components/ui/ModuleClearFiltersButton";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { SearchBar } from "@/components/ui/SearchBar";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { Session } from "@mms/shared";
import { EnrollmentsFilterMenuButton } from "@/tenant/features/enrollments/components/EnrollmentsFilterMenuButton";

export const ENROLLMENTS_WORK_SEARCH_INPUT_ID = "enrollments-work-search";

interface EnrollmentListToolbarProps {
  search: string;
  statusFilter: string;
  sessionFilter: string;
  sessions: Session[];
  showDeleted: boolean;
  canDelete: boolean;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  columnCustomizer: ModuleColumnCustomizerProps;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSessionChange: (value: string) => void;
  onClearFilters: () => void;
  onShowDeletedChange?: (showDeleted: boolean) => void;
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
}

export function EnrollmentListToolbar({
  search,
  statusFilter,
  sessionFilter,
  sessions,
  showDeleted,
  canDelete,
  statusConfig,
  columnCustomizer,
  onSearchChange,
  onStatusChange,
  onSessionChange,
  onClearFilters,
  onShowDeletedChange,
  viewMode,
  onViewModeChange,
}: EnrollmentListToolbarProps): React.JSX.Element {
  const { t } = useTranslation();
  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) + (sessionFilter !== "all" ? 1 : 0);

  const statusOptions = Object.keys(statusConfig).map((statusKey) => ({
    value: statusKey,
    label: statusConfig[statusKey]?.label ?? statusKey,
  }));
  const sessionOptions = sessions.map((sessionItem) => ({
    value: sessionItem.id,
    label: sessionItem.name,
  }));

  return (
    <>
      <div className={cn(WORK_SURFACE, "flex flex-col sm:flex-row gap-3 p-3")}>
        <div className="relative min-w-0 flex-1">
          <SearchBar
            id={ENROLLMENTS_WORK_SEARCH_INPUT_ID}
            value={search}
            onChange={onSearchChange}
            placeholder={t("enrollments.searchPlaceholder")}
            className="w-full min-w-0"
          />
          <div className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 md:flex">
            <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
              /
            </kbd>
          </div>
        </div>

        <div className="flex max-w-full flex-wrap items-center gap-2 sm:flex-nowrap sm:overflow-x-auto">
          <EnrollmentsFilterMenuButton
            statusFilter={statusFilter}
            sessionFilter={sessionFilter}
            statusOptions={statusOptions}
            sessionOptions={sessionOptions}
            activeFilterCount={activeFilterCount}
            onStatusFilterChange={onStatusChange}
            onSessionFilterChange={onSessionChange}
            onClearFilters={onClearFilters}
          />

          {activeFilterCount > 0 ? (
            <ModuleClearFiltersButton
              onClearFilters={onClearFilters}
              label={t("enrollments.clearFilters")}
            />
          ) : null}

          {canDelete && onShowDeletedChange && (
            <ModuleTrashToggle
              showDeleted={showDeleted}
              onToggle={() => onShowDeletedChange(!showDeleted)}
              showActiveLabel={t("enrollments.showActive")}
              showDeletedLabel={t("enrollments.showDeleted")}
            />
          )}

          <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

          <ModuleColumnCustomizer
            columnRegistry={columnCustomizer.columnRegistry}
            updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
            labels={columnCustomizer.labels}
          />
        </div>
      </div>

      <FilterChips
        chips={[
          ...(statusFilter !== "all"
            ? [{ key: `status:${statusFilter}`, label: statusConfig[statusFilter]?.label ?? statusFilter, onRemove: () => onStatusChange("all") }]
            : []),
          ...(sessionFilter !== "all"
            ? [{ key: `session:${sessionFilter}`, label: sessions.find((s) => s.id === sessionFilter)?.name ?? sessionFilter, onRemove: () => onSessionChange("all") }]
            : []),
        ]}
        onClearAll={onClearFilters}
      />
    </>
  );
}
