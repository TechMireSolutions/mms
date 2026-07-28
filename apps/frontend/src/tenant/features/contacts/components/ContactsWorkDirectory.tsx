import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import type { Contact, ContactsQuickFilter } from "@mms/shared";
import { CONTACTS_MODULE_MANIFEST } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import ContactsToolbar from "@/tenant/features/contacts/components/ContactsToolbar";
import { ContactsBulkActionBar } from "@/tenant/features/contacts/components/ContactsBulkActionBar";
import { ContactsWorkListBody } from "@/tenant/features/contacts/components/ContactsWorkListBody";
import ContactCards from "@/tenant/features/contacts/components/ContactCards";
import ContactsTable from "@/tenant/features/contacts/components/ContactsTable";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { useTranslation } from "@/hooks/useTranslation";

type DirectoryColumn = { id: string; label: string; sortField?: string; width?: number };
type ViewMode = "table" | "cards" | null;

export interface ContactsWorkDirectoryProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterGender: string;
  onGenderChange: (value: string) => void;
  quickFilter: ContactsQuickFilter;
  onQuickFilterChange: (value: ContactsQuickFilter) => void;
  sortField: string;
  sortDir: "asc" | "desc";
  onSort: (field: string) => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  onClearFilters: () => void;
  viewingDeleted: boolean;
  onShowDeletedChange: (next: boolean) => void;
  canViewDeleted: boolean;
  viewModeOverride: ViewMode;
  onViewModeChange: (mode: Exclude<ViewMode, null>) => void;
  shownCount: number;
  workTruncated: boolean;
  selected: Array<string | number>;
  onClearSelection: () => void;
  selectedTargets: {
    waTargets: Contact[];
    smsReady: Contact[];
  };
  bulkActions: readonly string[];
  canWriteMessaging: boolean;
  canExport: boolean;
  canDelete: boolean;
  onWhatsApp: (targets: Contact[]) => void;
  onSms: (targets: Contact[]) => void;
  onBulkExport: () => void;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  isWorkError: boolean;
  isWorkLoading: boolean;
  isWorkFetching: boolean;
  onRetryWork: () => void;
  workContacts: Contact[];
  tableColumns: DirectoryColumn[];
  commonDirectoryProps: React.ComponentProps<typeof ContactCards>;
  tableProps: React.ComponentProps<typeof ContactsTable>;
  useServerWork: boolean;
  workPageData?: { page: number; total: number; limit: number; hasMore: boolean } | null;
  onPageChange: (page: number) => void;
}

export function ContactsWorkDirectory({
  search,
  onSearchChange,
  filterGender,
  onGenderChange,
  quickFilter,
  onQuickFilterChange,
  sortField,
  onSort,
  hasActiveFilters,
  activeFilterCount,
  onClearFilters,
  viewingDeleted,
  onShowDeletedChange,
  canViewDeleted,
  viewModeOverride,
  onViewModeChange,
  shownCount,
  workTruncated,
  selected,
  onClearSelection,
  selectedTargets,
  bulkActions,
  canWriteMessaging,
  canExport,
  canDelete,
  onWhatsApp,
  onSms,
  onBulkExport,
  onRequestBulkDelete,
  onRequestBulkRestore,
  isWorkError,
  isWorkLoading,
  isWorkFetching,
  onRetryWork,
  workContacts,
  tableColumns,
  commonDirectoryProps,
  tableProps,
  useServerWork,
  workPageData,
  onPageChange,
}: ContactsWorkDirectoryProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <ErrorBoundary>
        <ContactsToolbar
          search={search}
          onSearchChange={onSearchChange}
          filterGender={filterGender}
          onGenderChange={onGenderChange}
          quickFilter={quickFilter}
          onQuickFilterChange={onQuickFilterChange}
          sortField={sortField}
          onSort={onSort}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          onClearFilters={onClearFilters}
          showDeletedArchives={viewingDeleted}
          onShowDeletedChange={onShowDeletedChange}
          canViewDeleted={canViewDeleted}
          viewMode={viewModeOverride ?? "table"}
          onViewModeChange={onViewModeChange}
          shownCount={shownCount}
        />
      </ErrorBoundary>

      {workTruncated && (
        <div
          className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning"
          role="status"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {t("contacts.workTruncated", {
            limit: CONTACTS_MODULE_MANIFEST.maxPageSize,
            total: shownCount,
          })}
        </div>
      )}

      <AnimatePresence>
        {filterGender && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex flex-wrap gap-1.5"
          >
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
              {t("contacts.genderFilter")}: {formatContactGenderLabel(filterGender, t)}{" "}
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => onGenderChange("")}
                className="h-4 w-4 p-0 hover:bg-transparent hover:opacity-70"
                aria-label={t("contacts.clearFilters")}
              >
                <X className="w-3 h-3" />
              </Button>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <ContactsBulkActionBar
        selectedCount={selected.length}
        viewingDeleted={viewingDeleted}
        bulkActions={bulkActions}
        canWriteMessaging={canWriteMessaging}
        canExport={canExport}
        canDelete={canDelete}
        selectedTargets={selectedTargets}
        onWhatsApp={onWhatsApp}
        onSms={onSms}
        onBulkExport={onBulkExport}
        onRequestBulkDelete={onRequestBulkDelete}
        onRequestBulkRestore={onRequestBulkRestore}
        onClearSelection={onClearSelection}
      />

      <ContactsWorkListBody
        isWorkError={isWorkError}
        isWorkLoading={isWorkLoading}
        isWorkFetching={isWorkFetching}
        onRetryWork={onRetryWork}
        workContacts={workContacts}
        tableColumns={tableColumns}
        hasActiveFilters={hasActiveFilters}
        viewingDeleted={viewingDeleted}
        onClearFilters={onClearFilters}
        viewModeOverride={viewModeOverride}
        commonDirectoryProps={commonDirectoryProps}
        tableProps={tableProps}
        useServerWork={useServerWork}
        workPageData={workPageData}
        onPageChange={onPageChange}
      />
    </div>
  );
}
