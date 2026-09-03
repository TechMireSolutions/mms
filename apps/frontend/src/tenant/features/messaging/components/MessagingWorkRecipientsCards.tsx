import React, { type JSX, type ReactNode } from 'react';
import {
  getDisplayName,
  getPrimaryEmail,
  getPrimaryPhone,
  type Contact,
} from '@mms/shared';
import { DirectoryCardHeader } from '@/components/ui/DirectoryCardHeader';
import { ModuleDirectoryCards } from '@/components/ui/ModuleDirectoryCards';
import { DirectoryEntityCard } from '@/components/ui/DirectoryEntityCard';
import { StatGrid, StatRow } from '@/components/ui/StatGrid';
import { useTranslation } from '@/hooks/useTranslation';
import type { MessagingSelectedMap } from '@/tenant/features/messaging/components/messagingWorkPanelShared';
import { MissingFieldBadge } from './messagingRecipientsShared';

export interface MessagingWorkRecipientsCardsProps {
  contacts: Contact[];
  selectedById: MessagingSelectedMap;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  selectedCountLabel: ReactNode;
  pageCountLabel: ReactNode;
  reducedMotion: boolean;
  showPhoneCol: boolean;
  showEmailCol: boolean;
  onToggleRecipient: (contact: Contact) => void;
  onToggleAllVisible: (checked: boolean) => void;
}

export function MessagingWorkRecipientsCards({
  contacts,
  selectedById,
  allVisibleSelected,
  someVisibleSelected,
  selectedCountLabel,
  pageCountLabel,
  reducedMotion,
  showPhoneCol,
  showEmailCol,
  onToggleRecipient,
  onToggleAllVisible,
}: MessagingWorkRecipientsCardsProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <ModuleDirectoryCards
      items={contacts}
      selectedIds={Object.keys(selectedById).filter((id) => selectedById[id])}
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
  );
}
