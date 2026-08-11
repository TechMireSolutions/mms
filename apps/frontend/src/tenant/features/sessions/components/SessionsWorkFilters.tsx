import type { ModuleColumnRegistryEntry } from "@mms/shared";
import { SearchBar } from "@/components/ui/SearchBar";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { FilterChips } from "@/components/ui/FilterChips";
import { ModuleClearFiltersButton } from "@/components/ui/ModuleClearFiltersButton";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import {
  ModuleColumnCustomizer,
  type ModuleColumnCustomizerLabels,
} from "@/components/ui/ModuleColumnCustomizer";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { SessionStatus, SessionType } from "@/tenant/features/sessions/components/sessionPageTypes";
import { SESSIONS_WORK_SEARCH_INPUT_ID } from "@/tenant/features/sessions/hooks/useSessionsKeyboardShortcuts";
import { SessionsFilterMenuButton } from "@/tenant/features/sessions/components/SessionsFilterMenuButton";

interface SessionsWorkColumnLayout {
  columnRegistry: ModuleColumnRegistryEntry[];
  updateUserColumnLayout: (columnRegistry: ModuleColumnRegistryEntry[]) => void;
  customizerLabels: ModuleColumnCustomizerLabels;
}

interface SessionsWorkFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  filterStatus: SessionStatus[];
  filterType: SessionType[];
  statusOptions: string[];
  typeOptions: string[];
  statusLabels: Record<string, string>;
  typeLabels: Record<string, string>;
  activeFilterCount: number;
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  columnLayout: SessionsWorkColumnLayout;
  canDelete: boolean;
  showDeleted: boolean;
  onStatusFilterToggle: (status: SessionStatus) => void;
  onTypeFilterToggle: (type: SessionType) => void;
  onClearFilters: () => void;
  onToggleDeleted: () => void;
}

export function SessionsWorkFilters({
  search,
  onSearchChange,
  filterStatus,
  filterType,
  statusOptions,
  typeOptions,
  statusLabels,
  typeLabels,
  activeFilterCount,
  viewMode,
  onViewModeChange,
  columnLayout,
  canDelete,
  showDeleted,
  onStatusFilterToggle,
  onTypeFilterToggle,
  onClearFilters,
  onToggleDeleted,
}: SessionsWorkFiltersProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className={cn(WORK_SURFACE, "flex flex-col sm:flex-row gap-3 p-3")}>
        <div className="relative min-w-0 flex-1">
          <SearchBar
            id={SESSIONS_WORK_SEARCH_INPUT_ID}
            value={search}
            onChange={onSearchChange}
            placeholder={t("sessions.searchPlaceholder")}
            className="w-full min-w-0"
          />
          <div className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 md:flex">
            <kbd className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
              /
            </kbd>
          </div>
        </div>

        <div className="flex max-w-full flex-wrap items-center gap-2 sm:flex-nowrap sm:overflow-x-auto">
          <SessionsFilterMenuButton
            filterStatus={filterStatus}
            filterType={filterType}
            statusOptions={statusOptions}
            typeOptions={typeOptions}
            statusLabels={statusLabels}
            typeLabels={typeLabels}
            activeFilterCount={activeFilterCount}
            onStatusFilterToggle={onStatusFilterToggle}
            onTypeFilterToggle={onTypeFilterToggle}
            onClearFilters={onClearFilters}
          />

          {activeFilterCount > 0 ? (
            <ModuleClearFiltersButton
              onClearFilters={onClearFilters}
              label={t("sessions.clearFilters")}
            />
          ) : null}

          {canDelete && (
            <ModuleTrashToggle
              showDeleted={showDeleted}
              onToggle={onToggleDeleted}
              showActiveLabel={t("sessions.showActive")}
              showDeletedLabel={t("sessions.showDeleted")}
            />
          )}

          <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

          <ModuleColumnCustomizer
            columnRegistry={columnLayout.columnRegistry}
            updateUserColumnLayout={columnLayout.updateUserColumnLayout}
            labels={columnLayout.customizerLabels}
          />
        </div>
      </div>

      <FilterChips
        chips={[
          ...filterStatus.map((statusOption) => ({ key: statusOption, label: statusLabels[statusOption] ?? statusOption, onRemove: () => onStatusFilterToggle(statusOption) })),
          ...filterType.map((typeOption) => ({ key: typeOption, label: typeLabels[typeOption] ?? typeOption, onRemove: () => onTypeFilterToggle(typeOption) })),
        ]}
        onClearAll={onClearFilters}
      />
    </>
  );
}
