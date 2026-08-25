import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Building2,
  BarChart3,
  Activity,
  Server,
  ShieldCheck,
  User,
  PlusCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AppTranslationKey } from '@mms/shared';
import { ROUTES } from '@/lib/config/routes';
import { useTranslation } from '@/hooks/useTranslation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { OVERLAY_BACKDROP } from '@/components/ui/formStyles';

export interface PlatformCommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface PlatformCommandItem {
  id: string;
  labelKey: AppTranslationKey;
  category: 'Navigation' | 'Actions';
  path: string;
  icon: React.ElementType;
  keywords: string[];
}

const PLATFORM_COMMAND_ITEMS: PlatformCommandItem[] = [
  {
    id: 'dashboard',
    labelKey: 'dashboard.title',
    category: 'Navigation',
    path: ROUTES.platformDashboard,
    icon: LayoutDashboard,
    keywords: ['home', 'overview', 'metrics', 'stats', 'kpi', 'dashboard'],
  },
  {
    id: 'workspaces',
    labelKey: 'platform.manageMadrasas',
    category: 'Navigation',
    path: ROUTES.platformWorkspaces,
    icon: Building2,
    keywords: ['madrasas', 'workspaces', 'tenants', 'subdomains', 'instances'],
  },
  {
    id: 'reports',
    labelKey: 'module.reports',
    category: 'Navigation',
    path: ROUTES.platformReports,
    icon: BarChart3,
    keywords: ['analytics', 'reports', 'charts', 'distribution', 'graphs'],
  },
  {
    id: 'activity-logs',
    labelKey: 'platform.activityLogsTitle',
    category: 'Navigation',
    path: ROUTES.platformActivityLogs,
    icon: Activity,
    keywords: ['logs', 'audit', 'events', 'history', 'activity'],
  },
  {
    id: 'system',
    labelKey: 'platform.systemMaintenance',
    category: 'Navigation',
    path: ROUTES.platformSystem,
    icon: Server,
    keywords: ['system', 'health', 'database', 'postgres', 'rls', 'maintenance'],
  },
  {
    id: 'admins',
    labelKey: 'platform.adminsTitle',
    category: 'Navigation',
    path: ROUTES.platformAdmins,
    icon: ShieldCheck,
    keywords: ['admins', 'super_user', 'operators', 'users', 'access', 'rbac', 'permissions'],
  },
  {
    id: 'account',
    labelKey: 'platform.myAccount',
    category: 'Navigation',
    path: ROUTES.platformAccount,
    icon: User,
    keywords: ['account', 'profile', 'session', 'email', 'me', 'password', 'security'],
  },
  {
    id: 'migrations',
    labelKey: 'platform.profileMigrateRestart',
    category: 'Actions',
    path: `${ROUTES.platformSystem}?tab=system`,
    icon: Server,
    keywords: ['migrations', 'drizzle', 'database', 'schema', 'reset', 'maintenance'],
  },
  {
    id: 'onboard-madrasa',
    labelKey: 'auth.createMadrasa',
    category: 'Actions',
    path: ROUTES.onboarding,
    icon: PlusCircle,
    keywords: ['create', 'add', 'onboard', 'provision', 'new madrasa', 'tenant'],
  },
];

export function PlatformCommandPalette({ open, onClose }: PlatformCommandPaletteProps): React.JSX.Element | null {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PLATFORM_COMMAND_ITEMS;
    return PLATFORM_COMMAND_ITEMS.filter((item) => {
      const translatedLabel = t(item.labelKey);
      return (
        translatedLabel.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [query, t]);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
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
    },
    [filteredItems, selectedIndex, handleSelect, onClose],
  );

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

          {/* Search Results List */}
          <div className="max-h-80 overflow-y-auto p-2" role="listbox" id="platform-command-listbox">
            {filteredItems.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm font-semibold text-muted-foreground">
                {t('platform.noMatchingConsolePages', { query })}
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const Icon = item.icon;
                const isSelected = index === selectedIndex;
                const translatedLabel = t(item.labelKey);

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
                    <span className="flex-1 truncate">{translatedLabel}</span>
                    <span className={cn('text-xs opacity-80 font-mono', isSelected ? 'text-primary-foreground' : 'text-muted-foreground')}>
                      {item.path}
                    </span>
                  </button>
                );
              })
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
