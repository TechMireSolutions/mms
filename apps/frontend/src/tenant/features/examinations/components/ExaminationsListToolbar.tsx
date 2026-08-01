import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { useTranslation } from "@/hooks/useTranslation";
import { ChevronDown, Filter, RotateCcw, Search, Trash2 } from "lucide-react";

const EXAM_STATUSES = ["upcoming", "ongoing", "completed", "scheduled", "cancelled"] as const;

interface ExaminationsListToolbarProps {
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  search: string;
  filterStatus: string[];
  selectedCount: number;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  columnCustomizer?: ModuleColumnCustomizerProps;
  statusLabels: Record<(typeof EXAM_STATUSES)[number], string>;
  onSearchChange: (value: string) => void;
  onToggleStatus: (status: string) => void;
  onBulkAction: () => void;
  onNew: () => void;
}

export function ExaminationsListToolbar({
  viewMode,
  onViewModeChange,
  search,
  filterStatus,
  selectedCount,
  canWrite,
  canDelete,
  showDeleted,
  columnCustomizer,
  statusLabels,
  onSearchChange,
  onToggleStatus,
  onBulkAction,
  onNew,
}: ExaminationsListToolbarProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <Input
          id="search-exams"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("examinations.searchExams")}
          className="w-full min-w-0 ps-10 pe-4 py-2.5 rounded-xl border border-border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${filterStatus.length > 0 ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:bg-muted"}`}
          >
            <Filter className="w-3.5 h-3.5" aria-hidden="true" />
            {t("examinations.filter.status")}
            {filterStatus.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {filterStatus.length}
              </span>
            )}
            <ChevronDown className="w-3 h-3" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-xs">{t("examinations.filter.status")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {EXAM_STATUSES.map((status) => (
            <DropdownMenuCheckboxItem key={status} checked={filterStatus.includes(status)} onCheckedChange={() => onToggleStatus(status)}>
              {statusLabels[status]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex flex-wrap items-center gap-2">
        <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        {columnCustomizer && (
          <ModuleColumnCustomizer
            columnRegistry={columnCustomizer.columnRegistry}
            updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
            labels={columnCustomizer.labels}
          />
        )}
        {canDelete && selectedCount > 0 && (
          <Button
            type="button"
            variant={showDeleted ? "outline" : "destructive"}
            onClick={onBulkAction}
            className="flex items-center gap-1.5 whitespace-nowrap"
          >
            {showDeleted ? <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> : <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />}
            {showDeleted ? t("examinations.trash.restore") : t("common.delete")} ({selectedCount})
          </Button>
        )}
        {canWrite && !showDeleted && (
          <Button
            type="button"
            onClick={onNew}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            {t("examinations.newExam")}
          </Button>
        )}
      </div>
    </div>
  );
}
