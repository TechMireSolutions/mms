import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useOverlayBehavior } from "@/hooks/useOverlayBehavior";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  size?: "sm" | "md" | "lg" | "xl";
  /** Extra block below the title row (e.g. progress bar). */
  headerExtra?: React.ReactNode;
  /** Custom action elements rendered in the header (e.g. builder switch). */
  headerActions?: React.ReactNode;
  /** Applied to the dialog panel (e.g. fixed height for tabbed forms). */
  panelClassName?: string;
  footer?: React.ReactNode;
  /** Raise above other modals (nested dialogs). */
  priority?: boolean;
  children: React.ReactNode;
}

const SIZE = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

/**
 * Modal — unified overlay dialog.
 *
 * @param {ModalProps} props - The component props.
 * @returns {React.ReactElement} The rendered Modal component.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  size = "md",
  headerExtra,
  headerActions,
  panelClassName,
  footer,
  priority = false,
  children,
}: ModalProps): React.ReactElement {
  const { t } = useTranslation();
  const containerRef = useOverlayBehavior<HTMLDivElement>({ open, onClose });
  const titleId = React.useId();

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={cn("fixed inset-0 flex items-center justify-center p-3 sm:p-4", priority ? "z-[60]" : "z-50")}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              "relative bg-card/90 rounded-2xl border border-border/80 shadow-2xl w-full z-10 max-h-[90vh] flex flex-col backdrop-blur-xl min-w-0",
              SIZE[size],
              panelClassName
            )}
          >
            {/* Header */}
            <div className="flex-shrink-0 border-b border-border/40 px-5 py-4 bg-muted/5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  {Icon && (
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 id={titleId} className="text-sm font-bold text-foreground leading-tight truncate">{title}</h3>
                    {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {headerActions}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    aria-label={t("common.close")}
                    className="min-h-11 min-w-11 h-11 w-11 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-none"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {headerExtra ? <div className="mt-3">{headerExtra}</div> : null}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 min-h-0">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-5 py-4 border-t border-border flex justify-end gap-2.5 flex-shrink-0 bg-muted/20">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
