import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FacultyDepartmentEntity } from "@mms/shared";
import { FACULTY_DEPARTMENT_VALUES } from "@mms/shared";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { Field } from "@/components/ui/FormPrimitives";
import { FORM_SELECT } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { useSaveFacultyDepartment, useDeleteFacultyDepartment } from "../hooks/useFacultyDepartments";
import { slugifyDepartmentCode } from "../hooks/useFacultyDepartmentsController";
import { type DepartmentItem, FacultyDepartmentDropdownMenu } from "./FacultyDepartmentDropdownMenu";

export interface FacultyDepartmentSelectFieldProps {
  value: string;
  departmentId?: string;
  error?: string;
  required?: boolean;
  departmentOptions?: string[];
  departmentEntities?: FacultyDepartmentEntity[];
  facultyId?: string;
  reportingFacultyId?: string | null;
  onChange: (patch: { department: string; departmentId?: string; reportingFacultyId?: string | null }) => void;
}

export function FacultyDepartmentSelectField({
  value,
  departmentId,
  error,
  required,
  departmentOptions,
  departmentEntities,
  facultyId,
  reportingFacultyId,
  onChange,
}: FacultyDepartmentSelectFieldProps): React.JSX.Element {
  const { t } = useTranslation();
  const saveMutation = useSaveFacultyDepartment();
  const deleteMutation = useDeleteFacultyDepartment();

  const [isOpen, setIsOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const items = useMemo<DepartmentItem[]>(() => {
    if (departmentEntities?.length) {
      const list: DepartmentItem[] = departmentEntities.map((d) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        isEntity: true,
      }));
      if (value && !departmentEntities.some((d) => d.name === value)) {
        list.unshift({ name: value, isEntity: false });
      }
      return list;
    }
    const raw: readonly string[] = departmentOptions?.length ? departmentOptions : FACULTY_DEPARTMENT_VALUES;
    const exists = value ? raw.some((val) => val === value) : true;
    const list = value && !exists ? [value, ...raw] : raw;
    return list.map((opt) => ({ name: opt, isEntity: false }));
  }, [departmentEntities, departmentOptions, value]);

  const selectedEntity = departmentEntities?.find((d) => d.id === departmentId || d.name === value);
  const targetDeleteEntity = departmentEntities?.find((d) => d.id === deleteTargetId);

  const handleSelect = (item: DepartmentItem) => {
    const matched = departmentEntities?.find((d) => d.id === item.id || d.name === item.name);
    const patch: { department: string; departmentId?: string; reportingFacultyId?: string | null } = {
      department: item.name,
      ...(matched ? { departmentId: matched.id } : { departmentId: undefined }),
    };
    if (matched?.headFacultyId && !reportingFacultyId && matched.headFacultyId !== facultyId) {
      patch.reportingFacultyId = matched.headFacultyId;
    }
    onChange(patch);
    setIsOpen(false);
  };

  const handleSaveNew = async (name: string) => {
    const code = slugifyDepartmentCode(name) || `dept-${Date.now().toString(36)}`;
    const saved = await saveMutation.mutateAsync({
      id: crypto.randomUUID(),
      name,
      code,
      parentId: null,
      headFacultyId: null,
    });
    onChange({ department: saved.name, departmentId: saved.id });
    notify.success(t("faculty.setup.departmentSaved"));
    setIsOpen(false);
  };

  const handleUpdate = async (id: string, name: string) => {
    const existing = departmentEntities?.find((d) => d.id === id);
    if (!existing) return;
    const code = existing.code || slugifyDepartmentCode(name) || `dept-${Date.now().toString(36)}`;
    const updated = await saveMutation.mutateAsync({ ...existing, name, code });
    if (value === existing.name || departmentId === existing.id) {
      onChange({ department: updated.name, departmentId: updated.id });
    }
    notify.success(t("faculty.setup.departmentSaved"));
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteMutation.mutateAsync(deleteTargetId);
      if (departmentId === deleteTargetId || value === targetDeleteEntity?.name) {
        onChange({ department: "", departmentId: undefined });
      }
      notify.success(t("common.recordArchived"));
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t("common.tryAgain"));
    } finally {
      setDeleteTargetId(null);
    }
  };

  return (
    <Field label={t("faculty.field.department")} id="department" required={required} error={error}>
      <div ref={containerRef} className="relative">
        <input type="hidden" name="department" value={value} />
        <button
          type="button"
          id="department"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            FORM_SELECT,
            "w-full text-start flex items-center justify-between pe-3 cursor-pointer",
            !value && "text-muted-foreground",
          )}
        >
          <span className="truncate">
            {value ? (selectedEntity?.code ? `${selectedEntity.name} (${selectedEntity.code})` : value) : t("faculty.form.departmentPlaceholder")}
          </span>
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform shrink-0", isOpen && "rotate-180")} aria-hidden />
        </button>

        {isOpen && (
          <FacultyDepartmentDropdownMenu
            items={items}
            selectedValue={value}
            isPending={saveMutation.isPending || deleteMutation.isPending}
            onSelect={handleSelect}
            onSaveNew={handleSaveNew}
            onUpdate={handleUpdate}
            onDeleteRequest={setDeleteTargetId}
          />
        )}
      </div>

      {deleteTargetId && (
        <ConfirmAlertDialog
          open={Boolean(deleteTargetId)}
          onOpenChange={(open) => !open && setDeleteTargetId(null)}
          title={t("faculty.setup.deleteDepartment")}
          description={targetDeleteEntity ? t("faculty.setup.deleteDepartmentConfirm", { name: targetDeleteEntity.name }) : ""}
          confirmLabel={t("common.delete")}
          cancelLabel={t("common.cancel")}
          destructive
          onConfirm={handleConfirmDelete}
        />
      )}
    </Field>
  );
}
