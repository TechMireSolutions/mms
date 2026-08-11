import type { LucideIcon } from "lucide-react";
import type { JSX, ReactNode } from "react";
import { DetailAttributeRow } from "@/components/ui/DetailAttributeRow";

/** Attribute row for TeacherDetail — callers own empty-value rendering (muted dash). */
export function TeacherDetailAttributeRow({
  icon,
  iconClassName,
  label,
  value,
}: {
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
  value: ReactNode;
}): JSX.Element {
  return (
    <DetailAttributeRow
      icon={icon}
      iconClassName={iconClassName}
      label={label}
      value={value}
      variant="list"
    />
  );
}
