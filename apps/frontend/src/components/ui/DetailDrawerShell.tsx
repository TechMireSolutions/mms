import React, { useId, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type PanInfo, useDragControls } from "framer-motion";
import { useOverlayBehavior } from "@/hooks/useOverlayBehavior";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";
import { OVERLAY_BACKDROP } from "@/components/ui/formStyles";
import { DetailDrawerHeader } from "./DetailDrawerHeader";

export type DetailDrawerSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

const SIZE_MAP: Record<DetailDrawerSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  full: "sm:max-w-4xl",
};

export interface DetailDrawerShellProps {
  open?: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  size?: DetailDrawerSize;
  headerActions?: React.ReactNode;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  ariaLabel?: string;
  className?: string;
  contentClassName?: string;
}

/**
 * Standard touch-first responsive drawer shell.
 * Adapts between a bottom sheet on mobile viewports (<640px) and a right-sliding drawer on desktop (≥640px).
 */
export const DetailDrawerShell = (function DetailDrawerShell({
  open = true,
  onClose,
  title,
  subtitle,
  badge,
  icon: Icon,
  size = "md",
  headerActions,
  headerExtra,
  footer,
  children,
  ariaLabel,
  className,
  contentClassName,
}: DetailDrawerShellProps): React.JSX.Element | null {
  const { t, isRtl } = useTranslation();
  const reducedMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const containerRef = useOverlayBehavior<HTMLElement>({ open, onClose });
  const titleId = useId();
  const dragControls = useDragControls();
  
  const slideFromX = isRtl ? "-100%" : "100%";

  const panelTransition = (() => reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, damping: 28, stiffness: 260 })();

  // Motion variants that adapt based on the viewport
  const initial = (() => reducedMotion
    ? false
    : isDesktop
      ? { x: slideFromX, y: 0, opacity: 0 }
      : { x: 0, y: "100%", opacity: 0 })();

  const animate = (() => reducedMotion
    ? { opacity: 1 }
    : { x: 0, y: 0, opacity: 1 })();

  const exit = (() => reducedMotion
    ? { opacity: 0 }
    : isDesktop
      ? { x: slideFromX, y: 0, opacity: 0 }
      : { x: 0, y: "100%", opacity: 0 })();

  const handleDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // If the user swipes down fast enough or drags down far enough, close it.
    if (info.velocity.y > 400 || info.offset.y > 100) {
      onClose();
    }
  }, [onClose]);

  const dragProps = (() => isDesktop
    ? {}
    : {
        drag: "y" as const,
        dragConstraints: { top: 0, bottom: 0 },
        dragElastic: { top: 0, bottom: 0.6 },
        onDragEnd: handleDragEnd,
        dragListener: false, // Disables dragging the entire content area
        dragControls,
      })();

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-modal flex items-end sm:items-center justify-end">
          {/* Backdrop */}
          <motion.div
            aria-hidden="true"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className={cn("absolute inset-0", OVERLAY_BACKDROP)}
            data-overlay-backdrop
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
            aria-labelledby={ariaLabel ? undefined : titleId}
            aria-label={ariaLabel}
            {...dragProps}
            style={{
              transform: "translate3d(0, 0, 0)",
              willChange: "transform, opacity",
            }}
            className={cn(
              "relative z-elevated flex h-full w-full min-w-0 max-w-full flex-col overscroll-contain bg-card text-start shadow-drawer border-t sm:border-t-0 sm:border-s border-foreground/12 max-h-drawer sm:max-h-full rounded-t-3xl sm:rounded-none",
              SIZE_MAP[size],
              className
            )}
          >
            {/* Mobile Drag Handle Indicator */}
            <div 
              className="sm:hidden flex items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none min-h-5"
              aria-hidden="true"
              onPointerDown={(e) => {
                if (!isDesktop) dragControls.start(e);
              }}
            >
              <div className="h-1.5 w-12 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Sticky Header */}
            <DetailDrawerHeader
              titleId={titleId}
              title={title}
              subtitle={subtitle}
              badge={badge}
              icon={Icon}
              headerActions={headerActions}
              headerExtra={headerExtra}
              onClose={onClose}
              isDesktop={isDesktop}
              onPointerDragStart={(e) => dragControls.start(e)}
            />

            {/* Content Area */}
            <div className={cn("flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-6", contentClassName)}>
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
});
