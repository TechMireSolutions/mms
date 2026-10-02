import React, { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { FacultyDepartmentEntity } from "@mms/shared";
import { FACULTY_DEPARTMENT_VALUES } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { FacultyDepartmentFormModal } from "./FacultyDepartmentFormModal";
import { useSaveFacultyDepartment, useDeleteFacultyDepartment } from "../hooks/useFacultyDepartments";

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

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<FacultyDepartmentEntity | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const selectedEntity = useMemo(
    () => departmentEntities?.find((d) => (departmentId ? d.id === departmentId : d.name === value)) ?? null,
    [departmentEntities, departmentId, value],
  );

  const deptOptions = useMemo(() => {
    if (departmentEntities?.length) {
      const list = departmentEntities.map((d) => ({ value: d.name, label: `${d.name} (${d.code})` }));
      if (value && !departmentEntities.some((d) => d.name === value)) {
        list.unshift({ value, label: value });
      }
      return list;
    }
    const raw: readonly string[] = departmentOptions?.length ? departmentOptions : FACULTY_DEPARTMENT_VALUES;
    const exists = value ? raw.some((val) => val === value) : true;
    const list = value && !exists ? [value, ...raw] : raw;
    return list.map((opt) => ({ value: opt, label: opt }));
  }, [departmentEntities, departmentOptions, value]);

  const parentOptions = useMemo(
    () => (departmentEntities ?? []).filter((d) => !editingDept || d.id !== editingDept.id).map((d) => ({ value: d.id, label: d.name })),
    [departmentEntities, editingDept],
  );

  const handleSaveModal = async (payload: { id?: string; name: string; code: string; parentId: string | null; headFacultyId: string | null }) => {
    const id = payload.id || crypto.randomUUID();
    const saved = await saveMutation.mutateAsync({ ...payload, id });
    const patch: { department: string; departmentId: string; reportingFacultyId?: string | null } = {
      department: saved.name,
      departmentId: saved.id,
    };
    if (saved.headFacultyId && !reportingFacultyId && saved.headFacultyId !== facultyId) {
      patch.reportingFacultyId = saved.headFacultyId;
    }
    onChange(patch);
    notify.success(t("faculty.setup.departmentSaved"));
    setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEntity) return;
    try {
      await deleteMutation.mutateAsync(selectedEntity.id);
      onChange({ department: "", departmentId: undefined });
      notify.success(t("common.recordArchived"));
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t("common.tryAgain"));
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="department" className="text-sm font-medium text-foreground">
          {t("faculty.field.department")}
          {required && <span className="text-destructive ms-0.5">*</span>}
        </label>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingDept(null);
              setModalOpen(true);
            }}
            className="h-6 px-1.5 text-xs text-primary hover:text-primary gap-1"
            title={t("faculty.setup.addDepartmentSubtitle")}
          >
            <Plus className="size-3.5" aria-hidden />
            <span>{t("common.add")}</span>
          </Button>
          {selectedEntity && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingDept(selectedEntity);
                  setModalOpen(true);
                }}
                className="size-6 p-0 text-muted-foreground hover:text-foreground"
                title={t("common.edit")}
                aria-label={t("common.edit")}
              >
                <Pencil className="size-3" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
                className="size-6 p-0 text-muted-foreground hover:text-destructive"
                title={t("common.delete")}
                aria-label={t("common.delete")}
              >
                <Trash2 className="size-3" aria-hidden />
              </Button>
            </>
          )}
        </div>
      </div>

      <Field label="" id="department" error={error}>
        <FormSelect
          id="department"
          name="department"
          value={value}
          placeholder={t("faculty.form.departmentPlaceholder")}
          onChange={(val) => {
            const matched = departmentEntities?.find((d) => d.name === val);
            const patch: { department: string; departmentId?: string; reportingFacultyId?: string } = { department: val, ...(matched ? { departmentId: matched.id } : {}) };
            if (matched?.headFacultyId && !reportingFacultyId && matched.headFacultyId !== facultyId) {
              patch.reportingFacultyId = matched.headFacultyId;
            }
            onChange(patch);
          }}
          options={deptOptions}
        />
      </Field>

      {modalOpen && (
        <FacultyDepartmentFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          department={editingDept}
          parentOptions={parentOptions}
          existingDepartments={departmentEntities ?? []}
          isPending={saveMutation.isPending}
          onSave={handleSaveModal}
        />
      )}

      {deleteConfirmOpen && (
        <ConfirmAlertDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title={t("faculty.setup.deleteDepartment")}
          description={selectedEntity ? t("faculty.setup.deleteDepartmentConfirm", { name: selectedEntity.name }) : ""}
          confirmLabel={t("common.delete")}
          cancelLabel={t("common.cancel")}
          destructive
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
