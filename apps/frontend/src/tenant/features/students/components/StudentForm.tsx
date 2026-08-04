import React from "react";
import { GraduationCap } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { RequiredBanner } from "@/components/ui/RequiredBanner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GrBadge } from "@/tenant/features/students/components/GrBadge";
import { StudentFormTabContent } from "@/tenant/features/students/components/StudentFormTabContent";
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
    <RequiredBanner message={form.t("students.form.contactRequired")} />
  );

  return (
    <>
      <FormModal
        open
        onClose={onClose}
        title={student ? form.t("students.form.editTitle") : form.t("students.form.addTitle")}
        subtitle={form.t("students.form.subtitle")}
        icon={GraduationCap}
        tall
        tabs={form.visibleTabs}
        activeTab={form.activeTab}
        onTabChange={form.setActiveTab}
        tabPanelIdPrefix="student-form-tab"
        lang={form.language}
        cancelLabel={form.t("common.cancel")}
        saveLabel={form.saving ? form.t("students.form.saving") : student ? form.t("students.form.saveUpdate") : form.t("students.form.saveRegister")}
        onSave={form.handleSave}
        saving={form.saving}
        saveDisabled={!form.studentDraft.contactId}
        error={form.validationErrorSummary ?? (form.errorSummary || undefined)}
        footerStart={footerStart}
      >
        <StudentFormTabContent
          tab={form.activeTab}
          formInstanceId={form.formInstanceId}
          studentDraft={form.studentDraft}
          linkedContact={form.linkedContact}
          linkedGenderRaw={form.linkedGenderRaw}
          linkedGenderLabel={form.linkedGenderLabel}
          linkedDob={form.linkedDob}
          excludeIds={form.excludeIds}
          isGrAutoAssigned={form.isGrAutoAssigned}
          statusSelectOptions={form.statusSelectOptions}
          fields={form.fields}
          isFieldEnabled={form.isFieldEnabled}
          getFieldError={form.getFieldError}
          onContactSelect={form.handleContactSelect}
          onStudentAvatarChange={form.handleStudentAvatarChange}
          onGrNumberChange={form.handleGrNumberChange}
          onDraftChange={form.updateDraft}
        />
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
