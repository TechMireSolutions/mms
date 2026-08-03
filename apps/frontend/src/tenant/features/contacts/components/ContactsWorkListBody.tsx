import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserX, RefreshCw } from "lucide-react";
import type { Contact } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListPagination } from "@/components/ui/ListPagination";
import ContactsTable from "@/tenant/features/contacts/components/ContactsTable";
import ContactCards from "@/tenant/features/contacts/components/ContactCards";
import type { ContactsWorkViewMode } from "@/tenant/features/contacts/components/contactsWorkDirectoryTypes";
import { useTranslation } from "@/hooks/useTranslation";

type DirectoryColumn = { id: string; label: string; sortField?: string; width?: number };

export interface ContactsWorkListBodyProps {
  isWorkError: boolean;
  isWorkLoading: boolean;
  isWorkFetching: boolean;
  onRetryWork: () => void;
  workContacts: Contact[];
  tableColumns: DirectoryColumn[];
  hasActiveFilters: boolean;
  viewingDeleted: boolean;
  canWrite: boolean;
  onClearFilters: () => void;
  onShowDeletedChange?: (show: boolean) => void;
  viewMode: ContactsWorkViewMode;
  commonDirectoryProps: React.ComponentProps<typeof ContactCards>;
  tableProps: React.ComponentProps<typeof ContactsTable>;
  useServerWork: boolean;
  workPageData?: { page: number; total: number; limit: number; hasMore: boolean } | null;
  onPageChange: (page: number) => void;
}

export function ContactsWorkListBody({
  isWorkError,
  isWorkLoading,
  isWorkFetching,
  onRetryWork,
  workContacts,
  tableColumns,
  hasActiveFilters,
  viewingDeleted,
  canWrite,
  onClearFilters,
  onShowDeletedChange,
  viewMode,
  commonDirectoryProps,
  tableProps,
  useServerWork,
  workPageData,
  onPageChange,
}: ContactsWorkListBodyProps): JSX.Element {
  const { t } = useTranslation();

  const emptyDescription = hasActiveFilters
    ? t("contacts.tryAdjustingFilters")
    : viewingDeleted
      ? t("contacts.emptyTrashHint")
      : canWrite
        ? t("contacts.clickAddContact")
        : t("contacts.emptyDirectoryReadOnly");

  const emptyAction = hasActiveFilters ? (
    <Button type="button" variant="outline" size="sm" onClick={onClearFilters} className="gap-1.5">
      <RefreshCw className="w-3 h-3" /> {t("contacts.clearFilters")}
    </Button>
  ) : viewingDeleted && onShowDeletedChange ? (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => onShowDeletedChange(false)}
      className="gap-1.5"
    >
      <RefreshCw className="w-3 h-3" /> {t("contacts.showActive")}
    </Button>
  ) : null;

  return (
    <AnimatePresence mode="wait">
      {isWorkError ? (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ErrorState
            title={t("contacts.loadFailed")}
            description={t("contacts.loadFailedHint")}
            onRetry={onRetryWork}
          />
        </motion.div>
      ) : isWorkLoading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-busy="true"
          role="status"
          aria-live="polite"
        >
          <TableSkeleton rows={6} cols={tableColumns.length} />
          <span className="sr-only">{t("common.loading")}</span>
        </motion.div>
      ) : (
        <motion.div
          key="list-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          aria-busy={useServerWork && isWorkFetching ? true : undefined}
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
                description={emptyDescription}
                action={emptyAction}
              />
            </div>
          ) : (
            <ErrorBoundary>
              {viewMode === "cards" ? (
                <ContactCards {...commonDirectoryProps} />
              ) : (
                <div className="space-y-2">
                  <ContactsTable {...tableProps} />
                </div>
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
                <p className="text-xs text-muted-foreground px-1" role="status" aria-live="polite">
                  {t("common.loading")}
                </p>
              )}
            </ErrorBoundary>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
