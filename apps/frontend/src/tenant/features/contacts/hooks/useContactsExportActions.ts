import { useCallback } from "react";
import type {
  ContactExportColumn,
  ContactsListQuery,
  ContactsQuickFilter,
  AppTranslationKey,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { startServerContactsCsvExport } from "@/lib/backgroundJobs/startServerContactsCsvExport";
import { useModuleServerCsvExportActions } from "@/lib/backgroundJobs/useModuleServerCsvExportActions";

interface UseContactsExportActionsOptions {
  tableColumns: ContactExportColumn[];
  canExport: boolean;
  search: string;
  filterGender: string;
  sortField: string;
  sortDir: "asc" | "desc";
  quickFilter: ContactsQuickFilter;
  viewingDeleted: boolean;
  selected: (string | number)[];
  logExportAudit: {
    mutateAsync: (payload: {
      count: number;
      scope: "all" | "filtered" | "selection";
    }) => Promise<unknown>;
  };
  handleError: (err: unknown, scope: string, messageKey?: AppTranslationKey) => void;
  t: TranslationFunction;
}

export function useContactsExportActions({
  tableColumns,
  canExport,
  search,
  filterGender,
  sortField,
  sortDir,
  quickFilter,
  viewingDeleted,
  selected,
  logExportAudit,
  handleError,
  t,
}: UseContactsExportActionsOptions) {
  const buildFilteredQuery = useCallback(
    (): ContactsListQuery => ({
      search,
      gender: filterGender || undefined,
      sortField,
      sortDir,
      quickFilter,
    }),
    [search, filterGender, sortField, sortDir, quickFilter],
  );

  const onError = useCallback(
    (err: unknown, scope: string) => {
      handleError(err, scope, "contacts.exportFailed");
    },
    [handleError],
  );

  return useModuleServerCsvExportActions<ContactExportColumn, ContactsListQuery>({
    canExport,
    trashMode: viewingDeleted,
    selectedIds: selected,
    columns: tableColumns,
    filename: t("contacts.exportFilename"),
    label: t("contacts.jobs.exportLabelServer"),
    successMessage: t("contacts.exportSuccess"),
    auditScope: "contacts.export_audit",
    filteredErrorScope: "contacts.server_export_csv",
    selectionErrorScope: "contacts.server_export_csv_selection",
    buildFilteredQuery,
    startExport: startServerContactsCsvExport,
    logExportAudit,
    onError,
  });
}
