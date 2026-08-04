import type { JSX } from 'react';
import type { WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';
import {
  getDisplayName,
  getInitials,
  getPrimaryEmail,
  getPrimaryPhone,
  type Contact,
} from '@mms/shared';
import { Checkbox } from '@/components/ui/checkbox';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { ResizableTableHead } from '@/components/ui/ResizableTableHead';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslation } from '@/hooks/useTranslation';
import type { MessagingSelectedMap } from '@/tenant/features/messaging/components/messagingWorkPanelShared';

interface MessagingWorkRecipientsListProps {
  viewMode: WorkDirectoryViewMode;
  contacts: Contact[];
  selectedById: MessagingSelectedMap;
  allVisibleSelected: boolean;
  isPending: boolean;
  isFetching: boolean;
  getColumnWidth: (key: string) => number | undefined;
  onToggleRecipient: (contact: Contact) => void;
  onToggleAllVisible: (checked: boolean) => void;
  setColumnWidth: (key: string, width: number) => void;
}

export function MessagingWorkRecipientsList({
  viewMode,
  contacts,
  selectedById,
  allVisibleSelected,
  isPending,
  isFetching,
  getColumnWidth,
  onToggleRecipient,
  onToggleAllVisible,
  setColumnWidth,
}: MessagingWorkRecipientsListProps): JSX.Element {
  const { t } = useTranslation();
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
        {contacts.length > 0 && (
          <div className="flex items-center gap-2 border-b border-border/60 pb-2">
            <Checkbox
              checked={allVisibleSelected}
              onCheckedChange={onToggleAllVisible}
              aria-label={t('contacts.table.selectAll')}
            />
            <span className="text-xs font-semibold text-muted-foreground">{t('contacts.table.selectAll')}</span>
          </div>
        )}
        {contacts.map((contact) => {
          const phone = getPrimaryPhone(contact);
          const email = getPrimaryEmail(contact);
          const displayName = getDisplayName(contact);
          return (
            <article key={contact.id} className="space-y-2 rounded-xl border border-border bg-card p-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={Boolean(selectedById[String(contact.id)])}
                  onCheckedChange={() => onToggleRecipient(contact)}
                  aria-label={t('messaging.selectRecipient', { name: displayName })}
                />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">
                    {getInitials(displayName)}
                  </span>
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">{displayName}</span>
                </div>
              </div>
              <dl className="grid grid-cols-1 gap-2 ps-8 text-sm">
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t('contacts.form.primaryPhone')}</dt>
                  <dd className="font-mono text-xs text-foreground">
                    {phone || (
                      <span className="rounded border border-warning/20 bg-warning/10 px-1.5 py-0.5 text-xs text-warning">
                        {t('messaging.missingPhone')}
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t('contacts.form.primaryEmail')}</dt>
                  <dd className="text-xs text-foreground">
                    {email || (
                      <span className="rounded border border-warning/20 bg-warning/10 px-1.5 py-0.5 text-xs text-warning">
                        {t('messaging.missingEmail')}
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
        {contacts.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">{t('messaging.selectRecipientsDesc')}</p>
        )}
      </div>
      ) : (
      <Table className="table-fixed text-xs">
        <TableHeader className="bg-muted/40 font-semibold uppercase tracking-wider text-muted-foreground">
          <TableRow className="border-b border-border/60 hover:bg-transparent">
            <TableHead className="w-10 px-4 py-2">
              <Checkbox
                checked={allVisibleSelected}
                onCheckedChange={onToggleAllVisible}
                aria-label={t('contacts.table.selectAll')}
              />
            </TableHead>
            {(['recipient', 'phone', 'email'] as const).map((column) => (
              <ResizableTableHead
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
              </ResizableTableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/60">
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
                  {phone || (
                    <span className="rounded border border-warning/20 bg-warning/10 px-1.5 py-0.5 text-xs text-warning">
                      {t('messaging.missingPhone')}
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-2">
                  {email || (
                    <span className="rounded border border-warning/20 bg-warning/10 px-1.5 py-0.5 text-xs text-warning">
                      {t('messaging.missingEmail')}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {contacts.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                {t('messaging.selectRecipientsDesc')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      )}
    </div>
  );
}
