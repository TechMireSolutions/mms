import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SubTab<K extends string = string> {
  key: K;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SubTabBarProps<K extends string> {
  tabs: readonly SubTab<K>[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
  children?: React.ReactNode;
  panelIdPrefix?: string;
}

/**
 * Pill-style segmented control on desktop; accordion under active heading on mobile.
 */
export function SubTabBar<K extends string>({
  tabs,
  value,
  onChange,
  className = "",
  children,
  panelIdPrefix = "subtab-panel",
}: SubTabBarProps<K>): React.JSX.Element {
  const sectionRefs = useRef<Partial<Record<string, HTMLElement | null>>>({});

  useEffect(() => {
    if (!children || typeof window === "undefined" || window.innerWidth >= 1024) return;
    sectionRefs.current[value]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [value, children]);

  if (tabs.length <= 1 && !children) {
    return <></>;
  }

  if (children) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="space-y-2 lg:hidden">
          {tabs.map((tab) => {
            const active = value === tab.key;
            const panelId = `${panelIdPrefix}-${tab.key}`;
            return (
              <section
                key={tab.key}
                ref={(node) => {
                  sectionRefs.current[tab.key] = node;
                }}
                className={cn(
                  "overflow-hidden rounded-lg border transition-colors",
                  active ? "border-primary/20 bg-muted/30" : "border-border/60 bg-muted/10",
                )}
              >
                <button
                  type="button"
                  aria-expanded={active}
                  aria-controls={panelId}
                  onClick={() => onChange(tab.key)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-semibold transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span>{tab.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                      active && "rotate-180 text-primary",
                    )}
                    aria-hidden
                  />
                </button>
                <AnimatePresence initial={false}>
                  {active ? (
                    <motion.div
                      id={panelId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 border-t border-border/50 px-3 py-3">{children}</div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </section>
            );
          })}
        </div>

        <div className="hidden lg:block space-y-3">
          <div className="flex w-fit gap-1 rounded-xl bg-muted p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => onChange(t.key)}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-sm font-semibold transition-all",
                  value === t.key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex w-fit gap-1 rounded-xl bg-muted p-1 max-lg:w-full max-lg:overflow-x-auto", className)}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={cn(
            "whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-semibold transition-all",
            value === t.key
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

