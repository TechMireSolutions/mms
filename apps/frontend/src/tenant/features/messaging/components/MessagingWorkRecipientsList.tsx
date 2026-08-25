import React, { type JSX, type ReactNode } from 'react';
import { UserX } from 'lucide-react';
import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import {
  getDisplayName,
  getInitials,
  getPrimaryEmail,
  getPrimaryPhone,
  type Contact,
} from '@mms/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { ModuleTableFooterCount } from '@/components/ui/ModuleTableFooterCount';
import { ModuleTableHeaderCell } from '@/components/ui/ModuleTableHeaderCell';
import { ModuleWorkDirectoryEmpty } from '@/components/ui/ModuleWorkDirectoryEmpty';
import {
  ModuleWorkListStateShell,
  type ModuleWorkListPageData,
} from '@/components/ui/ModuleWorkListStateShell';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DirectoryCardHeader } from '@/components/ui/DirectoryCardHeader';
import { ModuleDirectoryCards } from '@/components/ui/ModuleDirectoryCards';
import { DirectoryEntityCard } from '@/components/ui/DirectoryEntityCard';
import { StatGrid, StatRow } from '@/components/ui/StatGrid';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTranslation } from '@/hooks/useTranslation';
import type { MessagingSelectedMap } from '@/tenant/features/messaging/components/messagingWorkPanelShared';
import { SEMANTIC_TEXT, SEMANTIC_BG } from '@/lib/semanticTone';

export interface MessagingWorkRecipientsListProps {
  viewMode: WorkDirectoryViewMode;
  contacts: Contact[];
  selectedById: MessagingSelectedMap;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  selectedCount: number;
  selectedCountLabel: ReactNode;
  pageCountLabel: ReactNode;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  pageData?: ModuleWorkListPageData | null;
  onPageChange: (page: number) => void;
  getColumnWidth: (key: string) => number | undefined;
  isColumnVisible?: (key: string) => boolean;
  onToggleRecipient: (contact: Contact) => void;
  onToggleAllVisible: (checked: boolean) => void;
  setColumnWidth: (key: string, width: number) => void;
}

function MissingFieldBadge({ label }: { label: string }): JSX.Element {
  return (
    <span className={`rounded border border-warning/20 ${SEMANTIC_BG.warning} px-1.5 py-0.5 text-xs ${SEMANTIC_TEXT.warning}`}>
      {label}
    </span>
  );
}

