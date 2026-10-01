import React, { useState } from "react";
import { Building2, Plus, X } from "lucide-react";
import { FACULTY_DEPARTMENT_VALUES } from "@mms/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import {
  useFacultyLookupsQuery,
  useFacultyLookupMutation,
} from "@/tenant/features/faculty/hooks/useFacultyLookups";

/** Dynamic department catalog for faculty assignments. */
export function FacultyDepartmentsSetupSection(): React.JSX.Element {
  const { t } = useTranslation();
  const { data: lookups, isLoading } = useFacultyLookupsQuery();
  const mutation = useFacultyLookupMutation();
  const [newDepartment, setNewDepartment] = useState("");

  const currentDepartments = React.useMemo(() => {
    if (lookups?.departments && lookups.departments.length > 0) {
      return lookups.departments;
    }
    return [...FACULTY_DEPARTMENT_VALUES];
  }, [lookups?.departments]);

  const handleAdd = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = newDepartment.trim();
    if (!trimmed) return;
    const exists = currentDepartments.some(
      (dept) => dept.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) {
      setNewDepartment("");
      return;
    }
    const nextList = [...currentDepartments, trimmed];
    try {
      await mutation.mutateAsync({ kind: "departments", items: nextList });
      notify.success(t("faculty.setup.departmentSaved"));
      setNewDepartment("");
    } catch {
      notify.error(t("faculty.setup.lookupsSaveFailed"));
    }
  };

  const handleRemove = async (deptToRemove: string) => {
    const nextList = currentDepartments.filter((dept) => dept !== deptToRemove);
    try {
      await mutation.mutateAsync({ kind: "departments", items: nextList });
      notify.success(t("faculty.setup.departmentSaved"));
    } catch {
      notify.error(t("faculty.setup.lookupsSaveFailed"));
    }
  };

  return (
    <SectionCard
      title={t("faculty.setup.departmentsTitle")}
      icon={Building2}
      accentColor="primary"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("faculty.setup.departmentsHint")}
        </p>

        <form onSubmit={(e) => void handleAdd(e)} className="flex items-center gap-2">
          <Input
            id="new-faculty-department"
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
            placeholder={t("faculty.setup.departmentNamePlaceholder")}
            className={FORM_INPUT}
            disabled={mutation.isPending || isLoading}
          />
          <Button
            type="submit"
            className="min-h-11 shrink-0 gap-1.5"
            disabled={mutation.isPending || isLoading || !newDepartment.trim()}
          >
            <Plus className="size-4" aria-hidden />
            <span>{t("faculty.setup.addDepartment")}</span>
          </Button>
        </form>

        <div className="flex flex-wrap gap-2 pt-1">
          {currentDepartments.map((dept) => (
            <Badge
              key={dept}
              variant="secondary"
              className="py-1.5 px-2.5 text-xs font-medium gap-1.5 bg-muted/60 hover:bg-muted"
            >
              <span>{dept}</span>
              <button
                type="button"
                onClick={() => void handleRemove(dept)}
                disabled={mutation.isPending}
                className="hover:text-destructive transition-colors focus-visible:outline-none"
                aria-label={`${t("common.delete")} ${dept}`}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </Badge>
          ))}
          {currentDepartments.length === 0 && !isLoading && (
            <p className="text-xs text-muted-foreground">
              {t("faculty.setup.noDepartments")}
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
