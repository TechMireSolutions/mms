import React from "react";
import type { Contact, Teacher } from "@mms/shared";
import { DEFAULT_TEACHER_STATUS } from "@mms/shared";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
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
        <span className="font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60">
          {linkedContact.name}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20 text-xs">
            {t("teachers.form.employeeIdBadge", { id: teacherDraft.employeeId || t("common.notSpecified") })}
          </span>
          <StatusBadge status={status} config={statusConfig} size="sm" />
        </div>
      </div>
    );
  }

  if (requireContactLink) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20">
        {t("teachers.form.contactRequired")}
      </span>
    );
  }

  return null;
}
