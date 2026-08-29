import React, { ElementType, ReactNode, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardRemoveButton } from "@/components/ui/FormPrimitives";
import { EmptyState } from "@/components/ui/EmptyState";
import { FORM_CARD } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { CARD_STRIPE_BASE, CARD_STRIPE_INSET } from "@/lib/semanticTone";

export interface ListFieldCardProps {
  id: string;
  index: number;
  icon?: ElementType;
  accentClass?: string;
  iconClass?: string;
  label?: string;
  typeSelect?: ReactNode;
  headerExtras?: ReactNode;
  onRemove: () => void;
  removeLabel: string;
  children: ReactNode;
}

export function ListFieldCard({
  id,
  index,
  icon: Icon,
  accentClass = "bg-primary/60 group-hover:bg-primary",
  iconClass = "text-primary/70 group-hover:text-primary",
  label,
  typeSelect,
  headerExtras,
  onRemove,
  removeLabel,
  children,
}: ListFieldCardProps): React.JSX.Element {
  const hasHeaderContent = Boolean(Icon || label || typeSelect || headerExtras);

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      style={{ zIndex: 100 - index }}
      className={cn(FORM_CARD, "p-4.5 space-y-4", CARD_STRIPE_INSET)}
    >
      <div aria-hidden="true" className={cn(CARD_STRIPE_BASE, "transition-colors", accentClass)} />
      {hasHeaderContent ? (
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-border/50">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {Icon ? (
              <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted/70", iconClass)}>
                <Icon className="w-3.5 h-3.5" aria-hidden />
              </div>
            ) : null}
            {label ? (
              <span className="min-w-0 truncate text-xs font-semibold text-foreground/80">
                {label}
              </span>
            ) : null}
            {typeSelect}
            {headerExtras}
          </div>
          <CardRemoveButton onClick={onRemove} label={removeLabel} />
        </div>
      ) : (
        <div className="flex justify-end -mb-2">
          <CardRemoveButton onClick={onRemove} label={removeLabel} />
        </div>
      )}
      {children}
    </motion.div>
  );
}

/** True when any Setup field for the sub-list is enabled or custom fields exist. */
export function resolveSubListAllowAdd(
  enabledFieldFlags: boolean[],
  customFieldsLength: number = 0,
): boolean {
  return enabledFieldFlags.some(Boolean) || customFieldsLength > 0;
}

export interface ContactSubListShellProps {
  isEmpty: boolean;
  emptyIcon: React.ComponentType<{ className?: string }>;
  emptyMessage: string;
  addLabel: string;
  onAdd: () => void;
  /** Idempotent seed when the list is empty (zero-click first row). */
  onEnsureRow: () => void;
  /** When false, hide add/ensure (e.g. all Setup fields for the tab are disabled). */
  allowAdd?: boolean;
  children: ReactNode;
}

/** Shared empty-state + add-row chrome for contact form sub-list tabs. */
export function ContactSubListShell({
  isEmpty,
  emptyIcon,
  emptyMessage,
  addLabel,
  onAdd,
  onEnsureRow,
  allowAdd = true,
  children,
}: ContactSubListShellProps): React.JSX.Element {
  useEffect(() => {
    if (!allowAdd || !isEmpty) return;
    onEnsureRow();
  }, [allowAdd, isEmpty, onEnsureRow]);

  return (
    <div className="space-y-3 text-start">
      {isEmpty ? (
        <EmptyState variant="dashed" icon={emptyIcon} title={emptyMessage} compact />
      ) : null}
      <div className="space-y-3">{children}</div>
      {allowAdd ? (
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-primary/5 font-semibold text-xs py-2.5 rounded-xl transition-all min-h-11 text-primary cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden />
          <span>{addLabel}</span>
        </Button>
      ) : null}
    </div>
  );
}
