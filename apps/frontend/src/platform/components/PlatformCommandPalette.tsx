import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { usePlatformWorkspaces } from '@/platform/hooks/usePlatformWorkspaces';
import { CommandPaletteModal } from '@/components/ui/CommandPaletteModal';
import { useCommandPaletteSearch } from '@/components/ui/useCommandPaletteSearch';
import {
  PLATFORM_STATIC_COMMANDS,
  buildWorkspaceCommandItems,
  commandItemIsPermitted,
  type PlatformCommandItem,
} from '@/platform/components/platformCommandItems';
import { PlatformCommandResultsList } from '@/platform/components/command/PlatformCommandResultsList';

export interface PlatformCommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function PlatformCommandPalette({ open, onClose }: PlatformCommandPaletteProps): React.JSX.Element | null {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const perms = usePlatformPermissions();
  const { data: workspaces } = usePlatformWorkspaces();

  const allAvailableItems = useMemo(() => {
    const permittedStatic = PLATFORM_STATIC_COMMANDS.filter((item) =>
      commandItemIsPermitted(item, perms),
    );
    const workspaceItems: PlatformCommandItem[] =
      perms.canWorkspaces && workspaces ? buildWorkspaceCommandItems(workspaces) : [];
    return [...permittedStatic, ...workspaceItems];
  }, [perms, workspaces]);

  const handleSelect = useCallback(
    (item: PlatformCommandItem) => {
      onClose();
      navigate(item.path);
    },
    [navigate, onClose],
  );

  const filterItems = useCallback((query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return allAvailableItems;
    return allAvailableItems.filter((item) => {
      const label = item.customLabel ?? (item.labelKey ? t(item.labelKey) : '');
      const subtitle = item.customSubtitle ?? '';
      return (
        label.toLowerCase().includes(q) ||
        subtitle.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [allAvailableItems, t]);

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
        onSelect={(path) => {
          onClose();
          setQuery('');
          navigate(path);
        }}
        onHoverIndex={setSelectedIndex}
      />
    </CommandPaletteModal>
  );
}