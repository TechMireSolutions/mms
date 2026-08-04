import type React from "react";
import { DetailAttributeRow } from "@/components/ui/DetailAttributeRow";

interface StudentDetailAttributeRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}

export function StudentDetailAttributeRow({
  icon,
  label,
  value,
}: StudentDetailAttributeRowProps): React.JSX.Element {
  return <DetailAttributeRow icon={icon} label={label} value={value} variant="card" />;
}
