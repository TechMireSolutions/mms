import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollSurfaceOnChange } from "@/lib/routing/useScrollSurfaceOnChange";

export interface SubTab<K extends string = string> {
  key: K;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

export type SubTabBarVariant = "pill" | "underline" | "enclosed";

export interface SubTabBarProps<K extends string> {
  tabs: readonly SubTab<K>[];
  value: K;
  onChange: (key: K) => void;
  variant?: SubTabBarVariant;
  className?: string;
  children?: React.ReactNode;
  panelIdPrefix?: string;
  /**
   * Reset the page surface when the active sub-tab changes.
   * Disable inside drawers/overlays that should not scroll the page behind them.
   */
  resetScrollOnChange?: boolean;
}

/**
 * Responsive sub-tab navigation. Supports modern underline, segmented pill, and accordion modes.
 */
export const SubTabBar = React.memo(function SubTabBar<K extends string>({
  tabs,
  value,
  onChange,
  variant = "pill",
  className = "",
  children,
  panelIdPrefix = "subtab-panel",
  resetScrollOnChange = true,
}: SubTabBarProps<K>): React.JSX.Element | null {
  const sectionRefs = useRef<Partial<Record<string, HTMLElement | null>>>({});

  useScrollSurfaceOnChange(value, {
    enabled: resetScrollOnChange,
    block: children ? "nearest" : "start",
    resolveMobileTarget: children ? (key) => sectionRefs.current[key] : undefined,
  });

  if (tabs.length <= 1 && !children) {
    return null;
  }

  // Underline variant for modern drawers, headers, and clean panels
  if (variant === "underline") {
    return (
      <div className={cn("w-full space-y-3", className)}>
        <div
          role="tablist"
          aria-orientation="horizontal"
          className="flex w-full items-center gap-1 border-b border-border/40 overflow-x-auto no-scrollbar"
        >
          {tabs.map((tab) => {
            const active = value === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChange(tab.key)}
                className={cn(
                  "group relative flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-t-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  active
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                )}
              >
                {tab.icon && (
                  <tab.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                    )}
                    aria-hidden
                  />
                )}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-bold transition-colors",
                      active
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20",
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
                {active && (
                  <motion.div
                    layoutId={`${panelIdPrefix}-underline`}
                    className="absolute -bottom-px inset-x-0 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>
        {children}
      </div>
    );
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
                    "flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2.5 text-start text-xs font-semibold transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {tab.icon && <tab.icon className="h-3.5 w-3.5" aria-hidden />}
                    <span>{tab.label}</span>
                  </span>
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
          <div
            role="tablist"
            aria-orientation="horizontal"
            className="flex w-fit items-center gap-1 rounded-xl bg-muted/60 p-1 border border-border/40 backdrop-blur-xs"
          >
            {tabs.map((t) => {
              const active = value === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onChange(t.key)}
                  className={cn(
                    "relative flex min-h-9 min-w-9 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    active
                      ? "bg-card text-foreground font-semibold shadow-xs border border-border/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/40",
                  )}
                >
                  {t.icon && (
                    <t.icon
                      className={cn("h-3.5 w-3.5 transition-colors", active ? "text-primary" : "text-muted-foreground")}
                      aria-hidden
                    />
                  )}
                  <span>{t.label}</span>
                  {t.badge !== undefined && (
                    <span
                      className={cn(
                        "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                        active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        role="tablist"
        aria-orientation="vertical"
        className="space-y-1 lg:hidden"
      >
        {tabs.map((tab) => {
          const active = value === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.key)}
              className={cn(
                "flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-start text-xs font-semibold transition-colors",
                active
                  ? "border-primary/20 bg-card text-primary shadow-xs font-bold"
                  : "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="flex min-w-0 items-center gap-1.5">
                {tab.icon && <tab.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                <span className="truncate">{tab.label}</span>
              </span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                    active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="hidden w-fit items-center gap-1 overflow-x-auto rounded-xl bg-muted/60 p-1 border border-border/40 backdrop-blur-xs lg:flex"
      >
        {tabs.map((t) => {
          const active = value === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(t.key)}
              className={cn(
                "relative flex min-h-9 min-w-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                active
                  ? "bg-card text-foreground font-semibold shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40",
              )}
            >
              {t.icon && (
                <t.icon
                  className={cn("h-3.5 w-3.5 transition-colors", active ? "text-primary" : "text-muted-foreground")}
                  aria-hidden
                />
              )}
              <span>{t.label}</span>
              {t.badge !== undefined && (
                <span
                  className={cn(
                    "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                    active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}) as <K extends string>(props: SubTabBarProps<K>) => React.JSX.Element | null;

