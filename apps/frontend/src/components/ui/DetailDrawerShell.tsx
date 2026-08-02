import React, { useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOverlayBehavior } from "@/hooks/useOverlayBehavior";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

export interface DetailDrawerShellProps {
  open?: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  headerActions?: React.ReactNode;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  ariaLabel?: string;
  className?: string;
}

/**
 * Standard slide-over drawer shell for entity/contact detailed profiles.
 * Manages spring motion animations, standard layouts, backdrop overlays, and headers.
 */
export function DetailDrawerShell({
  open = true,
  onClose,
  title,
  subtitle,
  icon: Icon,
  headerActions,
  headerExtra,
  footer,
  children,
  ariaLabel,
  className,
}: DetailDrawerShellProps): React.JSX.Element {
  const { t, isRtl } = useTranslation();
  const reducedMotion = useReducedMotion();
  const containerRef = useOverlayBehavior<HTMLElement>({ open, onClose });
  const titleId = useId();
  const slideFrom = isRtl ? "-100%" : "100%";
  const panelTransition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, damping: 28, stiffness: 260 };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Backdrop */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Drawer content panel */}
          <motion.aside
            ref={containerRef}
            initial={reducedMotion ? false : { x: slideFrom, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reducedMotion ? undefined : { x: slideFrom, opacity: 0 }}
            transition={panelTransition}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              "relative z-10 flex h-full w-full min-w-0 max-w-full flex-col overscroll-contain border-s border-border/80 bg-card/90 text-start shadow-2xl backdrop-blur-xl sm:max-w-sm",
              className
            )}
            aria-label={ariaLabel}
          >
            {/* Sticky Header */}
            <div className="sticky top-0 bg-card/75 backdrop-blur-md z-10 px-5 pt-4 pb-3 border-b border-border/40 flex-shrink-0 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {Icon && (
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 id={titleId} className="text-sm font-bold text-foreground leading-tight truncate">
                      {title}
                    </h2>
                    {subtitle && (
                      <span className="text-xs text-muted-foreground uppercase font-semibold block truncate mt-0.5">
                        {subtitle}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {headerActions}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="min-h-11 min-w-11 h-11 w-11 rounded-lg hover:bg-muted text-muted-foreground transition-colors shadow-none"
                    aria-label={t("common.close")}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {headerExtra}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-6">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-5 py-4 border-t border-border bg-muted/10 flex items-center justify-between flex-shrink-0">
                {footer}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
