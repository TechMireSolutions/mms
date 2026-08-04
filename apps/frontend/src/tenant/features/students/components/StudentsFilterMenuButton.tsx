import { RotateCcw, SlidersHorizontal } from "lucide-react";
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
import { studentStatusLabel } from "@/lib/students/studentStatusUi";
import { useTranslation } from "@/hooks/useTranslation";

export interface StudentsFilterMenuButtonProps {
  studentFilterStatus: string[];
  studentFilterGender: string;
  studentStatusOptions: readonly string[];
  genderFilters: string[];
  onToggleStatus: (status: string) => void;
  onGenderChange: (value: string) => void;
  onClearFilters: () => void;
}

export function StudentsFilterMenuButton({
  studentFilterStatus,
  studentFilterGender,
  studentStatusOptions,
  genderFilters,
  onToggleStatus,
  onGenderChange,
  onClearFilters,
}: StudentsFilterMenuButtonProps) {
  const { t } = useTranslation();
  const activeFilterCount =
    studentFilterStatus.length + (studentFilterGender ? 1 : 0);

  return (
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
          <span>{t("students.filters")}</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border border-border">
        <DropdownMenuLabel className="text-xs text-foreground">
          {t("students.filterByStatus")}
        </DropdownMenuLabel>
        {activeFilterCount > 0 && (
          <>
            <DropdownMenuItem
              onClick={onClearFilters}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-between"
            >
              <span>{t("students.clearAllFilters")}</span>
              <RotateCcw className="w-3 h-3 ms-1" />
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
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

        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuLabel className="text-xs text-foreground">
          {t("students.gender")}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={studentFilterGender} onValueChange={onGenderChange}>
          {["", ...genderFilters].map((genderFilter) => (
            <DropdownMenuRadioItem key={genderFilter || "all"} value={genderFilter} className="text-sm">
              {genderFilter ? toTitleCase(genderFilter) : t("students.allGenders")}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
