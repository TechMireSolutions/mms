import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { CommandPaletteModal } from '@/components/ui/CommandPaletteModal';
import { useCommandPaletteSearch } from '@/components/ui/useCommandPaletteSearch';
import type { PlatformCommandItem } from '@/platform/components/platformCommandItems';
import { PlatformCommandResultsList } from '@/platform/components/command/PlatformCommandResultsList';
import { useOmniCommandRegistry } from '@/platform/components/command/useOmniCommandRegistry';

export interface PlatformCommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenAi?: () => void;
}

export function PlatformCommandPalette({ open, onClose, onOpenAi }: PlatformCommandPaletteProps): React.JSX.Element | null {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { filterItems, recordRecent } = useOmniCommandRegistry();

  const handleSelect = useCallback(
    (item: PlatformCommandItem) => {
      onClose();
      if (item.id === 'ai-copilot') {
        onOpenAi?.();
        return;
      }
      if (item.customSubtitle && (item.category === 'platform.manageMadrasas' || item.category === 'platform.commandCategory.recent')) {
        recordRecent({
          subdomain: item.customSubtitle,
          madrasaName: item.customLabel ?? item.customSubtitle,
        });
      }
      if (item.perform) {
        void item.perform();
      } else {
        navigate(item.path);
      }
    },
    [navigate, onClose, onOpenAi, recordRecent],
  );

  const {
    query,
    setQuery,
    filteredItems,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
  } = useCommandPaletteSearch<PlatformCommandItem>({
    filterItems,
    onSelect: handleSelect,
    onClose,
  });

  const screenReaderAnnouncement =
    filteredItems.length === 0
      ? t('platform.noMatchingConsolePages', { query })
      : t('platform.searchResultsCount', { count: String(filteredItems.length) });

  return (
    <CommandPaletteModal
      open={open}
      onClose={onClose}
      ariaLabel={t('platform.openSearchAria')}
      searchPlaceholder={t('platform.searchConsolePlaceholder')}
      query={query}
      onQueryChange={setQuery}
      onKeyDown={handleKeyDown}
      screenReaderAnnouncement={screenReaderAnnouncement}
      listboxId="platform-command-listbox"
      activeDescendantId={
        filteredItems[selectedIndex] ? `platform-cmd-item-${filteredItems[selectedIndex].id}` : undefined
      }
      footerTitle={t('platform.consoleTitle')}
      dialogClassName="rounded-2xl text-start"
    >
      <PlatformCommandResultsList
        filteredItems={filteredItems}
        selectedIndex={selectedIndex}
        query={query}
        onSelect={(_path, item) => {
          if (item) {
            handleSelect(item);
          } else {
            onClose();
            setQuery('');
            navigate(_path);
          }
        }}
        onHoverIndex={setSelectedIndex}
      />
    </CommandPaletteModal>
  );
}