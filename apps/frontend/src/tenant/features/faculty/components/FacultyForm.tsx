import React from "react";
import { School } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import type { FacultyMember, Teacher } from "@mms/shared";
import { TeacherFormTabContent } from "@/tenant/features/faculty/components/FacultyFormTabContent";
import { useTeacherFormController } from "@/tenant/features/faculty/components/useFacultyFormController";
import { TeacherFormFooter } from "@/tenant/features/faculty/components/FacultyFormFooter";

export interface FacultyFormProps {
  faculty?: FacultyMember;
  teacher?: Teacher;
  onClose: () => void;
  onSave: (faculty: FacultyMember) => void | Promise<void>;
  priority?: boolean;
}

export type TeacherFormProps = FacultyFormProps;

export const FacultyForm = (function FacultyForm(props: FacultyFormProps): React.JSX.Element {
  const teacher = props.faculty ?? props.teacher;
  const { onClose, onSave, priority = false } = props;
  const {
    t,
    dir,
    language,
    saving,
    errors,
    teacherDraft,
    isDirty,
    defaultSpecialization,
    specializationOptions,
    designationOptions,
    handleUpdateDesignations,
    statusOptions,
    statusConfig,
    autoGenerateId,
    requireContactLink,
    fieldsMap,
    linkedContact,
    linkedTeacherContactIds,
    userAccountDraft,
    setUserAccountDraft,
    idPrefix,
    nextEmployeeId,
    handleRegenerateEmployeeId,
    isFetchingNextEmployeeId,
    formInstanceId,
    isFieldEnabled,
    isFieldRequired,
    getFieldError,
    updateDraft,
    handleSave,
    validationErrorSummary,
    typedDuplicateReason,
    duplicateConfirmOpen,
    handleDuplicateDialogOpenChange,
    confirmDuplicateSave,
    duplicateErrorKeys,
    supervisorCandidates,
    hierarchyRankPresets,
  } = useTeacherFormController({ teacher, onClose, onSave });

  return (
    <>
      <FormModal
        open
        onClose={onClose}
        title={teacher ? t("teachers.form.editTitle") : t("teachers.form.addTitle")}
        subtitle={t("teachers.form.contactHint")}
        icon={School}
        tall
        priority={priority}
        lang={language}
        dir={dir}
        cancelLabel={t("common.cancel")}
        saveLabel={saving ? t("teachers.form.saving") : teacher ? t("teachers.form.saveUpdate") : t("teachers.form.saveCreate")}
        onSave={handleSave}
        isDirty={isDirty}
        saving={saving}
        error={validationErrorSummary}
        saveDisabled={
          (requireContactLink && isFieldEnabled("contactId") && !teacherDraft.contactId)
          || (Boolean(teacher?.id) && !isDirty)
        }
        footerStart={
          <TeacherFormFooter
            linkedContact={linkedContact}
            teacherDraft={teacherDraft}
            requireContactLink={requireContactLink}
            statusConfig={statusConfig}
            t={t}
          />
        }
      >
        <TeacherFormTabContent
          formInstanceId={formInstanceId}
          teacher={teacher}
          teacherDraft={teacherDraft}
          errors={errors}
          fields={fieldsMap}
          defaultSpecialization={defaultSpecialization}
          linkedTeacherContactIds={linkedTeacherContactIds}
          specializationOptions={specializationOptions}
          designationOptions={designationOptions}
          onUpdateDesignations={handleUpdateDesignations}
          userAccountDraft={userAccountDraft}
          onUserAccountDraftChange={setUserAccountDraft}
          autoGenerateId={autoGenerateId}
          idPrefix={idPrefix}
          nextEmployeeId={nextEmployeeId}
          onRegenerateEmployeeId={handleRegenerateEmployeeId}
          isFetchingNextEmployeeId={isFetchingNextEmployeeId}
          statusOptions={statusOptions}
          isFieldEnabled={isFieldEnabled}
          isFieldRequired={isFieldRequired}
          getFieldError={getFieldError}
          onDraftChange={updateDraft}
          linkedContact={linkedContact}
          supervisorCandidates={supervisorCandidates}
          hierarchyRankPresets={hierarchyRankPresets}
        />
      </FormModal>
      <ConfirmAlertDialog
        open={duplicateConfirmOpen}
        onOpenChange={handleDuplicateDialogOpenChange}
        title={teacher ? t("teachers.form.editTitle") : t("teachers.form.addTitle")}
        description={typedDuplicateReason
          ? t("teachers.form.duplicateSaveWarning", { message: t(duplicateErrorKeys[typedDuplicateReason]) })
          : ""}
        confirmLabel={t("teachers.form.saveAnyway")}
        cancelLabel={t("teachers.form.reviewDuplicate")}
        onConfirm={confirmDuplicateSave}
      />
    </>
  );
});

export {
  FacultyForm as TeacherForm,
  FacultyForm as TeacherFormModal,
  FacultyForm as FacultyFormModal,
};
export default FacultyForm;

