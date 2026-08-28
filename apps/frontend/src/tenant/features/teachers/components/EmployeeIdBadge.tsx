import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { FormFooterBadge } from "@/components/ui/FormFooterChip";

export interface EmployeeIdBadgeProps {
  employeeId: string | null | undefined;
}

/** Employee ID pill badge — shared across TeacherDetail, TeachersList, and TeacherForm. */
export function EmployeeIdBadge({ employeeId }: EmployeeIdBadgeProps): React.JSX.Element | null {
  const { t } = useTranslation();
  if (!employeeId) return null;
  return (
    <FormFooterBadge tone="primary" className="px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
      {t("teachers.employeeIdPrefix")}: {employeeId}
    </FormFooterBadge>
  );
}
