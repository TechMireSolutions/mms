import { useMemo } from "react";
import {
  DEFAULT_CONTACT_EXPORT_COLUMNS,
  type ContactExportColumn,
  type ContactsListQuery,
  type ContactsQuickFilter,
  type AppTranslationKey,
} from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { startServerContactsCsvExport } from "@/lib/backgroundJobs/startServerContactsCsvExport";
import { useModuleServerCsvExportActions } from "@/lib/backgroundJobs/useModuleServerCsvExportActions";
import { notify } from "@/lib/notify";
import { reportClientError } from "@/lib/clientErrorReporting";
import { getApiValidationMessage } from "@/lib/apiValidationMessage";

interface UseContactsExportActionsOptions {
  tableColumns: Array<{ id?: string; key?: string; label?: string; labelKey?: AppTranslationKey }>;
  canExport: boolean;
  /** Debounced directory search — the same value the visible list was filtered by. */
  search: string;
  filterGender: string;
  sortField: string;
  sortDir: "asc" | "desc";
  quickFilter: ContactsQuickFilter;
  viewingDeleted: boolean;
  /** Whether any directory filter is applied — selects the audit scope. */
  hasActiveFilters: boolean;
  selected: (string | number)[];
  logExportAudit: {
    mutateAsync: (payload: {
      count: number;
      scope: "all" | "filtered" | "selection";
    }) => Promise<unknown>;
  };
  handleError?: (err: unknown, scope: string, messageKey?: AppTranslationKey) => void;
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
  hasActiveFilters,
  selected,
  logExportAudit,
  t,
}: UseContactsExportActionsOptions) {
  const resolvedColumns = useMemo(
    () => resolveContactsExportColumns(tableColumns, t),
    [tableColumns, t],
  );

  /** Mirrors `buildContactsPageUrl` so the export scope matches the visible list. */
  const buildFilteredQuery = (): ContactsListQuery => ({
    search: search.trim() || undefined,
    gender: filterGender || undefined,
    sortField,
    sortDir,
    quickFilter: quickFilter === "all" ? undefined : quickFilter,
  });

  const onError = (err: unknown, scope: string) => {
    const validationMessage = getApiValidationMessage(err);
    const description = validationMessage || (err instanceof Error ? err.message : String(err));
    notify.error(t("contacts.exportFailed"), description ? { description } : undefined);
    reportClientError(err, { scope });
  };

  return useModuleServerCsvExportActions<ContactExportColumn, ContactsListQuery>({
    canExport,
    trashMode: viewingDeleted,
    selectedIds: selected,
    columns: resolvedColumns,
    filename: t("contacts.exportFilename"),
    label: t("contacts.jobs.exportLabelServer"),
    successMessage: t("contacts.exportSuccess"),
    auditScope: "contacts.export_audit",
    filteredErrorScope: "contacts.server_export_csv",
    selectionErrorScope: "contacts.server_export_csv_selection",
    hasActiveFilters,
    buildFilteredQuery,
    startExport: startServerContactsCsvExport,
    logExportAudit,
    onError,
  });
}

/** Default Work export columns when registry is unavailable. */
export function defaultContactsExportColumns(
  t: (key: AppTranslationKey) => string,
): ContactExportColumn[] {
  return DEFAULT_CONTACT_EXPORT_COLUMNS.map((column) => {
    const key = `contacts.columns.${column.id}` as AppTranslationKey;
    return {
      id: column.id,
      label: t(key) || column.label,
    };
  });
}

/** Resolves and sanitizes active export columns for backend CSV job. */
export function resolveContactsExportColumns(
  columns: Array<{ id?: string; key?: string; label?: string; labelKey?: AppTranslationKey }>,
  t: (key: AppTranslationKey) => string,
): ContactExportColumn[] {
  const mapped = columns
    .map((col) => {
      const id = (col.id || col.key || "").trim();
      const label = (col.labelKey ? t(col.labelKey) : (col.label || id)).trim();
      return { id, label: label || id };
    })
    .filter((col) => col.id.length > 0 && col.id.length <= 64 && col.label.length > 0);

  if (mapped.length === 0) {
    return defaultContactsExportColumns(t);
  }
  return mapped.slice(0, 50);
}

