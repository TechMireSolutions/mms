import type { LucideIcon } from "lucide-react";
import type { JSX, ReactNode } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { DetailAttributeRow } from "@/components/ui/DetailAttributeRow";

export function TeacherDetailAttributeRow({
  icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}): JSX.Element {
  const { t } = useTranslation();
  return (
    <DetailAttributeRow
      icon={icon}
      label={label}
      value={value || t("common.notSpecified")}
      variant="list"
    />
  );
}
