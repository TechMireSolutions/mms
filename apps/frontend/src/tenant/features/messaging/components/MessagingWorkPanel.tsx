import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CONTACTS_MODULE_MANIFEST, type Contact, type MessagingGenderFilter, type MessagingRoleFilter, type StandardMessagingRecipient as MessagingRecipient } from '@mms/shared';
import { ErrorState } from '@/components/ui/ErrorState';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { useMessagingRecipientsColumnLayout } from '../hooks/useMessagingColumnLayouts';
import { useMessagingPageOptions } from '../hooks/useMessagingPageOptions';
import {
  loadMatchingRecipients,
  useMessagingWorkRecipients,
} from '../hooks/useMessagingWorkRecipients';
import {
  contactToRecipient,
  type MessagingSelectedMap,
} from '@/tenant/features/messaging/components/messagingWorkPanelShared';
import {
  MessagingWorkComposerSection,
  MessagingWorkRecipientsSection,
} from '@/tenant/features/messaging/components/MessagingWorkPanelSections';

export type { MessagingSelectedMap } from '@/tenant/features/messaging/components/messagingWorkPanelShared';

interface MessagingWorkPanelProps {
  canWrite: boolean;
  selectedById: MessagingSelectedMap;
  selectedList: MessagingRecipient[];
  onSelectedByIdChange: (recipients: MessagingSelectedMap) => void;
  onCompose: (channel: 'sms' | 'whatsapp' | 'email') => void;
}

export function MessagingWorkPanel({
  canWrite,
  selectedById,
  selectedList,
  onSelectedByIdChange,
  onCompose,
}: MessagingWorkPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const { roleOptions, genderOptions } = useMessagingPageOptions();
  const [searchContact, setSearchContact] = useState('');
  const [recipientsPage, setRecipientsPage] = useState(1);
  const [genderFilter, setGenderFilter] = useState<MessagingGenderFilter>('all');
  const [roleFilter, setRoleFilter] = useState<MessagingRoleFilter>('all');
  const [selectingReachable, setSelectingReachable] = useState(false);
  const selectAbortRef = useRef<AbortController | null>(null);
  const debouncedSearch = useDebounce(searchContact, 250);

  useEffect(() => setRecipientsPage(1), [debouncedSearch, genderFilter, roleFilter]);

  useEffect(() => () => {
    selectAbortRef.current?.abort();
  }, []);

  const recipientsQuery = useMessagingWorkRecipients({
    roleFilter,
    genderFilter,
    search: debouncedSearch,
    page: recipientsPage,
    pageSize: CONTACTS_MODULE_MANIFEST.defaultPageSize,
  });
  const contacts = recipientsQuery.contacts;
  const { getColumnWidth, setColumnWidth } = useMessagingRecipientsColumnLayout();
  const allVisibleSelected = contacts.length > 0 && contacts.every((contact) => Boolean(selectedById[String(contact.id)]));

  const toggleRecipient = (contact: Contact): void => {
    const key = String(contact.id);
    const next = { ...selectedById };
    if (next[key]) delete next[key];
    else next[key] = contactToRecipient(contact);
    onSelectedByIdChange(next);
  };

  const toggleAllVisible = (checked: boolean): void => {
    const next = { ...selectedById };
    contacts.forEach((contact) => {
      const key = String(contact.id);
      if (checked) next[key] = contactToRecipient(contact);
      else delete next[key];
    });
    onSelectedByIdChange(next);
  };

  const selectReachable = async (kind: 'phone' | 'email'): Promise<void> => {
    if (selectingReachable) return;
    selectAbortRef.current?.abort();
    const controller = new AbortController();
    selectAbortRef.current = controller;
    setSelectingReachable(true);
    try {
      const { recipients: matched, truncated } = await loadMatchingRecipients({
        roleFilter,
        genderFilter,
        search: debouncedSearch,
        kind,
        signal: controller.signal,
      });
      const next: MessagingSelectedMap = {};
      for (const recipient of matched) {
        next[String(recipient.id)] = recipient;
      }
      onSelectedByIdChange(next);
      if (truncated) notify.warning(t('messaging.selectAllTruncated'));
    } catch (error) {
      if ((error as { name?: string })?.name === 'AbortError') return;
      notify.error(t('messaging.selectAllFailed'), { description: t('messaging.loadFailedHint') });
    } finally {
      if (selectAbortRef.current === controller) selectAbortRef.current = null;
      setSelectingReachable(false);
    }
  };

  if (recipientsQuery.isError) {
    return (
      <ErrorState
        title={t('messaging.loadFailed')}
        description={t('messaging.loadFailedHint')}
        onRetry={() => {
          recipientsQuery.refetch();
        }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 gap-4 lg:grid-cols-3"
    >
      <MessagingWorkRecipientsSection
        contacts={contacts}
        selectedById={selectedById}
        searchContact={searchContact}
        genderFilter={genderFilter}
        roleFilter={roleFilter}
        roleOptions={roleOptions}
        genderOptions={genderOptions}
        selectingReachable={selectingReachable}
        allVisibleSelected={allVisibleSelected}
        recipientsPage={recipientsQuery.page}
        recipientsTotal={recipientsQuery.total}
        recipientsLimit={recipientsQuery.limit}
        recipientsHasMore={recipientsQuery.hasMore}
        getColumnWidth={getColumnWidth}
        onSearchChange={setSearchContact}
        onGenderFilterChange={setGenderFilter}
        onRoleFilterChange={setRoleFilter}
        onToggleRecipient={toggleRecipient}
        onToggleAllVisible={toggleAllVisible}
        onSelectReachable={(kind) => void selectReachable(kind)}
        onClearSelection={() => onSelectedByIdChange({})}
        onPageChange={setRecipientsPage}
        setColumnWidth={setColumnWidth}
        selectedCount={selectedList.length}
      />
      <MessagingWorkComposerSection canWrite={canWrite} selectedList={selectedList} onCompose={onCompose} />
    </motion.div>
  );
}
