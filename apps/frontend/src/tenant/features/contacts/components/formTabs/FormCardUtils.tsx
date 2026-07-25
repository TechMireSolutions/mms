import React, { ElementType, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CardRemoveButton } from "@/components/ui/FormPrimitives";
import { FORM_CARD } from "@/components/ui/formStyles";

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
      <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <Icon className={cn("w-4 h-4 transition-colors", iconClass)} />
          <span className="text-xs font-semibold text-foreground/80">
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

export interface EmptyListCardProps {
  icon: ElementType;
  message: string;
}

export function EmptyListCard({ icon: Icon, message }: EmptyListCardProps): JSX.Element {
  return (
    <div className="text-center py-8 border border-dashed border-border/80 rounded-2xl bg-muted/5 backdrop-blur-sm">
      <Icon className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
