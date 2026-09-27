import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { usePlatformWorkspaces } from '@/platform/hooks/usePlatformWorkspaces';
import { CommandPaletteModal } from '@/components/ui/CommandPaletteModal';
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
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const perms = usePlatformPermissions();
  const { data: workspaces } = usePlatformWorkspaces();

  const allAvailableItems = (() => {
    // 1. Filter static items by user permissions
    const permittedStatic = PLATFORM_STATIC_COMMANDS.filter((item) =>
      commandItemIsPermitted(item, perms),
    );

    // 2. Add dynamic workspace items if permitted
    const workspaceItems: PlatformCommandItem[] =
      perms.canWorkspaces && workspaces ? buildWorkspaceCommandItems(workspaces) : [];

    return [...permittedStatic, ...workspaceItems];
  })();

  const filteredItems = (() => {
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
  })();

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = useCallback(
    (path: string) => {
      onClose();
      setQuery('');
      navigate(path);
    },
    [navigate, onClose],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredItems.length > 0 ? (prev - 1 + filteredItems.length) % filteredItems.length : 0,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex].path);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

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
        onSelect={handleSelect}
        onHoverIndex={setSelectedIndex}
      />
    </CommandPaletteModal>
  );
}