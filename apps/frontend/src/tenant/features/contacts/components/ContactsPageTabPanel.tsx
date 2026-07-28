import { type ComponentProps } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import KPISummary from "@/tenant/features/reports/components/KPISummary";
import ModuleReports from "@/tenant/features/reports/components/ModuleReports";
import { ContactsWorkDirectory } from "@/tenant/features/contacts/components/ContactsWorkDirectory";
import type ContactCards from "@/tenant/features/contacts/components/ContactCards";
import type ContactsTable from "@/tenant/features/contacts/components/ContactsTable";
import type { Contact, ContactsQuickFilter } from "@mms/shared";
import ContactsSettingsPanel from "@/tenant/features/contacts/components/ContactsSettingsPanel";

type ViewMode = "table" | "cards" | null;
type DirectoryColumn = { id: string; label: string; sortField?: string; width?: number };

export interface ContactsPageTabPanelProps {
  effectiveTab: string;
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
  commonDirectoryProps: ComponentProps<typeof ContactCards>;
  tableProps: ComponentProps<typeof ContactsTable>;
  useServerWork: boolean;
  workPageData?: { page: number; total: number; limit: number; hasMore: boolean } | null;
  onPageChange: (page: number) => void;
  contacts: Contact[];
  canWrite: boolean;
  canEditSetup: boolean;
  onImport: (list: Contact[]) => void | Promise<void>;
}

export function ContactsPageTabPanel({
  effectiveTab,
  search,
  onSearchChange,
  filterGender,
  onGenderChange,
  quickFilter,
  onQuickFilterChange,
  sortField,
  sortDir,
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
  contacts,
  canWrite,
  canEditSetup,
  onImport,
}: ContactsPageTabPanelProps): JSX.Element {
  return (
    <AnimatePresence mode="wait">
      {effectiveTab === "work" ? (
        <motion.div key="work" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ContactsWorkDirectory
            search={search}
            onSearchChange={onSearchChange}
            filterGender={filterGender}
            onGenderChange={onGenderChange}
            quickFilter={quickFilter}
            onQuickFilterChange={onQuickFilterChange}
            sortField={sortField}
            sortDir={sortDir}
            onSort={onSort}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
            onClearFilters={onClearFilters}
            viewingDeleted={viewingDeleted}
            onShowDeletedChange={onShowDeletedChange}
            canViewDeleted={canViewDeleted}
            viewModeOverride={viewModeOverride}
            onViewModeChange={onViewModeChange}
            shownCount={shownCount}
            workTruncated={workTruncated}
            selected={selected}
            onClearSelection={onClearSelection}
            selectedTargets={selectedTargets}
            bulkActions={bulkActions}
            canWriteMessaging={canWriteMessaging}
            canExport={canExport}
            canDelete={canDelete}
            onWhatsApp={onWhatsApp}
            onSms={onSms}
            onBulkExport={onBulkExport}
            onRequestBulkDelete={onRequestBulkDelete}
            onRequestBulkRestore={onRequestBulkRestore}
            isWorkError={isWorkError}
            isWorkLoading={isWorkLoading}
            isWorkFetching={isWorkFetching}
            onRetryWork={onRetryWork}
            workContacts={workContacts}
            tableColumns={tableColumns}
            commonDirectoryProps={commonDirectoryProps}
            tableProps={tableProps}
            useServerWork={useServerWork}
            workPageData={workPageData}
            onPageChange={onPageChange}
          />
        </motion.div>
      ) : effectiveTab === "reports" ? (
        <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
          <ErrorBoundary>
            <div className="space-y-4">
              <KPISummary category="contacts" />
              <ModuleReports category="contacts" />
            </div>
          </ErrorBoundary>
        </motion.div>
      ) : effectiveTab === "setup" ? (
        <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
          <ErrorBoundary>
            <ContactsSettingsPanel
              contacts={contacts}
              canWrite={canWrite}
              canEditSetup={canEditSetup}
              onImport={onImport}
            />
          </ErrorBoundary>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
