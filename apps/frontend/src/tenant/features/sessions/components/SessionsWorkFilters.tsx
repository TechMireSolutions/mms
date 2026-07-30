import { BookOpen, ChevronDown, Filter } from "lucide-react";
import type { ModuleColumnRegistryEntry } from "@mms/shared";
import { SearchBar } from "@/components/ui/SearchBar";
import { FilterChips } from "@/components/ui/FilterChips";
import { Button } from "@/components/ui/button";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ModuleColumnCustomizer,
  type ModuleColumnCustomizerLabels,
} from "@/components/ui/ModuleColumnCustomizer";
import { useTranslation } from "@/hooks/useTranslation";
import type { SessionStatus, SessionType } from "@/tenant/features/sessions/components/sessionPageTypes";

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
  listLayout: boolean;
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
  listLayout,
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
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={onSearchChange} placeholder={t("sessions.searchPlaceholder")} className="flex-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className={`flex items-center gap-2 px-3.5 min-h-11 rounded-xl border text-sm font-medium transition-colors ${filterStatus.length > 0 ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:bg-muted"}`}
            >
              <Filter className="w-3.5 h-3.5" /> {t("sessions.filter.status")} {filterStatus.length > 0 && <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{filterStatus.length}</span>}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-xs">{t("sessions.filter.status")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statusOptions.map((statusOption) => (
              <DropdownMenuCheckboxItem key={statusOption} checked={filterStatus.includes(statusOption)} onCheckedChange={() => onStatusFilterToggle(statusOption)}>
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
              className={`flex items-center gap-2 px-3.5 min-h-11 rounded-xl border text-sm font-medium transition-colors ${filterType.length > 0 ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:bg-muted"}`}
            >
              <BookOpen className="w-3.5 h-3.5" /> {t("sessions.filter.type")} {filterType.length > 0 && <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{filterType.length}</span>}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="text-xs">{t("sessions.filter.type")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {typeOptions.map((typeOption) => (
              <DropdownMenuCheckboxItem key={typeOption} checked={filterType.includes(typeOption)} onCheckedChange={() => onTypeFilterToggle(typeOption)}>
                {typeLabels[typeOption]}
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
          <ModuleTrashToggle
            showDeleted={showDeleted}
            onToggle={onToggleDeleted}
            showActiveLabel={t("sessions.showActive")}
            showDeletedLabel={t("sessions.showDeleted")}
            className={`flex items-center gap-1.5 px-3 min-h-11 rounded-xl border text-sm font-medium transition-colors hover:bg-muted ${
              showDeleted
                ? "border-primary/40 bg-primary/10 text-primary hover:text-primary hover:bg-primary/10"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          />
        )}
      </div>

      <FilterChips
        chips={[
          ...filterStatus.map((statusOption) => ({ key: statusOption, label: statusLabels[statusOption], onRemove: () => onStatusFilterToggle(statusOption) })),
          ...filterType.map((typeOption) => ({ key: typeOption, label: typeLabels[typeOption], onRemove: () => onTypeFilterToggle(typeOption) })),
        ]}
        onClearAll={onClearFilters}
      />
    </>
  );
}
