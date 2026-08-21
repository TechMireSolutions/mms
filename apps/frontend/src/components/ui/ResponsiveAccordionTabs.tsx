import React, { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useScrollSurfaceOnChange } from "@/lib/routing/useScrollSurfaceOnChange";
import { TabTrigger } from "@/components/ui/ResponsiveAccordionTabTrigger";
import { ResponsiveAccordionTabsDesktop } from "@/components/ui/ResponsiveAccordionTabsDesktop";
import type { ResponsiveAccordionTabsProps } from "@/components/ui/ResponsiveAccordionTabsTypes";

export type { AccordionTabItem, ResponsiveAccordionTabsProps } from "@/components/ui/ResponsiveAccordionTabsTypes";

/**
 * Responsive tab shell — mobile accordion (content under active heading),
 * desktop horizontal tabs or sidebar nav.
 */
export const ResponsiveAccordionTabs = React.memo(function ResponsiveAccordionTabs({
  tabs,
  activeTab,
  onTabChange,
  children,
  isDirty = false,
  onSave,
  desktopLayout = "horizontal",
  hideWhenSingle = false,
  collapsible = true,
  panelIdPrefix = "tab-panel",
  className,
}: ResponsiveAccordionTabsProps): React.JSX.Element {
  const { t } = useTranslation();
  const sectionRefs = useRef<Partial<Record<string, HTMLElement | null>>>({});
  const prefix = panelIdPrefix;

  const handleTabChange = useCallback(
    async (tabId: string) => {
      if (collapsible && activeTab === tabId) {
        onTabChange("");
        return;
      }
      if (tabId === activeTab) return;
      if (isDirty && onSave) {
        try {
          const res = await onSave();
          if (res === false) return;
        } catch {
          return;
        }
      }
      onTabChange(tabId);
    },
    [activeTab, collapsible, isDirty, onSave, onTabChange],
  );

  useScrollSurfaceOnChange(activeTab, {
    resolveMobileTarget: (key) => sectionRefs.current[key],
  });

  const panelContent = collapsible && !activeTab ? null : children;

  if (hideWhenSingle && tabs.length <= 1) {
    return <div className={className}>{children}</div>;
  }

  if (tabs.length === 0) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-3 lg:hidden">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          const panelId = `${prefix}-${tab.id}`;

          return (
            <section
              key={tab.id}
              ref={(node) => {
                sectionRefs.current[tab.id] = node;
              }}
              className={cn(
                "overflow-hidden rounded-xl border transition-colors",
                active
                  ? "border-primary/30 bg-card shadow-md ring-1 ring-primary/10"
                  : "border-border/70 bg-card/60 hover:border-border hover:bg-card/80",
              )}
            >
              <TabTrigger
                tab={tab}
                active={active}
                panelId={panelId}
                onTabChange={handleTabChange}
              />

              <AnimatePresence initial={false}>
                {active ? (
                  <motion.div
                    id={panelId}
                    key={tab.id}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 border-t border-border/70 px-3 py-4 sm:px-4">
                      {children}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </section>
          );
        })}
      </div>

      <ResponsiveAccordionTabsDesktop
        tabs={tabs}
        activeTab={activeTab}
        desktopLayout={desktopLayout}
        panelContent={panelContent}
        onTabChange={handleTabChange}
        sectionAriaLabel={t("nav.sectionAria")}
      />
    </div>
  );
});

