import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import {
  startServerFacultyDepartmentCsvExport,
  startServerFacultyDesignationCsvExport,
} from "@/lib/backgroundJobs/startServerFacultyCatalogCsvExport";
import type { FacultyIoEntity } from "@/tenant/features/faculty/facultyPageWorkSubTabs";

/** Export/import actions for Faculty entity tab toolbars. */
export function useFacultyIoActions({
  canExport,
  handleFacultyExport,
  setImportEntity,
}: {
  canExport: boolean;
  handleFacultyExport: () => void | Promise<void>;
  setImportEntity: (entity: FacultyIoEntity | null) => void;
}) {
  const { t } = useTranslation();

  const onExportEntity = (entity: FacultyIoEntity) => {
    if (!canExport) return;
    if (entity === "faculties") {
      void handleFacultyExport();
      return;
    }
    void (async () => {
      try {
        if (entity === "departments") {
          await startServerFacultyDepartmentCsvExport({
            filename: t("faculty.io.departmentsExportFilename"),
            label: t("faculty.io.exportDepartmentsJob"),
          });
        } else {
          await startServerFacultyDesignationCsvExport({
            filename: t("faculty.io.designationsExportFilename"),
            label: t("faculty.io.exportDesignationsJob"),
          });
        }
        notify.success(t("faculty.io.exportQueued"));
      } catch (err) {
        notify.error(t("faculty.exportFailed"), {
          description: err instanceof Error ? err.message : String(err),
        });
      }
    })();
  };

  const onImportEntity = (entity: FacultyIoEntity) => {
    setImportEntity(entity);
  };

  return { onExportEntity, onImportEntity };
}
