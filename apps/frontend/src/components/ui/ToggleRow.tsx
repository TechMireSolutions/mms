import * as React from "react";
import { Switch } from "@/components/ui/switch";

export interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (newValue: boolean) => void;
  ariaLabel?: string;
}

export function ToggleRow({
  label,
  description,
  value,
  onChange,
  ariaLabel,
}: ToggleRowProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between py-1.5 text-left">
      <div>
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <Switch
        checked={value}
        onCheckedChange={onChange}
        aria-label={ariaLabel || label}
      />
    </div>
  );
}
