import React from "react";
import { GraduationCap } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";
import {
  StudentContactSection,
  StudentGuardianSection,
  StudentNotesSection,
  StudentRegistrationSection,
} from "@/tenant/features/students/components/StudentFormSections";
import { useStudentFormState } from "@/tenant/features/students/hooks/useStudentFormState";
import type { Student } from "@mms/shared";

export interface StudentFormProps {
  student?: Partial<Student> | null;
  onClose: () => void;
  onSave: (student: Student) => void | Promise<void>;
}

export default function StudentForm({
  student,
  onClose,
  onSave,
}: StudentFormProps): React.JSX.Element {
  const form = useStudentFormState({ student, onClose, onSave });

  const footerStart = form.linkedContact?.name ? (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <span className="font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60">
        {form.linkedContact.name}
      </span>
      <div className="flex items-center gap-1.5">
        <GrBadge grNumber={form.studentDraft.grNumber} />
        <StatusBadge status={form.studentDraft.status || "active"} size="sm" config={form.statusBadgeConfig} />
      </div>
    </div>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20">
      {form.t("students.form.contactRequired")}
    </span>
  );

  return (
    <>
      <FormModal
        open
        onClose={onClose}
        title={student ? form.t("students.form.editTitle") : form.t("students.form.addTitle")}
        subtitle={form.t("students.form.subtitle")}
        icon={GraduationCap}
        lang={form.language}
        cancelLabel={form.t("common.cancel")}
        saveLabel={form.saving ? form.t("students.form.saving") : student ? form.t("students.form.saveUpdate") : form.t("students.form.saveRegister")}
        onSave={form.handleSave}
        saving={form.saving}
        saveDisabled={!form.studentDraft.contactId}
        error={form.validationErrorSummary ?? (form.errorSummary || undefined)}
        footerStart={footerStart}
      >
        <div className="space-y-6 pb-6">
          <StudentContactSection
            contactId={form.studentDraft.contactId}
            excludeIds={form.excludeIds}
            linkedGenderLabel={form.linkedGenderLabel}
            linkedDob={form.linkedDob}
            genderError={form.getFieldError("gender")}
            dobError={form.getFieldError("dob")}
            getFieldError={form.getFieldError}
            onContactSelect={form.handleContactSelect}
            onStudentAvatarChange={form.handleStudentAvatarChange}
          />

          <StudentRegistrationSection
            studentDraft={form.studentDraft}
            isGrAutoAssigned={form.isGrAutoAssigned}
            statusSelectOptions={form.statusSelectOptions}
            getFieldError={form.getFieldError}
            onGrNumberChange={form.handleGrNumberChange}
            onDraftChange={form.updateDraft}
          />

          <StudentGuardianSection
            enabled={form.enabledTabs.has("guardian")}
            studentDraft={form.studentDraft}
            fatherExcludeIds={form.fatherExcludeIds}
            motherExcludeIds={form.motherExcludeIds}
            guardianExcludeIds={form.guardianExcludeIds}
            getFieldError={form.getFieldError}
            isFieldEnabled={form.isFieldEnabled}
            onParentSelect={form.handleParentSelect}
          />

          <StudentNotesSection
            enabled={form.enabledTabs.has("academic")}
            notes={form.studentDraft.notes}
            onDraftChange={form.updateDraft}
          />
        </div>
      </FormModal>
      <ConfirmAlertDialog
        open={form.duplicateConfirmOpen}
        onOpenChange={form.handleDuplicateDialogOpenChange}
        title={student ? form.t("students.form.editTitle") : form.t("students.form.addTitle")}
        description={form.typedDuplicateReason
          ? form.t("students.form.duplicateSaveWarning", { message: form.t(form.duplicateErrorKeys[form.typedDuplicateReason]) })
          : ""}
        confirmLabel={form.t("students.form.saveAnyway")}
        cancelLabel={form.t("students.form.reviewDuplicate")}
        onConfirm={form.confirmDuplicateSave}
      />
    </>
  );
}
