import React from "react";
import type { Contact, Teacher } from "@mms/shared";
import { resolveTeacherStatus } from "@mms/shared";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { RequiredBanner } from "@/components/ui/RequiredBanner";
import {
  FormFooterBadge,
  FormFooterEntityChip,
} from "@/components/ui/FormFooterChip";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import { extractEmployeeId } from "@/tenant/features/faculty/components/facultyFormDraft";

export interface FacultyFormFooterProps {
  linkedContact?: Contact | null;
  teacherDraft: Partial<Teacher>;
  facultyDraft?: Partial<Teacher>;
  requireContactLink: boolean;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  t: TranslationFunction;
}
export type TeacherFormFooterProps = FacultyFormFooterProps;

export function FacultyFormFooter({
  linkedContact,
  teacherDraft,
  facultyDraft,
  requireContactLink,
  statusConfig,
  t,
}: FacultyFormFooterProps): React.JSX.Element | null {
  const draft = facultyDraft ?? teacherDraft;
  if (linkedContact?.name) {
    const status = resolveTeacherStatus(draft.status);
    const employeeId = extractEmployeeId(draft.employeeId);
    return (
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        <FormFooterEntityChip>{linkedContact.name}</FormFooterEntityChip>
        <div className="flex items-center gap-1.5">
          <FormFooterBadge>
            {t("faculty.form.employeeIdBadge", { id: employeeId || t("common.notSpecified") })}
          </FormFooterBadge>
          <StatusBadge status={status} config={statusConfig} size="sm" />
        </div>
      </div>
    );
  }

  if (requireContactLink && !draft.contactId) {
    return (
      <RequiredBanner message={t("faculty.form.contactRequired")} />
    );
  }

  return null;
}

export const TeacherFormFooter = FacultyFormFooter;


