import React from "react";
import { School } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { Teacher } from "@mms/shared";
import {
  TeacherBasicSection,
  TeacherEmploymentSection,
} from "@/tenant/features/teachers/components/TeacherFormSections";
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
    customValues,
    teacherDraft,
    defaultSpecialization,
    specializationOptions,
    statusOptions,
    autoGenerateId,
    requireContactLink,
    customFields,
    linkedContact,
    linkedTeacherContactIds,
    idPrefix,
    nextEmployeeId,
    updateDraft,
    updateCustomValue,
    handleSave,
  } = useTeacherFormController({ teacher, onClose, onSave });

  return (
    <FormModal
      open
      onClose={onClose}
      title={teacher ? t("teachers.form.editTitle") : t("teachers.form.addTitle")}
      subtitle={t("teachers.form.contactHint")}
      icon={School}
      lang={language}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={() => { void handleSave(); }}
      saving={saving}
      saveDisabled={requireContactLink && !teacherDraft.contactId}
      footerStart={
        <TeacherFormFooter
          linkedContact={linkedContact}
          teacherDraft={teacherDraft}
          requireContactLink={requireContactLink}
          t={t}
        />
      }
    >
      <div className="space-y-4">
        <TeacherBasicSection
          teacherDraft={teacherDraft}
          errors={errors}
          defaultSpecialization={defaultSpecialization}
          linkedTeacherContactIds={linkedTeacherContactIds}
          specializationOptions={specializationOptions}
          onDraftChange={updateDraft}
        />
        <TeacherEmploymentSection
          teacher={teacher}
          teacherDraft={teacherDraft}
          errors={errors}
          autoGenerateId={autoGenerateId}
          customFields={customFields}
          customValues={customValues}
          idPrefix={idPrefix}
          nextEmployeeId={nextEmployeeId}
          statusOptions={statusOptions}
          onCustomValueChange={updateCustomValue}
          onDraftChange={updateDraft}
        />
      </div>
    </FormModal>
  );
}
