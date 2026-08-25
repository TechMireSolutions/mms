import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { FormFooterBadge } from "@/components/ui/FormFooterChip";

interface GrBadgeProps {
  grNumber: string | null | undefined;
}

/** GR number pill badge — shared across StudentDetail, StudentsListContent, and StudentForm. */
export function GrBadge({ grNumber }: GrBadgeProps): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!grNumber) return null;
  return (
    <FormFooterBadge tone="primary" className="px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
      {t("students.grPrefix")}: {grNumber}
    </FormFooterBadge>
  );
}
