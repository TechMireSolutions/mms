import React from "react";

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }> | null;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const VARIANTS = {
  primary:   "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent shadow-sm",
  secondary: "bg-card text-foreground border-border hover:bg-muted",
  ghost:     "bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground",
  danger:    "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
};

const SIZES = {
  sm: "min-h-11 px-3 py-2 text-xs gap-1.5",
  md: "min-h-11 px-3.5 py-2.5 text-sm gap-1.5",
};

/**
 * ActionButton — consistent CTA button used across all pages.
 *
 * @param {ActionButtonProps} props - The component props.
 * @returns {React.ReactElement} The rendered action button.
 */
export function ActionButton({
  variant = "secondary",
  size = "md",
  icon: Icon = null,
  loading = false,
  disabled = false,
  onClick = undefined,
  children = null,
  className = "",
  ...props
}: ActionButtonProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex min-w-11 items-center justify-center font-semibold rounded-lg border transition-all
        disabled:opacity-60 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}
      `}
      {...props}
    >
      {loading ? (
        <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : (
        Icon && <Icon className="h-3.5 w-3.5" />
      )}
      {children}
    </button>
  );
}
