import React, { type JSX, type ReactNode } from 'react';
import {
  getDisplayName,
  getInitials,
  getPrimaryEmail,
  getPrimaryPhone,
  type Contact,
} from '@mms/shared';
import { ModuleTableSelectionCell } from '@/components/ui/ModuleTableSelectionCell';
import { ModuleTableFooterCount } from '@/components/ui/ModuleTableFooterCount';
import { ModuleWorkTableHeader } from '@/components/ui/ModuleWorkTableHeader';
import {
  Table,
  TableBody,
  TableCell,
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
          <ModuleWorkTableHeader
            columns={[
              showRecipientCol ? { id: 'recipient', label: t('messaging.recipient') } : null,
              showPhoneCol ? { id: 'phone', label: t('contacts.form.primaryPhone') } : null,
              showEmailCol ? { id: 'email', label: t('contacts.form.primaryEmail') } : null,
            ].filter((c): c is { id: string; label: string } => c !== null)}
            getColumnWidth={getColumnWidth}
            setColumnWidth={setColumnWidth}
            selection={{
              allSelected: allVisibleSelected,
              someSelected: someVisibleSelected,
              onSelectAll: () => onToggleAllVisible(!allVisibleSelected),
              ariaLabel: t('messaging.selectAllVisible'),
            }}
            stickyColumnId=""
          />
          <TableBody className="divide-y divide-border/50">
            {contacts.map((contact) => {
              const phone = getPrimaryPhone(contact);
              const email = getPrimaryEmail(contact);
              return (
                <TableRow key={contact.id} className="hover:bg-muted/10">
                  <ModuleTableSelectionCell
                    checked={Boolean(selectedById[String(contact.id)])}
                    onCheckedChange={() => onToggleRecipient(contact)}
                    ariaLabel={t('messaging.selectRecipient', { name: getDisplayName(contact) })}
                    sticky={false}
                    className="px-4 py-2"
                  />
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
