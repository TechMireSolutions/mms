import { ChevronDown, Filter } from "lucide-react";
import type { ModuleColumnRegistryEntry } from "@mms/shared";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ModuleColumnCustomizer, type ModuleColumnCustomizerLabels } from "@/components/ui/ModuleColumnCustomizer";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { SearchBar } from "@/components/ui/SearchBar";
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
  onSearchChange,
  onToggleStatus,
  onSpecializationChange,
  onToggleDeleted,
}: TeachersWorkTierToolbarProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row gap-3 bg-card/40 backdrop-blur-xl border border-border/50 p-3 rounded-2xl shadow-sm">
      <SearchBar
        value={search}
        onChange={onSearchChange}
        placeholder={t("teachers.searchPlaceholder")}
        className="flex-1"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className={`flex items-center gap-2 px-3.5 min-h-11 rounded-xl border text-sm font-medium transition-colors ${
              filterStatus.length > 0
                ? "border-primary/30 bg-primary/5 text-primary"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {t("teachers.filter.status")}
            {filterStatus.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {filterStatus.length}
              </span>
            )}
            <ChevronDown className="w-3 h-3" />
          </Button>
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
          <Button
            type="button"
            variant="ghost"
            className={`flex items-center gap-2 px-3.5 min-h-11 rounded-xl border text-sm font-medium transition-colors ${
              filterSpecialization
                ? "border-primary/30 bg-primary/5 text-primary"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            {filterSpecialization || t("teachers.filter.specialization")}
            <ChevronDown className="w-3 h-3" />
          </Button>
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
