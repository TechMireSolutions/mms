import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";
import {
  parseFacultyDepartmentsCsv,
  parseFacultyDesignationsCsv,
  parseFacultyMembersCsv,
} from "@mms/shared";
import { DashedFileDropZone } from "@/components/ui/DashedFileDropZone";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import {
  startServerFacultyDepartmentsImport,
  startServerFacultyDesignationsImport,
  startServerFacultyMembersImport,
} from "@/lib/backgroundJobs/startServerFacultyImport";
import type { FacultyIoEntity } from "@/tenant/features/faculty/components/FacultyPageHeaderActions";

export interface FacultyCsvImportDialogProps {
  open: boolean;
  entity: FacultyIoEntity | null;
  onClose: () => void;
  canWrite: boolean;
}

/** CSV import dialog for Faculties / Departments / Designations. */
export function FacultyCsvImportDialog({
  open,
  entity,
  onClose,
  canWrite,
}: FacultyCsvImportDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pending, setPending] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  if (!open || !entity || !canWrite) return null;

  const title =
    entity === "faculties"
      ? t("faculty.io.importFaculties")
      : entity === "departments"
        ? t("faculty.io.importDepartments")
        : t("faculty.io.importDesignations");

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setFileError(null);
    setPending(true);
    try {
      const text = await file.text();
      if (entity === "faculties") {
        const rows = parseFacultyMembersCsv(text);
        if (rows.length === 0) throw new Error(t("faculty.io.importEmpty"));
        await startServerFacultyMembersImport({
          rows,
          label: t("faculty.io.importFacultiesJob"),
        });
      } else if (entity === "departments") {
        const rows = parseFacultyDepartmentsCsv(text);
        if (rows.length === 0) throw new Error(t("faculty.io.importEmpty"));
        await startServerFacultyDepartmentsImport({
          rows,
          label: t("faculty.io.importDepartmentsJob"),
        });
      } else {
        const rows = parseFacultyDesignationsCsv(text);
        if (rows.length === 0) throw new Error(t("faculty.io.importEmpty"));
        await startServerFacultyDesignationsImport({
          rows,
          label: t("faculty.io.importDesignationsJob"),
        });
      }
      notify.success(t("faculty.io.importQueued"));
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFileError(message);
      notify.error(t("faculty.io.importFailed"), { description: message });
    } finally {
      setPending(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Modal open onClose={onClose} icon={Upload} title={title} size="md">
      <div className="space-y-4 text-start">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />
        {fileError ? (
          <p role="alert" className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2.5">
            {fileError}
          </p>
        ) : null}
        <DashedFileDropZone
          isDragging={isDragging}
          onOpenPicker={() => fileRef.current?.click()}
          onDraggingChange={setIsDragging}
          onFiles={(files) => void handleFile(files?.[0] ?? null)}
          disabled={pending}
          isUploading={pending}
          title={t("faculty.io.dropCsv")}
          description={t("faculty.io.csvHint")}
          inputAriaLabel={t("faculty.io.dropCsv")}
          accept=".csv,text/csv"
        />
        <div className="flex justify-end">
          <ActionButton variant="ghost" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </ActionButton>
        </div>
      </div>
    </Modal>
  );
}
