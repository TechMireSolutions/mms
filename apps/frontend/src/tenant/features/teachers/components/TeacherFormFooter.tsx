import React from "react";
import { AppTranslationKey, toTitleCase } from "@mms/shared";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { Contact } from "@mms/shared";
import type { Teacher } from "@mms/shared";

interface TeacherFormFooterProps {
  linkedContact?: Contact | null;
  teacherDraft: Partial<Teacher>;
  requireContactLink: boolean;
  t: TranslationFunction;
}

export function TeacherFormFooter({
  linkedContact,
  teacherDraft,
  requireContactLink,
  t,
}: TeacherFormFooterProps): React.JSX.Element | null {
  if (linkedContact?.name) {
    return (
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        <span className="font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60">
          {linkedContact.name}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20 text-xs">
            {t("teachers.form.employeeIdBadge", { id: teacherDraft.employeeId || t("common.notSpecified") })}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold border text-xs capitalize ${
            teacherDraft.status === "active"
              ? "bg-success/10 text-success border-success/20"
              : "bg-muted text-muted-foreground border-border"
          }`}>
            {(() => {
              const status = teacherDraft.status || "active";
              const translationKey = `teachers.status.${status}` as AppTranslationKey;
              const translated = t(translationKey);
              return translated === translationKey ? toTitleCase(status) : translated;
            })()}
          </span>
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
