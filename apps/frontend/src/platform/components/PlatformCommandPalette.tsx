import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AppTranslationKey } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { usePlatformWorkspaces } from '@/platform/hooks/usePlatformWorkspaces';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { OVERLAY_BACKDROP } from '@/components/ui/formStyles';
import {
  PLATFORM_STATIC_COMMANDS,
  buildWorkspaceCommandItems,
  commandItemIsPermitted,
  type PlatformCommandItem,
} from '@/platform/components/platformCommandItems';

export interface PlatformCommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function PlatformCommandPalette({ open, onClose }: PlatformCommandPaletteProps): React.JSX.Element | null {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
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

  const handleKeyDown = ((e: React.KeyboardEvent<HTMLInputElement>) => {
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
    });

  if (!open) return null;

  return (
    <AnimatePresence>
      <div
        className={cn("fixed inset-0 z-modal flex items-start justify-center pt-16 px-4", OVERLAY_BACKDROP)}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={t('platform.openSearchAria')}
      >
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl surface-glass text-start"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Bar Header */}
          <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5">
            <Search className="h-5 w-5 shrink-0 text-primary pointer-events-none" aria-hidden="true" />
            <Input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('platform.searchConsolePlaceholder')}
              className="flex-1 bg-transparent text-sm font-semibold border-0 shadow-none focus-visible:ring-0 px-0 h-9"
              aria-label={t('platform.searchConsolePlaceholder')}
              role="combobox"
              aria-expanded={open}
              aria-controls="platform-command-listbox"
              aria-activedescendant={
                filteredItems[selectedIndex] ? `platform-cmd-item-${filteredItems[selectedIndex].id}` : undefined
              }
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-2xs font-mono font-bold text-muted-foreground select-none">
              ESC
            </kbd>
          </div>

          {/* Screen reader live announcement */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {filteredItems.length === 0
              ? t('platform.noMatchingConsolePages', { query })
              : `${filteredItems.length} results available.`}
          </div>

          {/* Search Results List */}
          <div className="max-h-80 overflow-y-auto p-2" role="listbox" id="platform-command-listbox">
            {filteredItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm font-semibold text-muted-foreground">
                {t('platform.noMatchingConsolePages', { query })}
              </div>
            ) : (
              Object.entries(
                filteredItems.reduce<Record<string, PlatformCommandItem[]>>((acc, item) => {
                  (acc[item.category] ??= []).push(item);
                  return acc;
                }, {}),
              ).map(([categoryKey, items]) => (
                <div key={categoryKey} className="mb-1">
                  <div className="px-3.5 pt-3 pb-1 text-3xs font-black uppercase tracking-widest text-muted-foreground select-none">
                    {t(categoryKey as AppTranslationKey)}
                  </div>
                  {items.map((item) => {
                    const index = filteredItems.indexOf(item);
                    const Icon = item.icon;
                    const isSelected = index === selectedIndex;
                    const translatedLabel = item.customLabel ?? (item.labelKey ? t(item.labelKey) : '');
                    return (
                      <button
                        key={item.id}
                        id={`platform-cmd-item-${item.id}`}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(item.path)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-start text-sm transition-all cursor-pointer min-h-11',
                          isSelected
                            ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                            : 'text-foreground hover:bg-muted/70 font-semibold',
                        )}
                      >
                        <Icon className={cn('h-4.5 w-4.5 shrink-0', isSelected ? 'text-primary-foreground' : 'text-primary')} aria-hidden="true" />
                        <div className="flex-1 min-w-0 flex flex-col">
                          <span className="truncate">{translatedLabel}</span>
                          {item.customSubtitle && (
                            <span className={cn('text-2xs font-mono truncate', isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                              {item.customSubtitle}
                            </span>
                          )}
                        </div>
                        <span className={cn('text-xs opacity-80 font-mono', isSelected ? 'text-primary-foreground' : 'text-muted-foreground')}>
                          {item.path}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer Shortcuts Bar */}
          <div className="border-t border-border/50 px-4 py-2 bg-muted/30 flex items-center justify-between text-3xs text-muted-foreground font-medium select-none">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-background px-1 py-0.2 font-mono text-2xs">↑</kbd>
                <kbd className="rounded border border-border bg-background px-1 py-0.2 font-mono text-2xs">↓</kbd>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-background px-1 py-0.2 font-mono text-2xs">↵</kbd>
              </span>
            </div>
            <span className="hidden sm:inline font-semibold">{t('platform.consoleTitle')}</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}