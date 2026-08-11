import type { JSX, ReactNode } from 'react';
import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import {
  getDisplayName,
  getInitials,
  getPrimaryEmail,
  getPrimaryPhone,
  type Contact,
} from '@mms/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { ModuleTableFooterCount } from '@/components/ui/ModuleTableFooterCount';
import { ModuleTableHeaderCell } from '@/components/ui/ModuleTableHeaderCell';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DirectoryCardHeader } from '@/components/ui/DirectoryCardHeader';
import { DirectoryCardsGrid } from '@/components/ui/DirectoryCardsGrid';
import { DirectoryCardsSelectAllBar } from '@/components/ui/DirectoryCardsSelectAllBar';
import { DirectoryEntityCard } from '@/components/ui/DirectoryEntityCard';
import { StatGrid, StatRow } from '@/components/ui/StatGrid';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTranslation } from '@/hooks/useTranslation';
import type { MessagingSelectedMap } from '@/tenant/features/messaging/components/messagingWorkPanelShared';

interface MessagingWorkRecipientsListProps {
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
  getColumnWidth: (key: string) => number | undefined;
  onToggleRecipient: (contact: Contact) => void;
  onToggleAllVisible: (checked: boolean) => void;
  setColumnWidth: (key: string, width: number) => void;
}

function MissingFieldBadge({ label }: { label: string }): JSX.Element {
  return (
    <span className="rounded border border-warning/20 bg-warning/10 px-1.5 py-0.5 text-xs text-warning">
      {label}
    </span>
  );
}

export function MessagingWorkRecipientsList({
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
  getColumnWidth,
  onToggleRecipient,
  onToggleAllVisible,
  setColumnWidth,
}: MessagingWorkRecipientsListProps): JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const showLoadingEmpty = isPending && contacts.length === 0;

  return (
    <div
      className="max-h-[23.75rem] max-w-full overflow-y-auto rounded-lg border border-border/60"
      aria-busy={isPending || isFetching ? true : undefined}
    >
      {showLoadingEmpty ? (
        <div role="status" aria-live="polite" className="p-3">
          <TableSkeleton rows={6} cols={viewMode === 'table' ? 4 : 3} />
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="space-y-3 p-3">
          {contacts.length > 0 ? (
            <>
              <DirectoryCardsSelectAllBar
                checkboxId="messaging-recipients-select-all-cards"
                allSelected={allVisibleSelected}
                someSelected={someVisibleSelected}
                onSelectAll={() => onToggleAllVisible(!allVisibleSelected)}
                selectLabel={t('messaging.selectAllVisible')}
                deselectLabel={t('common.deselect')}
                selectedCount={selectedCount}
                selectedCountLabel={selectedCountLabel}
                pageCountLabel={pageCountLabel}
              />
              <DirectoryCardsGrid>
                {contacts.map((contact) => {
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
                      />
                      <StatGrid columns="sm2" className="ms-1">
                        <StatRow
                          label={t('contacts.form.primaryPhone')}
                          value={getPrimaryPhone(contact) ?? <MissingFieldBadge label={t('messaging.missingPhone')} />}
                          ddClassName="font-mono text-xs"
                        />
                        <StatRow
                          label={t('contacts.form.primaryEmail')}
                          value={getPrimaryEmail(contact) ?? <MissingFieldBadge label={t('messaging.missingEmail')} />}
                          ddClassName="text-xs"
                        />
                      </StatGrid>
                    </DirectoryEntityCard>
                  );
                })}
              </DirectoryCardsGrid>
            </>
          ) : (
            <EmptyState
              title={t('messaging.noMatchingRecipients')}
              description={t('messaging.selectRecipientsDesc')}
              compact
              icon={null}
            />
          )}
        </div>
      ) : (
        <>
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
              {(['recipient', 'phone', 'email'] as const).map((column) => (
                <ModuleTableHeaderCell
                  key={column}
                  columnKey={column}
                  width={getColumnWidth(column)}
                  onResize={setColumnWidth}
                  className="px-4 py-2"
                >
                  {column === 'recipient'
                    ? t('messaging.recipient')
                    : column === 'phone'
                      ? t('contacts.form.primaryPhone')
                      : t('contacts.form.primaryEmail')}
                </ModuleTableHeaderCell>
              ))}
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
                  <TableCell className="px-4 py-2 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                        {getInitials(getDisplayName(contact))}
                      </span>
                      <span>{getDisplayName(contact)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2 font-mono">
                    {phone ?? <MissingFieldBadge label={t('messaging.missingPhone')} />}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    {email ?? <MissingFieldBadge label={t('messaging.missingEmail')} />}
                  </TableCell>
                </TableRow>
              );
            })}
            {contacts.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="p-0">
                  <EmptyState
                    title={t('messaging.noMatchingRecipients')}
                    description={t('messaging.selectRecipientsDesc')}
                    compact
                    icon={null}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
          <ModuleTableFooterCount
            selectedCount={selectedCount}
            selectedCountLabel={String(selectedCountLabel)}
            pageCountLabel={String(pageCountLabel)}
          />
        </>
      )}
    </div>
  );
}
