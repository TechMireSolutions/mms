import React from "react";
import { UserCheck } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { formatFacultyDisplayName, type FacultyMember } from "@mms/shared";
import type { SessionFaculty } from "@/lib/data/sessionsData";
import { COMMON_FACULTY_ROLES } from "./facultyManagementShared";

interface SessionFacultyFormModalProps {
  open: boolean;
  onClose: () => void;
  editingFaculty: SessionFaculty | null;
  saving: boolean;
  facultyId: string;
  onFacultyIdChange: (id: string) => void;
  role: string;
  onRoleChange: (role: string) => void;
  customRole: string;
  onCustomRoleChange: (val: string) => void;
  status: "active" | "inactive";
  onStatusChange: (status: "active" | "inactive") => void;
  allFaculty: FacultyMember[];
  onSave: () => Promise<void> | void;
}

export function SessionFacultyFormModal({
  open,
  onClose,
  editingFaculty,
  saving,
  facultyId,
  onFacultyIdChange,
  role,
  onRoleChange,
  customRole,
  onCustomRoleChange,
  status,
  onStatusChange,
  allFaculty,
  onSave,
}: SessionFacultyFormModalProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={editingFaculty ? t("faculty.form.editTitle") : t("sessions.faculty.add")}
      icon={UserCheck}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={onSave}
      saving={saving}
      saveDisabled={saving || !facultyId || (role === "Custom" && !customRole.trim())}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="faculty-member">
            {t("sessions.faculty.selectFaculty")}
          </label>
          <FormSelect
            id="faculty-member"
            name="facultyId"
            value={facultyId}
            onChange={onFacultyIdChange}
            options={
              allFaculty.length > 0
                ? allFaculty.map((member) => ({
                    value: String(member.id),
                    label: formatFacultyDisplayName(member),
                  }))
                : [{ value: "", label: t("common.none") }]
            }
            className="w-full"
          />
        </div>

        <div>
          <label className={FORM_LABEL} htmlFor="faculty-role">
            {t("sessions.faculty.role")}
          </label>
          <FormSelect
            id="faculty-role"
            name="role"
            value={role}
            onChange={onRoleChange}
            options={[
              ...COMMON_FACULTY_ROLES.map((r) => ({ value: r, label: r })),
              { value: "Custom", label: t("sessions.classes.detail.schedule.custom") },
            ]}
            className="w-full"
          />
        </div>

        {role === "Custom" && (
          <div>
            <label className={FORM_LABEL} htmlFor="faculty-custom-role">
              {t("sessions.faculty.customRoleName")}
            </label>
            <Input
              id="faculty-custom-role"
              name="customRole"
              value={customRole}
              onChange={(e) => onCustomRoleChange(e.target.value)}
              placeholder={t("sessions.faculty.rolePlaceholder")}
            />
          </div>
        )}

        <div>
          <label className={FORM_LABEL} htmlFor="faculty-status">
            {t("sessions.faculty.status")}
          </label>
          <FormSelect
            id="faculty-status"
            name="status"
            value={status}
            onChange={(val) => onStatusChange(val as "active" | "inactive")}
            options={[
              { value: "active", label: t("sessions.status.active") },
              { value: "inactive", label: t("sessions.classes.detail.status.inactive") },
            ]}
            className="w-full"
          />
        </div>
      </div>
    </FormModal>
  );
}
