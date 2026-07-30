import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { SearchBar } from "@/components/ui/SearchBar";
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
}: EnrollmentListToolbarProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <SearchBar
        value={search}
        onChange={onSearchChange}
        placeholder={t("enrollments.searchPlaceholder")}
        className="flex-1 min-w-[11.25rem]"
      />

      {!showDeleted && (
        <div className="flex max-w-full overflow-x-auto rounded-lg border border-border text-xs font-bold" role="group" aria-label={t("enrollments.filter.status")}>
          <Button
            variant="ghost"
            onClick={() => onStatusChange("all")}
            className={`shrink-0 px-3 py-2 transition-colors rounded-none min-h-11 ${statusFilter === "all" ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
          >
            {t("enrollments.filter.all")}
          </Button>
          {ENROLLMENT_STATUSES.map((status) => (
            <Button
              key={status.id}
              variant="ghost"
              onClick={() => onStatusChange(status.id)}
              className={`shrink-0 px-3 py-2 transition-colors rounded-none min-h-11 ${statusFilter === status.id ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
            >
              {statusConfig[status.id]?.label ?? status.id}
            </Button>
          ))}
        </div>
      )}

      {!showDeleted && (
        <div className="flex items-center gap-1.5">
          <label htmlFor="filter-session" className="sr-only">{t("enrollments.filter.session")}</label>
          <FormSelect
            id="filter-session"
            value={sessionFilter}
            onChange={onSessionChange}
            options={[
              { value: "all", label: t("enrollments.filter.allSessions") },
              ...sessions.map((session) => ({ value: session.id, label: session.name })),
            ]}
            className="w-full min-w-0 text-sm sm:w-48"
          />
        </div>
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
