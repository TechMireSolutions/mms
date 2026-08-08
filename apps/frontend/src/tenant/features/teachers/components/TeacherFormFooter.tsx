import React from "react";
import type { Contact, Teacher } from "@mms/shared";
import { DEFAULT_TEACHER_STATUS } from "@mms/shared";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import {
  FormFooterBadge,
  FormFooterEntityChip,
  FormFooterErrorChip,
} from "@/components/ui/FormFooterChip";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

interface TeacherFormFooterProps {
  linkedContact?: Contact | null;
  teacherDraft: Partial<Teacher>;
  requireContactLink: boolean;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  t: TranslationFunction;
}

export function TeacherFormFooter({
  linkedContact,
  teacherDraft,
  requireContactLink,
  statusConfig,
  t,
}: TeacherFormFooterProps): React.JSX.Element | null {
  if (linkedContact?.name) {
    const status = teacherDraft.status || DEFAULT_TEACHER_STATUS;
    return (
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        <FormFooterEntityChip>{linkedContact.name}</FormFooterEntityChip>
        <div className="flex items-center gap-1.5">
          <FormFooterBadge>
            {t("teachers.form.employeeIdBadge", { id: teacherDraft.employeeId || t("common.notSpecified") })}
          </FormFooterBadge>
          <StatusBadge status={status} config={statusConfig} size="sm" />
        </div>
      </div>
    );
  }

  if (requireContactLink) {
    return (
      <FormFooterErrorChip>
        {t("teachers.form.contactRequired")}
      </FormFooterErrorChip>
    );
  }

  return null;
}
