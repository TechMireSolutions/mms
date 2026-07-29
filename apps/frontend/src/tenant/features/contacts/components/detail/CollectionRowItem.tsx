import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyBtn } from "@/components/ui/CopyBtn";

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
              className="min-h-11 min-w-11 rounded-lg text-muted-foreground hover:text-foreground flex items-center justify-center opacity-100"
            />
          )}
          {onAction && ActionIcon ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onAction}
              aria-label={actionTitle || value}
              className={`rounded-lg shadow-none ${actionColorClass}`}
            >
              <ActionIcon className="w-3.5 h-3.5" />
            </Button>
          ) : actionHref && ActionIcon ? (
            <a
              href={actionHref}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              aria-label={actionTitle || value}
              className={`min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg transition-colors ${actionColorClass}`}
            >
              <ActionIcon className="w-3.5 h-3.5" />
            </a>
          ) : null}
        </div>
      )}
    </div>
  );
}
