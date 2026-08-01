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
  onClearFilters: () => void;
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
  onClearFilters,
  viewMode,
  commonDirectoryProps,
  tableProps,
  useServerWork,
  workPageData,
  onPageChange,
}: ContactsWorkListBodyProps): JSX.Element {
  const { t } = useTranslation();

  return (
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
                <p className="text-xs text-muted-foreground px-1">{t("common.loading")}</p>
              )}
            </ErrorBoundary>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
