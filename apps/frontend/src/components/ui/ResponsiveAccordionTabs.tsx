import React, { useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionTabItem {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  /** When set, triggers use React Router Link (e.g. settings sections). */
  href?: string;
}

export interface ResponsiveAccordionTabsProps {
  tabs: readonly AccordionTabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
  /** Desktop layout — module pages use horizontal; settings uses sidebar. */
  desktopLayout?: "horizontal" | "sidebar";
  /** Omit nav chrome when only one tab is available. */
  hideWhenSingle?: boolean;
  /** Clicking the active tab collapses it (empty activeTab). */
  collapsible?: boolean;
  panelIdPrefix?: string;
  className?: string;
}

function TabTrigger({
  tab,
  active,
  panelId,
  onTabChange,
}: {
  tab: AccordionTabItem;
  active: boolean;
  panelId: string;
  onTabChange: (id: string) => void;
}): React.JSX.Element {
  const Icon = tab.icon;
  const className = cn(
    "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors",
    active ? "text-primary" : "text-foreground hover:bg-muted/40",
  );
  const body = (
    <>
      {Icon ? (
        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{tab.label}</span>
        {tab.description ? (
          <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
            {tab.description}
          </span>
        ) : null}
      </span>
      <ChevronDown
        className={cn(
          "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
          active && "rotate-180 text-primary",
        )}
        aria-hidden
      />
    </>
  );

  if (tab.href) {
    return (
      <Link
        to={tab.href}
        aria-expanded={active}
        aria-controls={panelId}
        className={className}
      >
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-expanded={active}
      aria-controls={panelId}
      onClick={() => onTabChange(tab.id)}
      className={className}
    >
      {body}
    </button>
  );
}

/**
 * Responsive tab shell — mobile accordion (content under active heading),
 * desktop horizontal tabs or sidebar nav.
 */
export function ResponsiveAccordionTabs({
  tabs,
  activeTab,
  onTabChange,
  children,
  desktopLayout = "horizontal",
  hideWhenSingle = false,
  collapsible = true,
  panelIdPrefix = "tab-panel",
  className,
}: ResponsiveAccordionTabsProps): React.JSX.Element {
  const sectionRefs = useRef<Partial<Record<string, HTMLElement | null>>>({});
  const prefix = panelIdPrefix;

  const handleTabChange = useCallback(
    (tabId: string) => {
      if (collapsible && activeTab === tabId) {
        onTabChange("");
        return;
      }
      onTabChange(tabId);
    },
    [activeTab, collapsible, onTabChange],
  );

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth >= 1024) return;
    if (!activeTab) return;
    sectionRefs.current[activeTab]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeTab]);

  const panelContent = collapsible && !activeTab ? null : children;

  if (hideWhenSingle && tabs.length <= 1) {
    return <div className={className}>{children}</div>;
  }

  if (tabs.length === 0) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mobile: accordion */}
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

      {/* Desktop: horizontal tabs */}
      {desktopLayout === "horizontal" ? (
        <div className="hidden space-y-4 lg:block">
          <div className="flex gap-0 overflow-x-auto border-b border-border">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              const tabClass = cn(
                "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-[13px] font-semibold transition-all",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              );

              if (tab.href) {
                return (
                  <Link key={tab.id} to={tab.href} className={tabClass}>
                    {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                    {tab.label}
                  </Link>
                );
              }

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={tabClass}
                >
                  {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                  {tab.label}
                </button>
              );
            })}
          </div>
          {panelContent}
        </div>
      ) : (
        <div className="hidden gap-5 lg:flex lg:items-start">
          <nav
            aria-label="Section navigation"
            className="sticky top-[4.75rem] w-[17.5rem] shrink-0 space-y-0.5 rounded-xl border border-border/70 bg-card/70 p-2 shadow-sm backdrop-blur-sm"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              const linkClass = cn(
                "block w-full rounded-lg border px-3 py-2.5 text-left transition-all",
                active
                  ? "border-primary/25 border-l-[3px] border-l-primary bg-primary/5 text-primary shadow-sm"
                  : "border-transparent text-muted-foreground hover:border-border/50 hover:bg-muted/50 hover:text-foreground",
              );

              if (tab.href) {
                return (
                  <Link key={tab.id} to={tab.href} className={linkClass}>
                    <div className="mb-0.5 flex items-center gap-2">
                      {Icon ? (
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                            active ? "bg-primary/15 text-primary" : "bg-muted/80 text-muted-foreground",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden />
                        </span>
                      ) : null}
                      <span className="text-[12.5px] font-semibold">{tab.label}</span>
                    </div>
                    {tab.description ? (
                      <p
                        className={cn(
                          "text-[10.5px] leading-snug text-muted-foreground",
                          Icon && "pl-9",
                          active && "text-primary/80",
                        )}
                      >
                        {tab.description}
                      </p>
                    ) : null}
                  </Link>
                );
              }

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={linkClass}
                >
                  <div className="mb-0.5 flex items-center gap-2">
                    {Icon ? (
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                          active ? "bg-primary/15 text-primary" : "bg-muted/80 text-muted-foreground",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    ) : null}
                    <span className="text-[12.5px] font-semibold">{tab.label}</span>
                  </div>
                  {tab.description ? (
                    <p
                      className={cn(
                        "text-[10.5px] leading-snug text-muted-foreground",
                        Icon && "pl-9",
                        active && "text-primary/80",
                      )}
                    >
                      {tab.description}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </nav>
          <div className="min-w-0 flex-1 rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur-sm lg:p-6">
            {panelContent}
          </div>
        </div>
      )}
    </div>
  );
}
