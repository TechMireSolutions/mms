import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { StandardMessagingRecipient, Contact } from '@mms/shared';
import { toMessagingRecipient } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useMessagingWorkRecipients } from '@/tenant/features/messaging/hooks/useMessagingWorkRecipients';
import { useContactColumns } from '@/lib/contexts/ContactConfigContext';
import ContactsTable from '@/tenant/features/contacts/components/ContactsTable';
import { SearchBar } from '@/components/ui/SearchBar';

interface MessageComposerRecipientPickerProps {
  kind: 'phone' | 'email';
  existingIds: Set<string>;
  disabled?: boolean;
  onAdd: (recipient: StandardMessagingRecipient) => void;
  onRemove: (id: string | number) => void;
}

const DEBOUNCE_MS = 300;
const MAX_RESULTS = 100;

export function MessageComposerRecipientPicker({
  kind,
  existingIds,
  disabled,
  onAdd,
  onRemove,
}: MessageComposerRecipientPickerProps): React.JSX.Element {
  const { t } = useTranslation();
  const columns = useContactColumns();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Pagination for the table
  const [page, setPage] = useState(1);

  useEffect(() => {
    const id = setTimeout(() => { 
      setDebouncedQuery(query);
      setPage(1); // Reset to first page on search
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const {
    contacts,
    total,
    isPending,
    isFetching,
    hasMore,
  } = useMessagingWorkRecipients({
    roleFilter: 'all',
    genderFilter: 'all',
    search: debouncedQuery,
    page,
    pageSize: 50,
  });

  const handleToggle = useCallback((contact: Contact): void => {
    const isAdded = existingIds.has(String(contact.id));
    if (isAdded) {
      onRemove(contact.id);
    } else {
      // Map Contact to StandardMessagingRecipient
      const recipient = toMessagingRecipient(contact, {
        getPrimaryPhone: (c) => c.phone,
        getPrimaryEmail: (c) => c.email,
        getDisplayName: (c) => c.name,
      });
      onAdd(recipient);
    }
  }, [existingIds, onAdd, onRemove]);

  const handleSelect = useCallback((contactId: string | number) => {
    const contact = contacts.find((c) => String(c.id) === String(contactId));
    if (contact) handleToggle(contact);
  }, [contacts, handleToggle]);

  const handleSelectAll = useCallback(() => {
    // If all current page contacts are selected, deselect them. Otherwise, select all.
    const allSelected = contacts.every(c => existingIds.has(String(c.id)));
    if (allSelected) {
      contacts.forEach(c => onRemove(c.id));
    } else {
      contacts.forEach(c => {
        if (!existingIds.has(String(c.id))) {
          const recipient = toMessagingRecipient(c, {
            getPrimaryPhone: (contact) => contact.phone,
            getPrimaryEmail: (contact) => contact.email,
            getDisplayName: (contact) => contact.name,
          });
          onAdd(recipient);
        }
      });
    }
  }, [contacts, existingIds, onAdd, onRemove]);

  const allSelected = contacts.length > 0 && contacts.every(c => existingIds.has(String(c.id)));
  const someSelected = contacts.length > 0 && contacts.some(c => existingIds.has(String(c.id))) && !allSelected;

  // Stub functions for required table props
  const noop = () => {};

  return (
    <div className="flex flex-col gap-3 min-h-[500px]">
      <div className="flex items-center gap-2">
        <SearchBar
          placeholder={t('messaging.searchRecipients')}
          value={query}
          onChange={setQuery}
          className="flex-1"
        />
        {(isPending || isFetching) && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 overflow-hidden border border-border rounded-lg bg-background relative flex flex-col">
        {contacts.length === 0 && !isPending && !isFetching ? (
          <div className="p-8 text-center text-sm text-muted-foreground flex-1 flex items-center justify-center">
            {t('messaging.noRecipientsFound')}
          </div>
        ) : (
          <ContactsTable
            contacts={contacts}
            selected={Array.from(existingIds)}
            onSelect={disabled ? noop : handleSelect}
            onSelectAll={disabled ? noop : handleSelectAll}
            onView={noop}
            onEdit={noop}
            onDelete={noop}
            sortField="name"
            sortDir="asc"
            onSort={noop}
            columns={columns}
            allContacts={contacts}
            allSelected={allSelected}
            someSelected={someSelected}
          />
        )}
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="text-xs text-muted-foreground">
          Showing {contacts.length} of {total || contacts.length} records
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-xs px-2 py-1 border rounded disabled:opacity-50"
            disabled={page === 1 || isFetching}
            onClick={() => setPage(p => p - 1)}
          >
            {t('common.previous')}
          </button>
          <span className="text-xs text-muted-foreground">
            Page {page}
          </span>
          <button
            type="button"
            className="text-xs px-2 py-1 border rounded disabled:opacity-50"
            disabled={!hasMore || isFetching}
            onClick={() => setPage(p => p + 1)}
          >
            {t('common.next')}
          </button>
        </div>
      </div>
    </div>
  );
}