export const MessagingWorkRecipientsList = React.memo(function MessagingWorkRecipientsList({
  viewMode,
  contacts,
  selectedById,
  allVisibleSelected,
  someVisibleSelected,
  selectedCount,
  selectedCountLabel,
  pageCountLabel,
  isPending,
  isFetching,
  isError,
  onRetry,
  hasActiveFilters,
  onClearFilters,
  pageData,
  onPageChange,
  getColumnWidth,
  isColumnVisible = () => true,
  onToggleRecipient,
  onToggleAllVisible,
  setColumnWidth,
}: MessagingWorkRecipientsListProps): JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const showRecipientCol = isColumnVisible('recipient');
  const showPhoneCol = isColumnVisible('phone');
  const showEmailCol = isColumnVisible('email');

  return (
    <ModuleWorkListStateShell
      isError={isError}
      isLoading={isPending && contacts.length === 0}
      isFetching={isFetching}
      onRetry={onRetry}
      errorTitle={t('messaging.loadFailed')}
      errorHint={t('messaging.loadFailedHint')}
      viewMode={viewMode}
      skeletonColumnCount={4}
      useServerWork={true}
      pageData={pageData}
      onPageChange={onPageChange}
      i18nNamespace="messaging"
      showPagination={contacts.length > 0}
      loadingLabel={t('common.loading')}
    >
      {contacts.length === 0 ? (
        <ModuleWorkDirectoryEmpty
          icon={UserX}
          title={
            hasActiveFilters
              ? t('contacts.noContactsMatchFilters')
              : t('messaging.noMatchingRecipients')
          }
          description={
            hasActiveFilters
              ? t('contacts.tryAdjustingFilters')
              : t('messaging.selectRecipientsDesc')
          }
          hasActiveFilters={hasActiveFilters}
          viewingDeleted={false}
          onClearFilters={onClearFilters}
          clearFiltersLabel={t('common.clearFilters')}
          showActiveLabel=""
        />
      ) : viewMode === 'cards' ? (
        <ModuleDirectoryCards
          items={contacts}
          selectedIds={Object.keys(selectedById).filter(id => selectedById[id])}
          onSelectAll={() => onToggleAllVisible(!allVisibleSelected)}
          allSelected={allVisibleSelected}
          someSelected={someVisibleSelected}
          selectAllLabel={t('messaging.selectAllVisible')}
          deselectAllLabel={t('common.deselect')}
          selectedCountLabel={selectedCountLabel}
          pageCountLabel={pageCountLabel}
          checkboxIdPrefix="messaging-recipients-select-cards"
          renderItem={(contact) => {
            const isSelected = Boolean(selectedById[String(contact.id)]);
            const displayName = getDisplayName(contact);
            return (
              <DirectoryEntityCard key={contact.id} isSelected={isSelected} reducedMotion={reducedMotion}>
                <DirectoryCardHeader
                  id={contact.id}
                  displayName={displayName}
                  avatar={contact.avatar}
                  isSelected={isSelected}
                  onSelect={() => onToggleRecipient(contact)}
                  selectAriaLabel={t('messaging.selectRecipient', { name: displayName })}
                  reducedMotion={reducedMotion}
                  showSelect={true}
                />
                <StatGrid columns="sm2" className="ms-1">
                  {showPhoneCol && (
                    <StatRow
                      label={t('contacts.form.primaryPhone')}
                      value={getPrimaryPhone(contact) ?? <MissingFieldBadge label={t('messaging.missingPhone')} />}
                      ddClassName="font-mono text-xs"
                    />
                  )}
                  {showEmailCol && (
                    <StatRow
                      label={t('contacts.form.primaryEmail')}
                      value={getPrimaryEmail(contact) ?? <MissingFieldBadge label={t('messaging.missingEmail')} />}
                      ddClassName="text-xs"
                    />
                  )}
                </StatGrid>
              </DirectoryEntityCard>
            );
          }}
        />
      ) : (
        <div className="space-y-2">
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <Table className="table-fixed text-xs">
              <TableHeader>
                <TableRow className="border-b border-border/60 hover:bg-muted/30">
                  <TableHead className="w-10 px-4 py-2 h-auto">
                    <Checkbox
                      checked={someVisibleSelected ? 'indeterminate' : allVisibleSelected}
                      onCheckedChange={onToggleAllVisible}
                      aria-label={t('messaging.selectAllVisible')}
                    />
                  </TableHead>
                  {showRecipientCol && (
                    <ModuleTableHeaderCell
                      columnKey="recipient"
                      width={getColumnWidth('recipient')}
                      onResize={setColumnWidth}
                      className="px-4 py-2"
                    >
                      {t('messaging.recipient')}
                    </ModuleTableHeaderCell>
                  )}
                  {showPhoneCol && (
                    <ModuleTableHeaderCell
                      columnKey="phone"
                      width={getColumnWidth('phone')}
                      onResize={setColumnWidth}
                      className="px-4 py-2"
                    >
                      {t('contacts.form.primaryPhone')}
                    </ModuleTableHeaderCell>
                  )}
                  {showEmailCol && (
                    <ModuleTableHeaderCell
                      columnKey="email"
                      width={getColumnWidth('email')}
                      onResize={setColumnWidth}
                      className="px-4 py-2"
                    >
                      {t('contacts.form.primaryEmail')}
                    </ModuleTableHeaderCell>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/50">
                {contacts.map((contact) => {
                  const phone = getPrimaryPhone(contact);
                  const email = getPrimaryEmail(contact);
                  return (
                    <TableRow key={contact.id} className="hover:bg-muted/10">
                      <TableCell className="px-4 py-2">
                        <Checkbox
                          checked={Boolean(selectedById[String(contact.id)])}
                          onCheckedChange={() => onToggleRecipient(contact)}
                          aria-label={t('messaging.selectRecipient', { name: getDisplayName(contact) })}
                        />
                      </TableCell>
                      {showRecipientCol && (
                        <TableCell className="px-4 py-2 font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${SEMANTIC_BG.primary} text-xs font-black ${SEMANTIC_TEXT.primary}`}>
                              {getInitials(getDisplayName(contact))}
                            </span>
                            <span className="truncate">{getDisplayName(contact)}</span>
                          </div>
                        </TableCell>
                      )}
                      {showPhoneCol && (
                        <TableCell className="px-4 py-2 font-mono">
                          {phone ?? <MissingFieldBadge label={t('messaging.missingPhone')} />}
                        </TableCell>
                      )}
                      {showEmailCol && (
                        <TableCell className="px-4 py-2">
                          {email ?? <MissingFieldBadge label={t('messaging.missingEmail')} />}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <ModuleTableFooterCount
            selectedCount={selectedCount}
            selectedCountLabel={String(selectedCountLabel)}
            pageCountLabel={String(pageCountLabel)}
          />
        </div>
      )}
    </ModuleWorkListStateShell>
  );
});
