import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { DetailAttributeRow } from "@/components/ui/DetailAttributeRow";

export function TeacherDetailAttributeRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}): React.JSX.Element {
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
