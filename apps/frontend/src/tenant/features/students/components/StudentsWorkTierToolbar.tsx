import { ChevronDown, Filter, RotateCcw, Users } from "lucide-react";
import { toTitleCase } from "@mms/shared";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModuleColumnCustomizer } from "@/components/ui/ModuleColumnCustomizer";
import { ModuleTrashToggle } from "@/components/ui/ModuleTrashToggle";
import { SearchBar } from "@/components/ui/SearchBar";
import { studentStatusLabel } from "@/lib/students/studentStatusUi";
import { useTranslation } from "@/hooks/useTranslation";
import type { useStudentColumnLayout } from "@/tenant/features/students/hooks/useStudentColumnLayout";

interface StudentsWorkTierToolbarProps {
  studentSearch: string;
  studentFilterStatus: string[];
  studentFilterGender: string;
  studentStatusOptions: readonly string[];
  genderFilters: string[];
  showDeleted: boolean;
  canDelete: boolean;
  columnLayout: ReturnType<typeof useStudentColumnLayout>;
  onSearchChange: (value: string) => void;
  onToggleStatus: (status: string) => void;
  onGenderChange: (value: string) => void;
  onToggleDeleted: () => void;
  onClearFilters: () => void;
}

export function StudentsWorkTierToolbar({
  studentSearch,
  studentFilterStatus,
  studentFilterGender,
  studentStatusOptions,
  genderFilters,
  showDeleted,
  canDelete,
  columnLayout,
  onSearchChange,
  onToggleStatus,
  onGenderChange,
  onToggleDeleted,
  onClearFilters,
}: StudentsWorkTierToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row gap-3 bg-card/40 backdrop-blur-xl border border-border/50 p-3 rounded-2xl shadow-sm">
      <SearchBar
        value={studentSearch}
        onChange={onSearchChange}
        placeholder={t("students.searchPlaceholder")}
        className="flex-1"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className={`flex items-center gap-2 px-3.5 min-h-11 rounded-xl border text-sm font-medium transition-colors ${
              studentFilterStatus.length > 0
                ? "border-primary/30 bg-primary/5 text-primary"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            <Filter className="w-3.5 h-3.5" /> {t("students.columns.status")}
            {studentFilterStatus.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {studentFilterStatus.length}
              </span>
            )}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-xs">{t("students.filterByStatus")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {studentFilterStatus.length > 0 && (
            <>
              <DropdownMenuItem
                onClick={onClearFilters}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-between"
              >
                <span>{t("students.clearAllFilters")}</span>
                <RotateCcw className="w-3 h-3 ms-1" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {studentStatusOptions.map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={studentFilterStatus.includes(status)}
              onCheckedChange={() => onToggleStatus(status)}
            >
              {studentStatusLabel(t, status)}
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
              studentFilterGender
                ? "border-primary/30 bg-primary/5 text-primary"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {studentFilterGender ? toTitleCase(studentFilterGender) : t("students.gender")}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuRadioGroup value={studentFilterGender} onValueChange={onGenderChange}>
            {["", ...genderFilters].map((genderFilter) => (
              <DropdownMenuRadioItem key={genderFilter || "all"} value={genderFilter}>
                {genderFilter ? toTitleCase(genderFilter) : t("students.allGenders")}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {canDelete && (
        <ModuleTrashToggle
          showDeleted={showDeleted}
          onToggle={onToggleDeleted}
          showActiveLabel={t("students.showActive")}
          showDeletedLabel={t("students.showDeleted")}
          className={`flex items-center gap-1.5 px-3 min-h-11 rounded-xl border text-sm font-medium transition-colors hover:bg-muted ${
            showDeleted
              ? "border-primary/40 bg-primary/10 text-primary hover:text-primary hover:bg-primary/10"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        />
      )}

      <ModuleColumnCustomizer
        columnRegistry={columnLayout.columnRegistry}
        updateUserColumnLayout={columnLayout.updateUserColumnLayout}
        labels={columnLayout.customizerLabels}
      />
    </div>
  );
}
