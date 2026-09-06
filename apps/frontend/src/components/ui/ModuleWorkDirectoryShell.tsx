import type React from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { FilterChips, type FilterChip } from "@/components/ui/FilterChips";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { WorkTaskToolbar } from "@/components/common/work/WorkTaskToolbar";
import { ModuleSoftDeleteConfirmDialogs } from "@/components/ui/ModuleSoftDeleteConfirmDialogs";
import type { ModuleColumnRegistryEntry, AppTranslationKey } from "@mms/shared";
import type { ModuleColumnCustomizerLabels } from "@/components/ui/ModuleColumnCustomizer";
import type { WorkDirectoryViewMode } from "@/hooks/useWorkDirectoryViewMode";
import { useTranslation } from "@/hooks/useTranslation";

export interface ModuleWorkDirectoryShellConfirmDialogsProps {
  pendingDeleteOpen: boolean;
  pendingDeleteName?: string;
  onPendingDeleteOpenChange: (open: boolean) => void;
  onConfirmSingleDelete: (reason?: string) => Promise<void> | void;
  bulkDeleteOpen: boolean;
  onBulkDeleteOpenChange: (open: boolean) => void;
  onConfirmBulkDelete: (reason?: string) => Promise<void> | void;
  bulkRestoreOpen: boolean;
  onBulkRestoreOpenChange: (open: boolean) => void;
  onConfirmBulkRestore: () => Promise<void> | void;
  selectedCount: number;
  deletionReasonLabel?: string;
  deletionReasonPlaceholder?: string;
}

export interface ModuleWorkDirectoryShellProps {
  i18nNamespace: string;
  isFetching?: boolean;
  // Toolbar configuration
  search: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  searchId?: string;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  filterButton: React.ReactNode;
  filterChips?: FilterChip[];
  shownCount?: number;
  primaryAction?: React.ReactNode;
  // View mode
  viewMode: WorkDirectoryViewMode;
  onViewModeChange: (mode: WorkDirectoryViewMode) => void;
  // Trash
  canDelete: boolean;
  viewingDeleted: boolean;
  onToggleDeleted: () => void;
  // Column Layout
  columnLayout?: {
    columnRegistry: ModuleColumnRegistryEntry[];
    updateUserColumnLayout: (registry: ModuleColumnRegistryEntry[]) => void;
    onResetLayout?: () => void;
    customizerLabels?: ModuleColumnCustomizerLabels;
  };
  // Bulk selection bar slot
  bulkActionBar?: React.ReactNode;
  // Main content (Table or Cards view)
  children: React.ReactNode;
  // Optional confirmation dialogs
  confirmDialogs?: ModuleWorkDirectoryShellConfirmDialogsProps;
}

/**
 * Turnkey Work Directory Layout Shell (SSOT).
 * Unifies the toolbar, filter chips, bulk selection bar, directory view,
 * and soft-delete/restore confirmation dialogs across all MMS modules.
 */
