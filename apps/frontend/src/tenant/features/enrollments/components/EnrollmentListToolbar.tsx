import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { SearchBar } from "@/components/ui/SearchBar";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { useTranslation } from "@/hooks/useTranslation";
import { ENROLLMENT_STATUSES } from "@/lib/data/enrollmentData";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import type { Session } from "@mms/shared";

interface EnrollmentListToolbarProps {
  search: string;
  statusFilter: string;
  sessionFilter: string;
  sessions: Session[];
  showDeleted: boolean;
  canDelete: boolean;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  columnCustomizer?: ModuleColumnCustomizerProps;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSessionChange: (value: string) => void;
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
  onShowDeletedChange,
  viewMode,
  onViewModeChange,
}: EnrollmentListToolbarProps): React.JSX.Element {
  const { t } = useTranslation();
  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) + (sessionFilter !== "all" ? 1 : 0);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <SearchBar
        value={search}
        onChange={onSearchChange}
        placeholder={t("enrollments.searchPlaceholder")}
        className="flex-1 min-w-[11.25rem]"
      />

      {!showDeleted && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className={`flex items-center gap-1.5 px-3 min-h-11 rounded-xl border text-sm font-medium transition-colors hover:bg-muted ${
                activeFilterCount > 0
                  ? "border-primary/30 bg-primary/5 text-primary hover:text-primary hover:bg-primary/5"
                  : "border-border bg-card text-foreground"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("common.filters")}</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border border-border">
            <DropdownMenuLabel className="text-xs">{t("enrollments.filter.status")}</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={statusFilter} onValueChange={onStatusChange}>
              <DropdownMenuRadioItem value="all" className="text-sm">
                {t("enrollments.filter.all")}
              </DropdownMenuRadioItem>
              {ENROLLMENT_STATUSES.map((status) => (
                <DropdownMenuRadioItem key={status.id} value={status.id} className="text-sm">
                  {statusConfig[status.id]?.label ?? status.id}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuLabel className="text-xs">{t("enrollments.filter.session")}</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={sessionFilter} onValueChange={onSessionChange}>
              <DropdownMenuRadioItem value="all" className="text-sm">
                {t("enrollments.filter.allSessions")}
              </DropdownMenuRadioItem>
              {sessions.map((session) => (
                <DropdownMenuRadioItem key={session.id} value={session.id} className="text-sm">
                  {session.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            {activeFilterCount > 0 && (
              <>
                <DropdownMenuSeparator className="bg-border" />
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start px-2 min-h-11 text-sm text-muted-foreground"
                  onClick={() => {
                    onStatusChange("all");
                    onSessionChange("all");
                  }}
                >
                  {t("common.clearFilters")}
                </Button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {canDelete && onShowDeletedChange && (
        <ModuleTrashToggle
          showDeleted={showDeleted}
          onToggle={() => onShowDeletedChange(!showDeleted)}
          showActiveLabel={t("enrollments.showActive")}
          showDeletedLabel={t("enrollments.showDeleted")}
          className={showDeleted ? "border-destructive/40 text-destructive" : undefined}
        />
      )}

      <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

      {columnCustomizer && !showDeleted && (
        <ModuleColumnCustomizer
          columnRegistry={columnCustomizer.columnRegistry}
          updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
          labels={columnCustomizer.labels}
        />
      )}
    </div>
  );
}
