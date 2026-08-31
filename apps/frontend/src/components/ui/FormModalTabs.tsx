import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { SubTab } from '@/components/ui/SubTabBar';
import { cn } from '@/lib/utils';

interface FormModalTabsProps<K extends string = string> {
  tabs: readonly SubTab<K>[];
  activeTab: K;
  onTabChange: (key: K) => void;
  dir?: 'ltr' | 'rtl';
  children: React.ReactNode;
}

/**
 * Form tabs layout tracks the FormModal container width (`@container`), not the
 * viewport — so half-desktop and full-desktop keep the same chrome while the
 * dialog stays max-w-2xl.
 */
export const FormModalTabs = (function FormModalTabs<K extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  dir,
  children,
}: FormModalTabsProps<K>): React.JSX.Element {
  const tabContentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!tabContentRef.current) return;
      const firstInput = tabContentRef.current.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="combobox"]:not([aria-disabled="true"])',
      );
      if (firstInput && document.activeElement !== firstInput) {
        firstInput.focus({ preventScroll: true });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [activeTab]);

  return (
    <TabsPrimitive.Root
      value={activeTab}
      onValueChange={(val) => onTabChange(val as K)}
      orientation="vertical"
      dir={dir}
      className="flex h-full flex-col items-stretch gap-6 @md:flex-row"
    >
      <TabsPrimitive.List className="flex h-auto w-full shrink-0 flex-row gap-0.5 overflow-x-auto rounded-xl border border-border bg-muted/20 p-1 @md:w-auto @md:min-w-tab-list @md:flex-col @md:gap-1 @md:overflow-x-visible @md:border-e @md:border-s-0 @md:border-t-0 @md:border-b-0 @md:pe-4">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          const Icon = tab.icon;
          const accessibleLabel = tab.badge !== undefined ? `${tab.label} (${tab.badge})` : tab.label;
          return (
            <button
              type="button"
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              aria-label={accessibleLabel}
              title={tab.label}
              aria-selected={active}
              role="tab"
              className={cn(
                "relative flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 @md:w-full @md:flex-initial @md:justify-start @md:gap-2 @md:whitespace-nowrap @md:px-3.5",
                active
                  ? "border border-border/80 bg-card font-bold text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              {Icon && <Icon className="h-4 w-4 flex-shrink-0 @md:h-3.5 @md:w-3.5" aria-hidden />}
              <span className="hidden @md:inline">{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-1 end-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs font-extrabold transition-colors @md:static @md:ms-auto @md:h-auto @md:min-w-0 @md:px-1.5 @md:py-0.5",
                    tab.tone === "destructive"
                      ? "bg-destructive text-destructive-foreground"
                      : active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </TabsPrimitive.List>

      <div ref={tabContentRef} className="min-w-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={String(activeTab)}
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.13 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </TabsPrimitive.Root>
  );
}) as <K extends string = string>(props: FormModalTabsProps<K>) => React.JSX.Element;

