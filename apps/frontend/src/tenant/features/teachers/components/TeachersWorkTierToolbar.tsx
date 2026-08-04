import { ChevronDown, Filter } from "lucide-react";
import type { ModuleColumnRegistryEntry } from "@mms/shared";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerLabels } from "@/components/ui/ModuleColumnCustomizer";
import { WorkViewModeToggle } from "@/components/ui/WorkViewModeToggle";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { ModuleFiltersMenuTrigger } from "@/components/ui/ModuleFiltersMenuButton";
import { SearchBar } from "@/components/ui/SearchBar";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { teacherStatusLabel } from "@/tenant/features/teachers/teacherPageUtils";

interface TeachersWorkTierToolbarProps {
  search: string;
  filterStatus: string[];
  filterSpecialization: string;
  statusOptions: string[];
  specializationOptions: string[];
  showDeleted: boolean;
  canDelete: boolean;
  columnRegistry: ModuleColumnRegistryEntry[];
  updateUserColumnLayout: (columnRegistry: ModuleColumnRegistryEntry[]) => void;
  customizerLabels: ModuleColumnCustomizerLabels;
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  onSearchChange: (value: string) => void;
  onToggleStatus: (status: string) => void;
  onSpecializationChange: (value: string) => void;
  onToggleDeleted: () => void;
}

export function TeachersWorkTierToolbar({
  search,
  filterStatus,
  filterSpecialization,
  statusOptions,
  specializationOptions,
  showDeleted,
  canDelete,
  columnRegistry,
  updateUserColumnLayout,
  customizerLabels,
  viewMode,
  onViewModeChange,
  onSearchChange,
  onToggleStatus,
  onSpecializationChange,
  onToggleDeleted,
}: TeachersWorkTierToolbarProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={cn(WORK_SURFACE, "flex flex-col sm:flex-row gap-3 p-3")}>
      <SearchBar
        value={search}
        onChange={onSearchChange}
        placeholder={t("teachers.searchPlaceholder")}
        className="flex-1"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ModuleFiltersMenuTrigger
            label={t("teachers.filter.status")}
            activeCount={filterStatus.length}
            icon={Filter}
          >
            <ChevronDown className="w-3 h-3" />
          </ModuleFiltersMenuTrigger>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-xs">{t("teachers.filter.status")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {statusOptions.map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={filterStatus.includes(status)}
              onCheckedChange={() => onToggleStatus(status)}
            >
              {teacherStatusLabel(t, status)}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ModuleFiltersMenuTrigger
            label={filterSpecialization || t("teachers.filter.specialization")}
            activeCount={filterSpecialization ? 1 : 0}
          >
            <ChevronDown className="w-3 h-3" />
          </ModuleFiltersMenuTrigger>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuRadioGroup
            value={filterSpecialization}
            onValueChange={onSpecializationChange}
          >
            <DropdownMenuRadioItem value="">
              {t("teachers.filter.allSpecializations")}
            </DropdownMenuRadioItem>
            {specializationOptions.map((specialization) => (
              <DropdownMenuRadioItem key={specialization} value={specialization}>
                {specialization}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <WorkViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />

      <ModuleColumnCustomizer
        columnRegistry={columnRegistry}
        updateUserColumnLayout={updateUserColumnLayout}
        labels={customizerLabels}
      />

      {canDelete && (
        <ModuleTrashToggle
          showDeleted={showDeleted}
          onToggle={onToggleDeleted}
          showActiveLabel={t("teachers.showActive")}
          showDeletedLabel={t("teachers.showDeleted")}
          className={`flex items-center gap-1.5 px-3 min-h-11 rounded-xl border text-sm font-medium transition-colors hover:bg-muted ${
            showDeleted
              ? "border-primary/40 bg-primary/10 text-primary hover:text-primary hover:bg-primary/10"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        />
      )}
    </div>
  );
}
