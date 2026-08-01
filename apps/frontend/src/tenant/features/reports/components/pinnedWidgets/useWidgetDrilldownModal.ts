import { useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { useLocalPagination } from "@/hooks/useLocalPagination";
import {
  persistWidgetHasanatDistributionDelete,
  persistWidgetRecordToggle,
} from "@/lib/reports/widgetRecordToggle";
import { useWidgetCollections } from "@/lib/reports/useReportCollections";
import type { ReportCollection } from "@/lib/reports/reportMetadata";
import { CustomWidget } from "@/tenant/features/reports/components/pinnedWidgets/types";
import { getFilteredRecords } from "@/tenant/features/reports/components/pinnedWidgets/widgetDataUtils";

export function useWidgetDrilldownModal(widget: CustomWidget) {
  const { t } = useTranslation();
  const requiredCollections = useMemo(
    () => new Set<ReportCollection>([widget.collection, "students"]),
    [widget.collection],
  );
  const collections = useWidgetCollections({ requiredCollections });

  const widgetRecords = useMemo(() => getFilteredRecords(widget, collections), [widget, collections]);

  const pagination = useLocalPagination({
    items: widgetRecords,
    pageSize: 10,
    filterFn: (record, query) =>
      Object.values(record).some((fieldValue) =>
        String(fieldValue).toLowerCase().includes(query)
      ),
  });

  const studentNameMap = useMemo(() => {
    const students = collections.students;
    return new Map((students as unknown as Record<string, unknown>[]).map((student) => [
      String(student.id),
      String(student.name || student.studentName || student.id),
    ]));
  }, [collections.students]);

  const handleToggleStatus = (recordId: string) => {
    void (async () => {
      try {
        await persistWidgetRecordToggle({
          collectionName: widget.collection,
          recordId,
        });
      } catch (error) {
        console.error("Failed to toggle record status", error);
        notify.error(t("reports.widgets.errorToggleFailed"));
      }
    })();
  };

  const handleDeleteDist = (distId: string) => {
    void (async () => {
      try {
        await persistWidgetHasanatDistributionDelete(distId);
      } catch (error) {
        console.error("Failed to delete distribution", error);
        notify.error(t("reports.widgets.errorDeleteFailed"));
      }
    })();
  };

  return {
    t,
    widget,
    studentNameMap,
    ...pagination,
    handleToggleStatus,
    handleDeleteDist,
  };
}