export function ModuleWorkDirectoryShell({
  i18nNamespace,
  isFetching = false,
  search,
  onSearchChange,
  searchPlaceholder,
  searchId,
  hasActiveFilters,
  onClearFilters,
  filterButton,
  filterChips,
  shownCount,
  primaryAction,
  viewMode,
  onViewModeChange,
  canDelete,
  viewingDeleted,
  onToggleDeleted,
  columnLayout,
  bulkActionBar,
  children,
  confirmDialogs,
}: ModuleWorkDirectoryShellProps): React.JSX.Element {
  const { t } = useTranslation();

  const filtersKey = `${i18nNamespace}.filters` as AppTranslationKey;
  const shownCountKey = `${i18nNamespace}.shownCount` as AppTranslationKey;
  const searchPlaceholderKey = `${i18nNamespace}.searchPlaceholder` as AppTranslationKey;
  const showActiveKey = `${i18nNamespace}.showActive` as AppTranslationKey;
  const showDeletedKey = `${i18nNamespace}.showDeleted` as AppTranslationKey;

  const deleteConfirmTitleKey = `${i18nNamespace}.deleteConfirmTitle` as AppTranslationKey;
  const deleteConfirmDescNamedKey = `${i18nNamespace}.deleteConfirmDescriptionNamed` as AppTranslationKey;
  const deleteConfirmDescKey = `${i18nNamespace}.deleteConfirmDescription` as AppTranslationKey;
  const bulkDeleteKey = `${i18nNamespace}.bulkDelete` as AppTranslationKey;
  const bulkDeleteConfirmKey = `${i18nNamespace}.bulkDeleteConfirm` as AppTranslationKey;
  const bulkRestoreKey = `${i18nNamespace}.bulkRestore` as AppTranslationKey;
  const bulkRestoreConfirmKey = `${i18nNamespace}.bulkRestoreConfirm` as AppTranslationKey;
  const deletionReasonLabelKey = `${i18nNamespace}.deletionReasonLabel` as AppTranslationKey;
  const deletionReasonPlaceholderKey = `${i18nNamespace}.deletionReasonPlaceholder` as AppTranslationKey;

  return (
    <ModuleTierMotion tier="work" className="space-y-4" aria-busy={isFetching}>
      <ErrorBoundary fallback={<div className="p-4 text-sm text-destructive">{t("errors.toolbar.loadFailed")}</div>}>
        <WorkTaskToolbar
          regionLabel={t(filtersKey)}
          shownCountLabel={shownCount != null ? t(shownCountKey, { count: shownCount }) : undefined}
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder ?? t(searchPlaceholderKey)}
          searchId={searchId}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={onClearFilters}
          clearFiltersLabel={t("common.clearFilters")}
          filterButton={filterButton}
          filterChips={
            filterChips && filterChips.length > 0 ? (
              <FilterChips chips={filterChips} onClearAll={onClearFilters} />
            ) : undefined
          }
          primaryAction={primaryAction}
          trashToggle={
            canDelete
              ? {
                  canViewDeleted: canDelete,
                  viewingDeleted,
                  onToggle: onToggleDeleted,
                  activeLabel: t(showActiveKey),
                  deletedLabel: t(showDeletedKey),
                }
              : undefined
          }
          viewModeToggle={{
            viewMode,
            onViewModeChange,
          }}
          columnCustomizer={
            columnLayout
              ? {
                  registry: columnLayout.columnRegistry,
                  onUpdate: columnLayout.updateUserColumnLayout,
                  onReset: columnLayout.onResetLayout,
                  labels: columnLayout.customizerLabels,
                }
              : undefined
          }
        />
      </ErrorBoundary>

      {bulkActionBar}

      {children}

      {confirmDialogs && (
        <ModuleSoftDeleteConfirmDialogs
          pendingDeleteOpen={confirmDialogs.pendingDeleteOpen}
          onPendingDeleteOpenChange={confirmDialogs.onPendingDeleteOpenChange}
          bulkDeleteOpen={confirmDialogs.bulkDeleteOpen}
          onBulkDeleteOpenChange={confirmDialogs.onBulkDeleteOpenChange}
          bulkRestoreOpen={confirmDialogs.bulkRestoreOpen}
          onBulkRestoreOpenChange={confirmDialogs.onBulkRestoreOpenChange}
          singleDeleteTitle={t(deleteConfirmTitleKey)}
          singleDeleteDescription={
            confirmDialogs.pendingDeleteName
              ? t(deleteConfirmDescNamedKey, {
                  name: confirmDialogs.pendingDeleteName,
                })
              : t(deleteConfirmDescKey)
          }
          bulkDeleteTitle={t(bulkDeleteKey)}
          bulkDeleteDescription={t(bulkDeleteConfirmKey, {
            count: confirmDialogs.selectedCount,
          })}
          bulkRestoreTitle={t(bulkRestoreKey)}
          bulkRestoreDescription={t(bulkRestoreConfirmKey, {
            count: confirmDialogs.selectedCount,
          })}
          deleteConfirmLabel={t("common.delete")}
          restoreConfirmLabel={t("common.restore")}
          cancelLabel={t("common.cancel")}
          deletionReasonLabel={confirmDialogs.deletionReasonLabel ?? t(deletionReasonLabelKey)}
          deletionReasonPlaceholder={confirmDialogs.deletionReasonPlaceholder ?? t(deletionReasonPlaceholderKey)}
          onConfirmSingleDelete={confirmDialogs.onConfirmSingleDelete}
          onConfirmBulkDelete={confirmDialogs.onConfirmBulkDelete}
          onConfirmBulkRestore={confirmDialogs.onConfirmBulkRestore}
        />
      )}
    </ModuleTierMotion>
  );
}
