import React, { useState } from "react";
import { Building2, ChevronRight, Plus, X } from "lucide-react";
import type { FacultyDepartmentEntity } from "@mms/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import {
  useFacultyDepartments,
  useSaveFacultyDepartment,
  useDeleteFacultyDepartment,
} from "@/tenant/features/faculty/hooks/useFacultyDepartments";

/** Normalized department catalog management using the faculty_departments table. */
export function FacultyDepartmentsSetupSection(): React.JSX.Element {
  const { t } = useTranslation();
  const { data: departments = [], isLoading } = useFacultyDepartments();
  const saveMutation = useSaveFacultyDepartment();
  const deleteMutation = useDeleteFacultyDepartment();
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");

  const isPending = saveMutation.isPending || deleteMutation.isPending || isLoading;

  const handleAdd = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const name = newName.trim();
    if (!name) return;

    const code = newCode.trim() || slugify(name);
    const alreadyExists = departments.some(
      (d) => d.code.toLowerCase() === code.toLowerCase(),
    );
    if (alreadyExists) {
      notify.error(t("faculty.setup.departmentCodeDuplicate"));
      return;
    }

    try {
      await saveMutation.mutateAsync({
        id: crypto.randomUUID(),
        name,
        code,
      });
      notify.success(t("faculty.setup.departmentSaved"));
      setNewName("");
      setNewCode("");
    } catch {
      notify.error(t("faculty.setup.lookupsSaveFailed"));
    }
  };

  const handleDelete = async (dept: FacultyDepartmentEntity) => {
    try {
      await deleteMutation.mutateAsync(dept.id);
      notify.success(t("faculty.setup.departmentSaved"));
    } catch (err) {
      // 409 = active faculty assignments reference this dept
      const isConflict =
        err instanceof Error && err.message.toLowerCase().includes("assignment");
      notify.error(
        isConflict
          ? t("faculty.setup.departmentInUse")
          : t("faculty.setup.lookupsSaveFailed"),
      );
    }
  };

  /* Render root departments first, then any with a parentId. */
  const roots = departments.filter((d) => !d.parentId);
  const children = departments.filter(Boolean);
  const ordered: FacultyDepartmentEntity[] = [
    ...roots,
    ...children.filter((d) => d.parentId && !roots.some((r) => r.id === d.id)),
  ];

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

        <form
          onSubmit={(e) => void handleAdd(e)}
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-1">
            <label
              htmlFor="new-faculty-department-name"
              className="text-xs text-muted-foreground"
            >
              {t("faculty.setup.departmentNamePlaceholder")}
            </label>
            <Input
              id="new-faculty-department-name"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (!newCode) setNewCode(slugify(e.target.value));
              }}
              placeholder={t("faculty.setup.departmentNamePlaceholder")}
              className={FORM_INPUT}
              disabled={isPending}
            />
          </div>
          <div className="w-32 space-y-1">
            <label
              htmlFor="new-faculty-department-code"
              className="text-xs text-muted-foreground"
            >
              {t("faculty.setup.departmentCodePlaceholder")}
            </label>
            <Input
              id="new-faculty-department-code"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              placeholder="code"
              className={FORM_INPUT}
              maxLength={32}
              disabled={isPending}
            />
          </div>
          <Button
            type="submit"
            className="min-h-11 shrink-0 gap-1.5"
            disabled={isPending || !newName.trim()}
          >
            <Plus className="size-4" aria-hidden />
            <span>{t("faculty.setup.addDepartment")}</span>
          </Button>
        </form>

        <div className="flex flex-wrap gap-2 pt-1">
          {ordered.map((dept) => (
            <Badge
              key={dept.id}
              variant="secondary"
              className="py-1.5 px-2.5 text-xs font-medium gap-1.5 bg-muted/60 hover:bg-muted"
            >
              {dept.parentId && (
                <ChevronRight className="size-3 text-muted-foreground" aria-hidden />
              )}
              <span>{dept.name}</span>
              <span className="text-muted-foreground font-mono text-[10px]">
                ({dept.code})
              </span>
              <button
                type="button"
                onClick={() => void handleDelete(dept)}
                disabled={isPending}
                className="hover:text-destructive transition-colors focus-visible:outline-none"
                aria-label={`${t("common.delete")} ${dept.name}`}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </Badge>
          ))}
          {ordered.length === 0 && !isLoading && (
            <p className="text-xs text-muted-foreground">
              {t("faculty.setup.noDepartments")}
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

/** Convert a display name to a URL-safe code slug (max 32 chars). */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}
