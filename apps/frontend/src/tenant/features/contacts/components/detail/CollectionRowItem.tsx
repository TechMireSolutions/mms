import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyBtn } from "@/components/ui/CopyBtn";

export interface CollectionRowAction {
  key: string;
  icon: LucideIcon;
  title: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  external?: boolean;
}

export interface CollectionRowItemProps {
  label: string;
  value: string;
  copyable?: boolean;
  /** @deprecated Prefer `actions` for multiple row controls. */
  actionHref?: string;
  /** @deprecated Prefer `actions` for multiple row controls. */
  onAction?: () => void;
  /** @deprecated Prefer `actions` for multiple row controls. */
  actionIcon?: LucideIcon;
  /** @deprecated Prefer `actions` for multiple row controls. */
  actionTitle?: string;
  /** @deprecated Prefer `actions` for multiple row controls. */
  actionColorClass?: string;
  external?: boolean;
  actions?: CollectionRowAction[];
}

function RowActionButton({ action }: { action: CollectionRowAction }): JSX.Element {
  const Icon = action.icon;
  const className = `min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg transition-colors ${
    action.className ?? "text-primary hover:bg-primary/10"
  }`;

  if (action.href) {
    return (
      <a
        href={action.href}
        target={action.external ? "_blank" : undefined}
        rel={action.external ? "noopener noreferrer" : undefined}
        aria-label={action.title}
        title={action.title}
        className={className}
      >
        <Icon className="w-3.5 h-3.5" />
      </a>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={action.onClick}
      aria-label={action.title}
      title={action.title}
      className={`rounded-lg shadow-none ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
    </Button>
  );
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
  actions,
}: CollectionRowItemProps): JSX.Element {
  const legacyActions: CollectionRowAction[] = [];
  if ((!actions || actions.length === 0) && ActionIcon && (onAction || actionHref)) {
    legacyActions.push({
      key: "primary",
      icon: ActionIcon,
      title: actionTitle || value,
      href: onAction ? undefined : actionHref,
      onClick: onAction,
      className: actionColorClass,
      external,
    });
  }
  const resolvedActions = actions && actions.length > 0 ? actions : legacyActions;

  return (
    <div className="p-3 border-b border-border/50 last:border-b-0 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase">
            {label}
          </span>
        </div>
        <span className="font-semibold text-xs text-foreground block leading-relaxed truncate">{value}</span>
      </div>
      {value && (
        <div className="flex max-w-[55%] flex-shrink-0 flex-wrap items-center justify-end gap-1">
          {copyable && (
            <CopyBtn
              text={value}
              showToast
              className="min-h-11 min-w-11 rounded-lg text-muted-foreground hover:text-foreground flex items-center justify-center opacity-100"
            />
          )}
          {resolvedActions.map((action) => (
            <RowActionButton key={action.key} action={action} />
          ))}
        </div>
      )}
    </div>
  );
}
