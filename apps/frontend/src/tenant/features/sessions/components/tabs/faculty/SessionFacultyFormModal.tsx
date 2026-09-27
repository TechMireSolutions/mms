import React from "react";
import { UserCheck } from "lucide-react";
import { FormModal } from "@/components/ui/FormModal";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import { formatTeacherDisplayName, type Teacher } from "@mms/shared";
import type { SessionFaculty } from "@/lib/data/sessionsData";
import { COMMON_FACULTY_ROLES } from "./facultyManagementShared";

interface SessionFacultyFormModalProps {
  open: boolean;
  onClose: () => void;
  editingFaculty: SessionFaculty | null;
  saving: boolean;
  teacherId: string;
  onTeacherIdChange: (id: string) => void;
  role: string;
  onRoleChange: (role: string) => void;
  customRole: string;
  onCustomRoleChange: (val: string) => void;
  status: "active" | "inactive";
  onStatusChange: (status: "active" | "inactive") => void;
  allTeachers: Teacher[];
  onSave: () => Promise<void> | void;
}

export function SessionFacultyFormModal({
  open,
  onClose,
  editingFaculty,
  saving,
  teacherId,
  onTeacherIdChange,
  role,
  onRoleChange,
  customRole,
  onCustomRoleChange,
  status,
  onStatusChange,
  allTeachers,
  onSave,
}: SessionFacultyFormModalProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={editingFaculty ? "Edit Session Faculty" : "Add Session Faculty"}
      icon={UserCheck}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={onSave}
      saving={saving}
    >
      <div className="space-y-4">
        <div>
          <label className={FORM_LABEL} htmlFor="faculty-teacher">
            {t("sessions.faculty.selectTeacher")}
          </label>
          <FormSelect
            id="faculty-teacher"
            name="teacherId"
            value={teacherId}
            onChange={onTeacherIdChange}
            options={
              allTeachers.length > 0
                ? allTeachers.map((teacher) => ({
                    value: String(teacher.id),
                    label: formatTeacherDisplayName(teacher),
                  }))
                : [{ value: "", label: "No active teachers found" }]
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
              { value: "Custom", label: "Custom Role..." },
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
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            className="w-full"
          />
        </div>
      </div>
    </FormModal>
  );
}
