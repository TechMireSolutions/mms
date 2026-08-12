import React from "react";
import { School } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { Teacher } from "@mms/shared";
import { TeacherFormTabContent } from "@/tenant/features/teachers/components/TeacherFormTabContent";
import { useTeacherFormController } from "@/tenant/features/teachers/components/useTeacherFormController";
import { TeacherFormFooter } from "@/tenant/features/teachers/components/TeacherFormFooter";

export interface TeacherFormProps {
  teacher?: Teacher;
  onClose: () => void;
  onSave: (teacher: Teacher) => void | Promise<void>;
  priority?: boolean;
}

export function TeacherForm({
  teacher,
  onClose,
  onSave,
  priority = false,
}: TeacherFormProps): React.JSX.Element {
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
    statusOptions,
    statusConfig,
    autoGenerateId,
    requireContactLink,
    fieldsMap,
    dfsTabs,
    linkedContact,
    linkedTeacherContactIds,
    idPrefix,
    nextEmployeeId,
    formInstanceId,
    activeTab,
    setActiveTab,
    visibleTabs,
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
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabPanelIdPrefix="teacher-form-tab"
        lang={language}
        dir={dir}
        cancelLabel={t("common.cancel")}
        saveLabel={saving ? t("teachers.form.saving") : teacher ? t("teachers.form.saveUpdate") : t("teachers.form.saveCreate")}
        onSave={() => { void handleSave(); }}
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
          tab={activeTab}
          formInstanceId={formInstanceId}
          teacher={teacher}
          teacherDraft={teacherDraft}
          errors={errors}
          fields={fieldsMap}
          dfsTabs={dfsTabs}
          defaultSpecialization={defaultSpecialization}
          linkedTeacherContactIds={linkedTeacherContactIds}
          specializationOptions={specializationOptions}
          autoGenerateId={autoGenerateId}
          idPrefix={idPrefix}
          nextEmployeeId={nextEmployeeId}
          statusOptions={statusOptions}
          isFieldEnabled={isFieldEnabled}
          isFieldRequired={isFieldRequired}
          getFieldError={getFieldError}
          onDraftChange={updateDraft}
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
}
