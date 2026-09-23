import React, { useState, useEffect, useMemo } from "react";
import {
  Award,
  Briefcase,
  FileText,
  KeyRound,
  Network,
  School,
  User,
  type LucideIcon,
} from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import type { FacultyMember, Teacher } from "@mms/shared";
import { TeacherFormTabContent } from "@/tenant/features/faculty/components/FacultyFormTabContent";
import { useTeacherFormController } from "@/tenant/features/faculty/components/useFacultyFormController";
import { TeacherFormFooter } from "@/tenant/features/faculty/components/FacultyFormFooter";

export type FacultyFormTabKey =
  | "contact"
  | "employment"
  | "designation"
  | "hierarchy"
  | "account"
  | "notes";

export const FACULTY_FIELD_TAB_MAP: Record<string, FacultyFormTabKey> = {
  contactId: "contact",
  employeeId: "employment",
  status: "employment",
  department: "employment",
  specialization: "employment",
  qualification: "employment",
  joinDate: "employment",
  designationId: "designation",
  designationStartsOn: "designation",
  reportingFacultyId: "hierarchy",
  hierarchyRank: "hierarchy",
  notes: "notes",
  userPassword: "account",
  userEmail: "account",
  userRole: "account",
  userId: "account",
};

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

  const [activeTab, setActiveTab] = useState<FacultyFormTabKey>("contact");

  const tabErrors = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [fieldId, errorMsg] of Object.entries(errors)) {
      if (!errorMsg) continue;
      const tabKey = FACULTY_FIELD_TAB_MAP[fieldId] || "employment";
      counts[tabKey] = (counts[tabKey] || 0) + 1;
    }
    return counts;
  }, [errors]);

  const visibleTabs = useMemo(() => {
    const list: Array<{
      key: FacultyFormTabKey;
      icon: LucideIcon;
      label: string;
      badge?: number;
      tone?: "destructive";
    }> = [
      {
        key: "contact",
        icon: User,
        label: t("faculty.form.tab.contact"),
      },
      {
        key: "employment",
        icon: Briefcase,
        label: t("faculty.form.tab.employment"),
      },
    ];

    if (isFieldEnabled("designation")) {
      list.push({
        key: "designation",
        icon: Award,
        label: t("faculty.form.tab.designation"),
      });
    }

    if (isFieldEnabled("reportingFacultyId") || isFieldEnabled("hierarchyRank")) {
      list.push({
        key: "hierarchy",
        icon: Network,
        label: t("faculty.form.tab.hierarchy"),
      });
    }

    list.push({
      key: "account",
      icon: KeyRound,
      label: t("faculty.form.tab.account"),
    });

    if (isFieldEnabled("notes")) {
      list.push({
        key: "notes",
        icon: FileText,
        label: t("faculty.form.tab.notes"),
      });
    }

    return list.map((item) => {
      const errCount = tabErrors[item.key];
      const hasErrors = Boolean(errCount && errCount > 0);
      return {
        ...item,
        badge: hasErrors ? errCount : undefined,
        tone: hasErrors ? ("destructive" as const) : undefined,
      };
    });
  }, [isFieldEnabled, t, tabErrors]);

  useEffect(() => {
    if (!visibleTabs.some((tabItem) => tabItem.key === activeTab)) {
      setActiveTab("contact");
    }
  }, [visibleTabs, activeTab]);

  useEffect(() => {
    const errorKeys = Object.keys(errors).filter((key) => Boolean(errors[key]));
    if (errorKeys.length === 0) return;
    const currentTabHasError = Boolean(tabErrors[activeTab] && tabErrors[activeTab] > 0);
    if (!currentTabHasError) {
      const firstInvalidTab = visibleTabs.find((vt) => Boolean(tabErrors[vt.key] && tabErrors[vt.key] > 0));
      if (firstInvalidTab) {
        setActiveTab(firstInvalidTab.key);
      }
    }
  }, [errors, tabErrors, activeTab, visibleTabs]);

  const onSaveWithTabFocus = async (options?: { keepOpen?: boolean }): Promise<void> => {
    const success = await handleSave(options);
    if (!success) {
      const firstInvalidTab = visibleTabs.find((vt) => Boolean(tabErrors[vt.key] && tabErrors[vt.key] > 0));
      if (firstInvalidTab) {
        setActiveTab(firstInvalidTab.key);
      }
    }
  };

  return (
    <>
      <FormModal<FacultyFormTabKey>
        open
        onClose={onClose}
        title={teacher ? t("teachers.form.editTitle") : t("teachers.form.addTitle")}
        subtitle={t("teachers.form.contactHint")}
        icon={School}
        tall
        priority={priority}
        lang={language}
        dir={dir}
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cancelLabel={t("common.cancel")}
        saveLabel={saving ? t("teachers.form.saving") : teacher ? t("teachers.form.saveUpdate") : t("teachers.form.saveCreate")}
        onSave={onSaveWithTabFocus}
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
