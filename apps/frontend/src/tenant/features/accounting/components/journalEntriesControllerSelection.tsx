import type { Dispatch, FormEvent, ReactNode, SetStateAction } from 'react';
import type { JournalEntry } from '@/lib/data/accountingData';
import { JournalEntryActions } from '@/tenant/features/accounting/components/JournalEntryActions';
import { parseNaturalLanguage, type QuickActionType } from '@/tenant/features/accounting/components/journalEntriesQuickActions';

export function createJournalSelectionHandlers(
  filtered: JournalEntry[],
  selectedIds: string[],
  setSelectedIds: Dispatch<SetStateAction<string[]>>,
) {
  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id],
    );
  };

  const toggleAllFiltered = (checked: boolean) => {
    if (checked) setSelectedIds(filtered.map((entry) => entry.id));
    else setSelectedIds([]);
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((entry) => selectedIds.includes(entry.id));

  return { toggleSelected, toggleAllFiltered, allFilteredSelected };
}

export function createJournalNlHandlers(
  nlInput: string,
  setNlInput: Dispatch<SetStateAction<string>>,
  setNlSuggestion: Dispatch<SetStateAction<QuickActionType | null>>,
  setSimpleModal: Dispatch<SetStateAction<{ prefillType: QuickActionType | null } | null>>,
) {
  const handleNlSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const type = parseNaturalLanguage(nlInput);
    if (type) {
      setSimpleModal({ prefillType: type });
      setNlInput('');
      setNlSuggestion(null);
    } else {
      setSimpleModal({ prefillType: null });
    }
  };

  const handleNlChange = (inputValue: string) => {
    setNlInput(inputValue);
    setNlSuggestion(inputValue.length > 3 ? parseNaturalLanguage(inputValue) : null);
  };

  return { handleNlSubmit, handleNlChange };
}

interface JournalEntryActionsRendererDeps {
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  setSelected: Dispatch<SetStateAction<JournalEntry | null>>;
  setModal: Dispatch<SetStateAction<'new' | 'edit' | 'view' | null>>;
  handlePost: (entry: JournalEntry) => void | Promise<void>;
  handleDelete: (id: string) => void | Promise<void>;
  handleReverse: (entry: JournalEntry) => void | Promise<void>;
}

export function createJournalEntryActionsRenderer(deps: JournalEntryActionsRendererDeps) {
  return (entry: JournalEntry): ReactNode => (
    <JournalEntryActions
      entry={entry}
      canWrite={deps.canWrite}
      canDelete={deps.canDelete}
      showDeleted={deps.showDeleted}
      onView={(journalEntry) => {
        deps.setSelected(journalEntry);
        deps.setModal('view');
      }}
      onEdit={(journalEntry) => {
        deps.setSelected(journalEntry);
        deps.setModal('edit');
      }}
      onPost={(journalEntry) => {
        void deps.handlePost(journalEntry);
      }}
      onDelete={(id) => {
        void deps.handleDelete(id);
      }}
      onReverse={(journalEntry) => {
        void deps.handleReverse(journalEntry);
      }}
    />
  );
}
