import React from "react";

export interface PageHeaderProps {
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }> | null;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: string | null;
}

/**
 * PageHeader — unified top section for every page.
 *
 * @param {PageHeaderProps} props - The component props.
 * @returns {React.ReactElement} The rendered PageHeader component.
 */
export function PageHeader({
  icon: Icon = null,
  title,
  subtitle = "",
  actions = null,
  breadcrumb = null,
}: PageHeaderProps): React.ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon className="w-4.5 h-4.5 text-primary" style={{ width: "18px", height: "18px" }} />
          </div>
        )}
        <div>
          {breadcrumb && (
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{breadcrumb}</p>
          )}
          <h1 className="text-[20px] font-bold text-foreground leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
