import React from "react";
import { School } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { Teacher } from "@mms/shared";
import { TeacherFormTabContent } from "@/tenant/features/teachers/components/TeacherFormTabContent";
import { useTeacherFormController } from "@/tenant/features/teachers/components/useTeacherFormController";
import { TeacherFormFooter } from "@/tenant/features/teachers/components/TeacherFormFooter";

export interface TeacherFormProps {
  teacher?: Teacher;
  onClose: () => void;
  onSave: (teacher: Teacher) => void | Promise<void>;
}

export function TeacherForm({
  teacher,
  onClose,
  onSave,
}: TeacherFormProps): React.JSX.Element {
  const { language } = useGlobalSettings();
  const {
    t,
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
  } = useTeacherFormController({ teacher, onClose, onSave });

  return (
    <FormModal
      open
      onClose={onClose}
      title={teacher ? t("teachers.form.editTitle") : t("teachers.form.addTitle")}
      subtitle={t("teachers.form.contactHint")}
      icon={School}
      tall
      tabs={visibleTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabPanelIdPrefix="teacher-form-tab"
      lang={language}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={() => { void handleSave(); }}
      saving={saving}
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
  );
}
