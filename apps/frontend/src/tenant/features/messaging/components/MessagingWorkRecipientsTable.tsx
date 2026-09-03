import React, { type JSX, type ReactNode } from 'react';
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
import { SEMANTIC_TEXT, SEMANTIC_BG } from '@/lib/semanticTone';
import { MissingFieldBadge } from './messagingRecipientsShared';

export interface MessagingWorkRecipientsTableProps {
  contacts: Contact[];
  selectedById: MessagingSelectedMap;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  selectedCount: number;
  selectedCountLabel: ReactNode;
  pageCountLabel: ReactNode;
  showRecipientCol: boolean;
  showPhoneCol: boolean;
  showEmailCol: boolean;
  getColumnWidth: (key: string) => number | undefined;
  setColumnWidth: (key: string, width: number) => void;
  onToggleRecipient: (contact: Contact) => void;
  onToggleAllVisible: (checked: boolean) => void;
}

export function MessagingWorkRecipientsTable({
  contacts,
  selectedById,
  allVisibleSelected,
  someVisibleSelected,
  selectedCount,
  selectedCountLabel,
  pageCountLabel,
  showRecipientCol,
  showPhoneCol,
  showEmailCol,
  getColumnWidth,
  setColumnWidth,
  onToggleRecipient,
  onToggleAllVisible,
}: MessagingWorkRecipientsTableProps): JSX.Element {
  const { t } = useTranslation();

  return (
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
  );
}
