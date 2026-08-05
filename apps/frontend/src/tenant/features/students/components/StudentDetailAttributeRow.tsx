import type { LucideIcon } from "lucide-react";
import type { JSX, ReactNode } from "react";
import { DetailAttributeRow } from "@/components/ui/DetailAttributeRow";

interface StudentDetailAttributeRowProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}

export function StudentDetailAttributeRow({
  icon,
  label,
  value,
}: StudentDetailAttributeRowProps): JSX.Element {
  return <DetailAttributeRow icon={icon} label={label} value={value} variant="card" />;
}
