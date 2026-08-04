import { ChevronDown, Filter, Plus, Search, X } from "lucide-react";

import { ModuleColumnCustomizer, type ModuleColumnCustomizerProps } from "@/components/ui/ModuleColumnCustomizer";
import { Button } from "@/components/ui/button";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { Distribution } from "@/lib/data/hasanatData";

type DistributionStatus = Distribution["status"];

interface DistributionManagerToolbarProps {
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  search: string;
  filterStatus: DistributionStatus[];
  statusLabels: Record<DistributionStatus, string>;
  statusConfig: Record<DistributionStatus, StatusBadgeConfigItem>;
  canWrite: boolean;
  showDeleted: boolean;
  columnCustomizer?: ModuleColumnCustomizerProps;
  onSearchChange: (value: string) => void;
  onToggleStatus: (status: DistributionStatus) => void;
  onOpenModal: () => void;
}

export function DistributionManagerToolbar({
  search,
  filterStatus,
  statusLabels,
  statusConfig,
  canWrite,
  showDeleted,
  columnCustomizer,
  onSearchChange,
  onToggleStatus,
  onOpenModal,
  viewMode,
  onViewModeChange,
}: DistributionManagerToolbarProps) {
  const { t } = useTranslation();
  const statuses = Object.keys(statusConfig) as DistributionStatus[];

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative min-w-0 flex-1">
        <label htmlFor="search-dist" className="sr-only">{t("hasanat.distribution.searchLabel")}</label>
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <Input
          id="search-dist"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("hasanat.searchDistributions")}
          className="w-full ps-10 pe-11 py-2.5 rounded-xl border border-border text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
        />
        {search && (
          <Button
            variant="ghost"
            type="button"
            size="icon"
            aria-label={t("common.clearSearch")}
            onClick={() => onSearchChange("")}
            className="absolute end-1 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium ${filterStatus.length > 0 ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card hover:bg-muted"}`}>
              <Filter className="w-3.5 h-3.5" aria-hidden="true" /> {t("common.status")} <ChevronDown className="w-3 h-3" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-xs">{t("hasanat.filter.status")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statuses.map((status) => (
              <DropdownMenuCheckboxItem key={status} checked={filterStatus.includes(status)} onCheckedChange={() => onToggleStatus(status)}>
                {statusLabels[status]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        {columnCustomizer && (
          <ModuleColumnCustomizer
            columnRegistry={columnCustomizer.columnRegistry}
            updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
            labels={columnCustomizer.labels}
          />
        )}
        {canWrite && !showDeleted && (
          <Button type="button" onClick={onOpenModal} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("hasanat.distributeCards")}
          </Button>
        )}
      </div>
    </header>
  );
}
