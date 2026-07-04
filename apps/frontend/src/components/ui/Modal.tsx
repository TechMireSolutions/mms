import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useFocusTrap } from "@/hooks/useFocusTrap";

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
  useBodyScrollLock(open);
  const containerRef = useFocusTrap<HTMLDivElement>(open);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className={`fixed inset-0 flex items-center justify-center p-4 ${priority ? "z-[60]" : "z-50"}`}>
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
            className={`relative bg-card/90 rounded-2xl border border-border/80 shadow-2xl w-full ${SIZE[size]} z-10 max-h-[90vh] flex flex-col backdrop-blur-xl ${panelClassName ?? ""}`}
          >
            {/* Header */}
            <div className="flex-shrink-0 border-b border-border/40 px-5 py-4 bg-muted/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {Icon && (
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div>
                    <h3 id={titleId} className="text-[14px] font-bold text-foreground leading-tight">{title}</h3>
                    {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {headerActions}
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
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
    </AnimatePresence>
  );
}
