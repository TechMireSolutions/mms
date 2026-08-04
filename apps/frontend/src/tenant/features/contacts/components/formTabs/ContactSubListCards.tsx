import React, { ElementType, ReactNode, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardRemoveButton, FieldErrorMessage } from "@/components/ui/FormPrimitives";
import { EmptyState } from "@/components/ui/EmptyState";
import { FORM_CARD } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";

export interface ListFieldCardProps {
  id: string;
  index: number;
  icon: ElementType;
  accentClass?: string;
  iconClass?: string;
  label: string;
  typeSelect?: ReactNode;
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
  onRemove,
  removeLabel,
  children,
}: ListFieldCardProps): JSX.Element {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      style={{ zIndex: 100 - index }}
      className={cn(FORM_CARD, "p-4.5 ps-6 space-y-4")}
    >
      <div className={cn("absolute start-0 top-0 bottom-0 w-1.5 transition-colors", accentClass)} />
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-border/40">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <Icon className={cn("w-4 h-4 shrink-0 transition-colors", iconClass)} />
          <span className="min-w-0 truncate text-xs font-semibold text-foreground/80">
            {label}
          </span>
          {typeSelect}
        </div>
        <CardRemoveButton onClick={onRemove} label={removeLabel} />
      </div>
      {children}
    </motion.div>
  );
}

export function FieldInlineError({ message }: { message?: string }): JSX.Element | null {
  return <FieldErrorMessage message={message} />;
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
}: ContactSubListShellProps): JSX.Element {
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
          variant="ghost"
          onClick={onAdd}
          className="flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors px-0 py-2 justify-start mt-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" aria-hidden />
          <span>{addLabel}</span>
        </Button>
      ) : null}
    </div>
  );
}
