import React from "react";
import { School } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import type { FacultyMember, Teacher } from "@mms/shared";
import { FacultyFormTabContent } from "@/tenant/features/faculty/components/FacultyFormTabContent";
import { useFacultyFormController } from "@/tenant/features/faculty/components/useFacultyFormController";
import { FacultyFormFooter } from "@/tenant/features/faculty/components/FacultyFormFooter";
import {
  useFacultyFormTabs,
  type FacultyFormTabKey,
} from "@/tenant/features/faculty/components/facultyFormTabs";

export type { FacultyFormTabKey };

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
    statusOptions,
    statusConfig,
    autoGenerateId,
    requireContactLink,
    fieldsMap,
    linkedContact,
    linkedTeacherContactIds,
    linkedUser,
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
  } = useFacultyFormController({ teacher, faculty: props.faculty, onClose, onSave });

  const { activeTab, setActiveTab, visibleTabs } = useFacultyFormTabs({
    isFieldEnabled,
    errors,
    t,
    formInstanceId,
  });

  const onSaveWithTabFocus = async (options?: { keepOpen?: boolean }): Promise<void> => {
    await handleSave(options);
  };

  return (
    <>
      <FormModal<FacultyFormTabKey>
        open
        onClose={onClose}
        title={teacher ? t("faculty.form.editTitle") : t("faculty.form.addTitle")}
        subtitle={t("faculty.form.contactHint")}
        icon={School}
        tall
        priority={priority}
        lang={language}
        dir={dir}
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cancelLabel={t("common.cancel")}
        saveLabel={saving ? t("faculty.form.saving") : teacher ? t("faculty.form.saveUpdate") : t("faculty.form.saveCreate")}
        onSave={onSaveWithTabFocus}
        isDirty={isDirty}
        saving={saving}
        error={validationErrorSummary}
        saveDisabled={
          (requireContactLink && isFieldEnabled("contactId") && !teacherDraft.contactId)
          || (Boolean(teacher?.id) && !isDirty)
        }
        footerStart={
          <FacultyFormFooter
            linkedContact={linkedContact}
            teacherDraft={teacherDraft}
            requireContactLink={requireContactLink}
            statusConfig={statusConfig}
            t={t}
          />
        }
      >
        <FacultyFormTabContent
          formInstanceId={formInstanceId}
          activeTab={activeTab}
          teacher={teacher}
          teacherDraft={teacherDraft}
          errors={errors}
          fields={fieldsMap}
          defaultSpecialization={defaultSpecialization}
          linkedTeacherContactIds={linkedTeacherContactIds}
          specializationOptions={specializationOptions}
          designationOptions={designationOptions}
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
          linkedUser={linkedUser}
          supervisorCandidates={supervisorCandidates}
          hierarchyRankPresets={hierarchyRankPresets}
        />
      </FormModal>
      <ConfirmAlertDialog
        open={duplicateConfirmOpen}
        onOpenChange={handleDuplicateDialogOpenChange}
        title={teacher ? t("faculty.form.editTitle") : t("faculty.form.addTitle")}
        description={typedDuplicateReason
          ? t("faculty.form.duplicateSaveWarning", { message: t(duplicateErrorKeys[typedDuplicateReason]) })
          : ""}
        confirmLabel={t("faculty.form.saveAnyway")}
        cancelLabel={t("faculty.form.reviewDuplicate")}
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
