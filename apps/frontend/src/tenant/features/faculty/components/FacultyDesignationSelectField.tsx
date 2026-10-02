import React, { useMemo, useState } from "react";
import { Info, Pencil, Plus, Trash2 } from "lucide-react";
import type { FacultyDesignationDefinition } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { useWorkspaceRoles } from "@/tenant/hooks/useWorkspaceRoles";
import { FacultyDesignationFormModal } from "./FacultyDesignationFormModal";
import { useSaveFacultyDesignation, useDeleteFacultyDesignation } from "../hooks/useFacultyDesignations";

export interface FacultyDesignationSelectFieldProps {
  designationId?: string;
  designationName?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  designationOptions?: FacultyDesignationDefinition[];
  onChange: (patch: {
    designationId: string;
    designation: string;
    hierarchyRank?: number;
    designationAssignableRoles?: string[];
    reportingFacultyId?: string | null;
  }) => void;
}

export function FacultyDesignationSelectField({
  designationId,
  designationName,
  error,
  required,
  disabled,
  designationOptions = [],
  onChange,
}: FacultyDesignationSelectFieldProps): React.JSX.Element {
  const { t } = useTranslation();
  const workspaceRoles = useWorkspaceRoles();
  const saveMutation = useSaveFacultyDesignation();
  const deleteMutation = useDeleteFacultyDesignation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDes, setEditingDes] = useState<FacultyDesignationDefinition | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const selectedDef = useMemo(
    () => designationOptions.find((d) => d.id === designationId) ?? null,
    [designationOptions, designationId],
  );

  const activeOptions = useMemo(
    () => designationOptions.filter((item) => item.isActive || item.id === designationId),
    [designationOptions, designationId],
  );

  const handleSaveModal = async (payload: Pick<FacultyDesignationDefinition, "id" | "code" | "name" | "hierarchyRank" | "isActive" | "assignableRoles">) => {
    const id = payload.id || crypto.randomUUID();
    const saved = await saveMutation.mutateAsync({ ...payload, id });
    onChange({
      designationId: saved.id,
      designation: saved.name,
      hierarchyRank: saved.hierarchyRank,
      designationAssignableRoles: saved.assignableRoles ?? [],
      ...(saved.hierarchyRank === 1 ? { reportingFacultyId: null } : {}),
    });
    notify.success(t("faculty.designations.saved"));
    setModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDef) return;
    try {
      await deleteMutation.mutateAsync(selectedDef.id);
      onChange({ designationId: "", designation: "", hierarchyRank: 4, designationAssignableRoles: [] });
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
        <label htmlFor="designationId" className="text-sm font-medium text-foreground">
          {t("faculty.field.designation")}
          {required && <span className="text-destructive ms-0.5">*</span>}
        </label>
        {!disabled && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingDes(null);
                setModalOpen(true);
              }}
              className="h-6 px-1.5 text-xs text-primary hover:text-primary gap-1"
              title={t("faculty.designations.addDesignation")}
            >
              <Plus className="size-3.5" aria-hidden />
              <span>{t("common.add")}</span>
            </Button>
            {selectedDef && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingDes(selectedDef);
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
        )}
      </div>

      <Field label="" id="designationId" error={error}>
        <FormSelect
          id="designationId"
          name="designationId"
          value={designationId || ""}
          placeholder={t("faculty.designations.selectPlaceholder")}
          disabled={disabled}
          onChange={(value) => {
            const def = designationOptions.find((item) => item.id === value);
            onChange({
              designationId: value,
              designation: def?.name ?? "",
              hierarchyRank: def?.hierarchyRank,
              designationAssignableRoles: def?.assignableRoles ?? [],
              ...(def?.hierarchyRank === 1 ? { reportingFacultyId: null } : {}),
            });
          }}
          options={activeOptions.map((item) => ({ value: item.id, label: item.name }))}
        />
        {activeOptions.length === 0 ? (
          <p role="status" className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0" aria-hidden />
            {t("faculty.designations.empty")}
          </p>
        ) : null}
        {disabled ? (
          <p className="mt-1 text-xs text-muted-foreground">{t("faculty.designations.manageInHistory")}</p>
        ) : !designationId && designationName ? (
          <p className="mt-1 text-xs text-muted-foreground">{t("faculty.designations.current")}: {designationName}</p>
        ) : null}
      </Field>

      {modalOpen && (
        <FacultyDesignationFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          designation={editingDes}
          workspaceRoles={workspaceRoles}
          isPending={saveMutation.isPending}
          designationOptions={designationOptions}
          onSave={handleSaveModal}
        />
      )}

      {deleteConfirmOpen && (
        <ConfirmAlertDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title={t("common.delete")}
          description={selectedDef ? `${t("common.delete")} "${selectedDef.name}"?` : ""}
          confirmLabel={t("common.delete")}
          cancelLabel={t("common.cancel")}
          destructive
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
