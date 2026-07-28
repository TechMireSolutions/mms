import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Download,
  Users,
  UserX,
  Trash2,
  X,
  MessageCircle,
  MessageSquare,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import type { Contact, ContactsQuickFilter } from "@mms/shared";
import { CONTACTS_MODULE_MANIFEST } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListPagination } from "@/components/ui/ListPagination";
import ContactsTable from "@/tenant/features/contacts/components/ContactsTable";
import ContactCards from "@/tenant/features/contacts/components/ContactCards";
import ContactsToolbar from "@/tenant/features/contacts/components/ContactsToolbar";
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

      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-card/90 border border-primary/20 shadow-md backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {t("contacts.selectedCount", { count: selected.length })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {bulkActions.includes("whatsapp") && !viewingDeleted && canWriteMessaging && (
                <Button
                  type="button"
                  size="sm"
                  disabled={selectedTargets.waTargets.length === 0}
                  onClick={() => onWhatsApp(selectedTargets.waTargets)}
                  aria-label={t("contacts.whatsappBulk", { count: selectedTargets.waTargets.length })}
                  className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground font-semibold shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />{" "}
                  {t("contacts.whatsappBulk", { count: selectedTargets.waTargets.length })}
                </Button>
              )}
              {bulkActions.includes("sms") && !viewingDeleted && canWriteMessaging && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={selectedTargets.smsReady.length === 0}
                  onClick={() => onSms(selectedTargets.smsReady)}
                  aria-label={t("contacts.smsBulk", { count: selectedTargets.smsReady.length })}
                  className="gap-1.5 border-primary/40 bg-primary/10 text-primary font-semibold hover:bg-primary/20"
                >
                  <MessageSquare className="w-3.5 h-3.5" />{" "}
                  {t("contacts.smsBulk", { count: selectedTargets.smsReady.length })}
                </Button>
              )}
              {bulkActions.includes("export") && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onBulkExport}
                  disabled={!canExport}
                  className="gap-1.5 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" /> {t("contacts.bulkExport")}
                </Button>
              )}
              {bulkActions.includes("delete") && canDelete && !viewingDeleted && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={onRequestBulkDelete}
                  className="gap-1.5 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> {t("contacts.bulkDelete")}
                </Button>
              )}
              {viewingDeleted && canDelete && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onRequestBulkRestore}
                  className="gap-1.5 border-primary/40 text-primary font-semibold hover:bg-primary/10"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> {t("contacts.bulkRestore")}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="text-muted-foreground hover:text-foreground font-medium"
              >
                {t("contacts.deselect")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isWorkError ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ErrorState
              title={t("contacts.sync.failed")}
              description={t("common.retry")}
              onRetry={onRetryWork}
            />
          </motion.div>
        ) : isWorkLoading ? (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TableSkeleton rows={6} cols={tableColumns.length} />
          </motion.div>
        ) : (
          <motion.div
            key="list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {workContacts.length === 0 ? (
              <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl p-6">
                <EmptyState
                  icon={UserX}
                  title={
                    hasActiveFilters
                      ? t("contacts.noContactsMatchFilters")
                      : viewingDeleted
                        ? t("contacts.noDeletedContacts")
                        : t("contacts.noContactsYet")
                  }
                  description={
                    hasActiveFilters
                      ? t("contacts.tryAdjustingFilters")
                      : viewingDeleted
                        ? t("contacts.showActive")
                        : t("contacts.clickAddContact")
                  }
                  action={
                    hasActiveFilters ? (
                      <Button type="button" variant="outline" size="sm" onClick={onClearFilters} className="gap-1.5">
                        <RefreshCw className="w-3 h-3" /> {t("contacts.clearFilters")}
                      </Button>
                    ) : null
                  }
                />
              </div>
            ) : (
              <ErrorBoundary>
                {viewModeOverride === "cards" ? (
                  <ContactCards {...commonDirectoryProps} />
                ) : viewModeOverride === "table" ? (
                  <ContactsTable {...tableProps} />
                ) : (
                  <>
                    <div className="lg:hidden">
                      <ContactCards {...commonDirectoryProps} />
                    </div>
                    <div className="hidden lg:block space-y-2">
                      <ContactsTable {...tableProps} />
                    </div>
                  </>
                )}
                {useServerWork && workPageData && (
                  <ListPagination
                    page={workPageData.page}
                    total={workPageData.total}
                    limit={workPageData.limit}
                    hasMore={workPageData.hasMore}
                    onPageChange={onPageChange}
                    i18nNamespace="contacts"
                    variant="range"
                  />
                )}
                {useServerWork && isWorkFetching && (
                  <p className="text-xs text-muted-foreground px-1">{t("common.loading")}</p>
                )}
              </ErrorBoundary>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
