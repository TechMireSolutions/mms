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

export function FormModalTabs<K extends string = string>({
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
      className="flex flex-col md:flex-row gap-6 h-full items-stretch"
    >
      <TabsPrimitive.List className="flex flex-row md:flex-col shrink-0 h-auto w-full md:w-auto md:min-w-[11.25rem] bg-muted/20 p-1 rounded-xl gap-0.5 md:gap-1 border border-border overflow-x-auto md:overflow-x-visible md:border-e md:border-t-0 md:border-b-0 md:border-s-0 md:pe-4">
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
                "relative flex items-center justify-center md:justify-start gap-1.5 md:gap-2 rounded-lg px-2 py-2.5 md:px-3.5 text-xs font-semibold transition-all flex-1 md:flex-initial md:w-full min-h-11 md:whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                active
                  ? "bg-card text-foreground shadow-sm border border-border/80 font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              {Icon && <Icon className="w-4 h-4 md:w-3.5 md:h-3.5 flex-shrink-0" aria-hidden />}
              <span className="hidden md:inline">{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  aria-hidden
                  className={cn(
                    "inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-xs font-extrabold transition-colors md:ms-auto md:min-w-0 md:h-auto md:px-1.5 md:py-0.5",
                    "absolute top-1 end-1 md:static",
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </TabsPrimitive.List>

      <div ref={tabContentRef} className="flex-1 min-w-0 overflow-y-auto">
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
}
