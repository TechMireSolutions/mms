import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { FormFooterBadge } from "@/components/ui/FormFooterChip";

interface GrBadgeProps {
  grNumber: string | null | undefined;
  className?: string;
}

/** GR number pill badge — shared across StudentDetail, StudentList, and StudentForm. */
export function GrBadge({ grNumber, className }: GrBadgeProps): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!grNumber) return null;
  return (
    <FormFooterBadge
      tone="primary"
      className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${className ?? ""}`}
    >
      {t("students.grPrefix")}: {grNumber}
    </FormFooterBadge>
  );
}
