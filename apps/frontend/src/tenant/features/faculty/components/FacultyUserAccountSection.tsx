import React, { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkspaceRoles } from "@/tenant/hooks/useWorkspaceRoles";
import { useUsersContractList } from "@/tenant/hooks/collections/users";
import {
  getPrimaryEmail,
  workspaceRoleLabel,
  type Contact,
  type Teacher,
} from "@mms/shared";
import { FacultyLinkedUserCard } from "@/tenant/features/faculty/components/FacultyLinkedUserCard";
import { FacultyNewUserAccountFields } from "@/tenant/features/faculty/components/FacultyNewUserAccountFields";

export interface FacultyUserAccountDraft {
  enabled: boolean;
  role: string;
  setupMethod: "password" | "invite";
  password?: string;
  forceReset?: boolean;
}

export interface LinkedUserInfo {
  id: string;
  contactId?: string | number;
  email?: string;
  role?: string;
  status?: string;
}

export interface FacultyUserAccountSectionProps {
  teacherDraft: Partial<Teacher>;
  linkedContact?: Contact | null;
  linkedUser?: LinkedUserInfo | null;
  userAccountDraft: FacultyUserAccountDraft;
  onUserAccountDraftChange: (draft: FacultyUserAccountDraft) => void;
  errors: Record<string, string>;
}

export function FacultyUserAccountSection({
  teacherDraft,
  linkedContact,
  linkedUser: linkedUserProp,
  userAccountDraft,
  onUserAccountDraftChange,
  errors,
}: FacultyUserAccountSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const workspaceRoles = useWorkspaceRoles();
  const primaryEmail = linkedContact ? getPrimaryEmail(linkedContact) : null;

  const usersQuery = useUsersContractList(
    { limit: 100 },
    linkedUserProp === undefined && Boolean(teacherDraft.contactId),
  );
  const existingUsers = (usersQuery.data as { users?: LinkedUserInfo[] } | undefined)?.users;

  const linkedUser = useMemo(() => {
    if (linkedUserProp !== undefined) return linkedUserProp;
    if (!teacherDraft.contactId && !teacherDraft.userId) return null;
    return existingUsers?.find(
      (u) =>
        (teacherDraft.userId && u.id === teacherDraft.userId) ||
        (teacherDraft.contactId && String(u.contactId) === String(teacherDraft.contactId)),
    ) ?? null;
  }, [linkedUserProp, existingUsers, teacherDraft.contactId, teacherDraft.userId]);

  const roleOptions = useMemo(() => {
    const allowedRoles = teacherDraft.designationAssignableRoles;
    return workspaceRoles
      .filter((role) => !teacherDraft.designationId || (allowedRoles ?? []).includes(role.id))
      .map((role) => ({
        value: role.id,
        label: `${workspaceRoleLabel(role, t)}${!role.isSystem ? ` (${t("contacts.form.tabCustom")})` : ""}`,
      }));
  }, [workspaceRoles, teacherDraft.designationAssignableRoles, teacherDraft.designationId, t]);

  const selectedRoleObj = useMemo(() => {
    const roleId = linkedUser ? (userAccountDraft.role || linkedUser.role) : userAccountDraft.role;
    return workspaceRoles.find((r) => r.id === roleId);
  }, [workspaceRoles, linkedUser, userAccountDraft.role]);

  if (linkedUser) {
    return (
      <FacultyLinkedUserCard
        linkedUser={linkedUser}
        userAccountDraft={userAccountDraft}
        onUserAccountDraftChange={onUserAccountDraftChange}
        roleOptions={roleOptions}
        workspaceRoles={workspaceRoles}
        selectedRoleObj={selectedRoleObj}
        errors={errors}
      />
    );
  }

  return (
    <SectionCard
      title={t("teachers.form.sectionUserAccount")}
      icon={ShieldCheck}
      accentColor="primary"
      className="z-elevated"
    >
      <div className="space-y-4 text-start">
        <div className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border bg-muted/20">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">{t("teachers.form.grantLoginAccess")}</p>
            <p className="text-xs text-muted-foreground">{t("teachers.form.grantLoginAccessHint")}</p>
          </div>
          <Switch
            checked={userAccountDraft.enabled}
            onCheckedChange={(checked) =>
              onUserAccountDraftChange({
                ...userAccountDraft,
                enabled: checked,
                role: userAccountDraft.role || "teacher",
              })
            }
            aria-label={t("teachers.form.grantLoginAccess")}
          />
        </div>

        {userAccountDraft.enabled ? (
          <FacultyNewUserAccountFields
            primaryEmail={primaryEmail}
            userAccountDraft={userAccountDraft}
            onUserAccountDraftChange={onUserAccountDraftChange}
            roleOptions={roleOptions}
            selectedRoleObj={selectedRoleObj}
            errors={errors}
          />
        ) : null}
      </div>
    </SectionCard>
  );
}
