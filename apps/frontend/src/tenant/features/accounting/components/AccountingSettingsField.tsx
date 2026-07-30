import React from "react";

interface AccountingSettingsFieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export function AccountingSettingsField({
  label,
  hint = undefined,
  children,
}: AccountingSettingsFieldProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-semibold text-foreground m-0">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5 m-0">{hint}</p>}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}
