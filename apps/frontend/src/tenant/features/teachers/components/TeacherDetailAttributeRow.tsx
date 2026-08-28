import type { LucideIcon } from "lucide-react";
import type { JSX, ReactNode } from "react";
import {
  DetailAttributeRow,
  type DetailAttributeRowVariant,
} from "@/components/ui/DetailAttributeRow";

export interface TeacherDetailAttributeRowProps {
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
  value: ReactNode;
  variant?: DetailAttributeRowVariant;
}

/** Attribute row for TeacherDetail — callers own empty-value rendering (muted dash). */
export function TeacherDetailAttributeRow({
  icon,
  iconClassName,
  label,
  value,
  variant,
}: TeacherDetailAttributeRowProps): JSX.Element {
  return (
    <DetailAttributeRow
      icon={icon}
      iconClassName={iconClassName}
      label={label}
      value={value}
      variant={variant ?? "list"}
    />
  );
}
