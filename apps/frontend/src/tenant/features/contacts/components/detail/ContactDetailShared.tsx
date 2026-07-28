import { Tag, LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyBtn } from "@/components/ui/CopyBtn";
import { COLLECTION_CONTAINER_CLASS, ICON_MAP } from "./contactDetailStyles";

export interface CollectionRowItemProps {
  label: string;
  value: string;
  copyable?: boolean;
  actionHref?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  actionTitle?: string;
  actionColorClass?: string;
  external?: boolean;
}

export function CollectionRowItem({
  label,
  value,
  copyable = true,
  actionHref,
  onAction,
  actionIcon: ActionIcon,
  actionTitle,
  actionColorClass = "text-primary hover:bg-primary/10",
  external = false,
}: CollectionRowItemProps): JSX.Element {
  return (
    <div className="p-3 border-b border-border/50 last:border-b-0 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">
            {label}
          </span>
        </div>
        <span className="font-semibold text-xs text-foreground block leading-relaxed truncate">{value}</span>
      </div>
      {value && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {copyable && (
            <CopyBtn
              text={value}
              showToast
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground p-0 flex items-center justify-center opacity-100"
            />
          )}
          {onAction && ActionIcon ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onAction}
              aria-label={actionTitle || value}
              className={`h-8 w-8 rounded-lg flex items-center justify-center shadow-none ${actionColorClass}`}
            >
              <ActionIcon className="w-3.5 h-3.5" />
            </Button>
          ) : actionHref && ActionIcon ? (
            <a
              href={actionHref}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              aria-label={actionTitle || value}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${actionColorClass}`}
            >
              <ActionIcon className="w-3.5 h-3.5" />
            </a>
          ) : null}
        </div>
      )}
    </div>
  );
}

export interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
}

export function DetailSection({ title, children }: DetailSectionProps): JSX.Element {
  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ps-1">{title}</h4>
      <Card className={COLLECTION_CONTAINER_CLASS}>{children}</Card>
    </div>
  );
}

export interface FieldGroupCardProps {
  group: string;
  fields: { key: string; label: string; type: string }[];
  formatValue: (field: { key: string; type: string }) => string | null;
}

export function FieldGroupCard({ group, fields, formatValue }: FieldGroupCardProps): JSX.Element | null {
  const validFields = fields.map((f) => ({ field: f, val: formatValue(f) })).filter((item) => Boolean(item.val));
  if (validFields.length === 0) return null;

  return (
    <DetailSection title={group}>
      {validFields.map(({ field, val }) => {
        const Icon = ICON_MAP[field.key] || Tag;
        return (
          <div key={field.key} className="flex items-center gap-3 p-3 group/row">
            <div className="p-2 rounded-lg bg-muted/80 group-hover/row:bg-primary/10 transition-colors">
              <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover/row:text-primary transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-tight leading-none mb-1">
                {field.label}
              </span>
              <span className="text-sm font-semibold text-foreground truncate block">{val}</span>
            </div>
          </div>
        );
      })}
    </DetailSection>
  );
}

export interface QuickActionButtonProps {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function QuickActionButton({
  label,
  icon: Icon,
  onClick,
  href,
  disabled = false,
  className = "",
  ariaLabel,
}: QuickActionButtonProps): JSX.Element {
  const baseClasses = `flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${className}`;
  if (href && !disabled) {
    return (
      <a
        href={href}
        aria-label={ariaLabel || label}
        className={baseClasses}
      >
        <Icon className="w-5 h-5" />
        <span className="text-[10px] font-bold">{label}</span>
      </a>
    );
  }

  return (
    <Button
      variant="ghost"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel || label}
      className={`h-auto font-normal shadow-none ${baseClasses}`}
      type="button"
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-bold">{label}</span>
    </Button>
  );
}
