import React, { useMemo, type JSX, type ReactNode } from 'react';
import {
  getDisplayName,
  getPrimaryEmail,
  getPrimaryPhone,
  type Contact,
} from '@mms/shared';
import { DirectoryCardHeader } from '@/components/ui/DirectoryCardHeader';
import { DirectoryCardMetaGrid } from '@/components/ui/DirectoryCardMetaGrid';
import { DirectoryCardMetaTile } from '@/components/ui/DirectoryCardMetaTile';
import { ModuleDirectoryCards } from '@/components/ui/ModuleDirectoryCards';
import { DirectoryEntityCard } from '@/components/ui/DirectoryEntityCard';
import { useTranslation } from '@/hooks/useTranslation';
import { useWorkCardAction } from '@/hooks/useWorkCardAction';
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

function MessagingRecipientCard({
  contact,
  selectedIds,
  reducedMotion,
  showPhoneCol,
  showEmailCol,
  onToggleRecipient,
}: {
  contact: Contact;
  selectedIds: string[];
  reducedMotion: boolean;
  showPhoneCol: boolean;
  showEmailCol: boolean;
  onToggleRecipient: (contact: Contact) => void;
}): JSX.Element {
  const { t } = useTranslation();
  const displayName = getDisplayName(contact);

  const { isSelected, onSelect, cardProps } = useWorkCardAction({
    entity: contact,
    selectedIds,
    onToggleSelected: () => onToggleRecipient(contact),
    canSelect: true,
  });

  const phone = getPrimaryPhone(contact);
  const email = getPrimaryEmail(contact);

  return (
    <DirectoryEntityCard isSelected={isSelected} reducedMotion={reducedMotion} {...cardProps}>
      <DirectoryCardHeader
        id={contact.id}
        displayName={displayName}
        avatar={contact.avatar}
        isSelected={isSelected}
        onSelect={onSelect}
        selectAriaLabel={t('messaging.selectRecipient', { name: displayName })}
        reducedMotion={reducedMotion}
        showSelect={true}
      />
      {(showPhoneCol || showEmailCol) && (
        <DirectoryCardMetaGrid>
          {showPhoneCol && (
            <DirectoryCardMetaTile label={t('contacts.form.primaryPhone')}>
              {phone ? (
                <span className="font-mono text-xs">{phone}</span>
              ) : (
                <MissingFieldBadge label={t('messaging.missingPhone')} />
              )}
            </DirectoryCardMetaTile>
          )}
          {showEmailCol && (
            <DirectoryCardMetaTile label={t('contacts.form.primaryEmail')}>
              {email ? (
                <span className="text-xs">{email}</span>
              ) : (
                <MissingFieldBadge label={t('messaging.missingEmail')} />
              )}
            </DirectoryCardMetaTile>
          )}
        </DirectoryCardMetaGrid>
      )}
    </DirectoryEntityCard>
  );
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

  const selectedIds = useMemo(
    () => Object.keys(selectedById).filter((id) => selectedById[id]),
    [selectedById],
  );

  return (
    <ModuleDirectoryCards
      items={contacts}
      selectedIds={selectedIds}
      onSelectAll={() => onToggleAllVisible(!allVisibleSelected)}
      allSelected={allVisibleSelected}
      someSelected={someVisibleSelected}
      selectAllLabel={t('messaging.selectAllVisible')}
      deselectAllLabel={t('common.deselect')}
      selectedCountLabel={selectedCountLabel}
      pageCountLabel={pageCountLabel}
      checkboxIdPrefix="messaging-recipients-select-cards"
      renderItem={(contact) => (
        <MessagingRecipientCard
          key={contact.id}
          contact={contact}
          selectedIds={selectedIds}
          reducedMotion={reducedMotion}
          showPhoneCol={showPhoneCol}
          showEmailCol={showEmailCol}
          onToggleRecipient={onToggleRecipient}
        />
      )}
    />
  );
}
