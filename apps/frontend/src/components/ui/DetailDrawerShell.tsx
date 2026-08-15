import React, { useId } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type PanInfo, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOverlayBehavior } from "@/hooks/useOverlayBehavior";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
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
 * Standard touch-first responsive drawer shell.
 * Adapts between a bottom sheet on mobile viewports (<640px) and a right-sliding drawer on desktop (≥640px).
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
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const containerRef = useOverlayBehavior<HTMLElement>({ open, onClose });
  const titleId = useId();
  const dragControls = useDragControls();
  
  const slideFromX = isRtl ? "-100%" : "100%";
  const panelTransition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, damping: 28, stiffness: 260 };

  // Motion variants that adapt based on the viewport
  const initial = reducedMotion
    ? false
    : isDesktop
      ? { x: slideFromX, y: 0, opacity: 0 }
      : { x: 0, y: "100%", opacity: 0 };

  const animate = reducedMotion
    ? { opacity: 1 }
    : { x: 0, y: 0, opacity: 1 };

  const exit = reducedMotion
    ? undefined
    : isDesktop
      ? { x: slideFromX, y: 0, opacity: 0 }
      : { x: 0, y: "100%", opacity: 0 };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If the user swipes down fast enough or drags down far enough, close it.
    if (info.velocity.y > 400 || info.offset.y > 100) {
      onClose();
    }
  };

  const dragProps = isDesktop
    ? {}
    : {
        drag: "y" as const,
        dragConstraints: { top: 0, bottom: 0 },
        dragElastic: 0.2,
        onDragEnd: handleDragEnd,
        dragListener: false, // Disables dragging the entire content area
        dragControls,
      };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-end">
          {/* Backdrop */}
          <motion.div
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Drawer content panel: Bottom sheet on mobile, right drawer on sm: desktop */}
          <motion.aside
            ref={containerRef}
            initial={initial}
            animate={animate}
            exit={exit}
            transition={panelTransition}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            {...dragProps}
            className={cn(
              "relative z-10 flex h-full w-full min-w-0 max-w-full flex-col overscroll-contain bg-card/95 text-start shadow-[0_8px_40px_rgb(0,0,0,0.12)] backdrop-blur-2xl border-t sm:border-t-0 sm:border-s border-border/50 max-h-[85vh] sm:max-h-full rounded-t-[1.5rem] sm:rounded-none sm:max-w-md",
              className
            )}
            aria-label={ariaLabel}
          >
            {/* Mobile Drag Handle Indicator */}
            <div 
              className="sm:hidden flex items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={(e) => {
                if (!isDesktop) dragControls.start(e);
              }}
            >
              <div className="h-1.5 w-12 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Sticky Header */}
            <div 
              className="sticky top-0 z-10 px-5 pt-2 sm:pt-4 pb-3 border-b border-border/30 flex-shrink-0 space-y-3 sm:touch-auto touch-none"
              onPointerDown={(e) => {
                // Ensure we don't intercept drag if they are clicking a button (like close)
                if (!isDesktop && !(e.target as HTMLElement).closest('button')) {
                  dragControls.start(e);
                }
              }}
            >
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
                      <span className="text-[11px] text-muted-foreground/80 uppercase tracking-wider font-bold block truncate mt-0.5">
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
                    className="h-9 w-9 sm:h-11 sm:w-11 rounded-full sm:rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-none"
                    aria-label={t("common.close")}
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
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
              <div className="px-5 py-4 border-t border-border/30 bg-muted/20 flex items-center justify-between flex-shrink-0">
                {footer}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
