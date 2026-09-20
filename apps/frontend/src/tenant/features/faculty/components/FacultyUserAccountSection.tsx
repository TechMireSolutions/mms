import React, { useMemo } from "react";
import { ShieldCheck, UserCheck, AlertCircle, Shield } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkspaceRoles } from "@/tenant/hooks/useWorkspaceRoles";
import { useUsersContractList } from "@/tenant/hooks/collections/users";
import {
  getPrimaryEmail,
  resolveRoleDisplayName,
  workspaceRoleDescription,
  workspaceRoleLabel,
  type Contact,
  type Teacher,
} from "@mms/shared";

export interface FacultyUserAccountDraft {
  enabled: boolean;
  role: string;
  setupMethod: "password" | "invite";
  password?: string;
  forceReset?: boolean;
}

export interface FacultyUserAccountSectionProps {
  teacherDraft: Partial<Teacher>;
  linkedContact?: Contact | null;
  userAccountDraft: FacultyUserAccountDraft;
  onUserAccountDraftChange: (draft: FacultyUserAccountDraft) => void;
  errors: Record<string, string>;
}

export function FacultyUserAccountSection({
  teacherDraft,
  linkedContact,
  userAccountDraft,
  onUserAccountDraftChange,
  errors,
}: FacultyUserAccountSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const workspaceRoles = useWorkspaceRoles();
  const primaryEmail = linkedContact ? getPrimaryEmail(linkedContact) : null;

  const usersQuery = useUsersContractList({ limit: 100 }, Boolean(teacherDraft.contactId));
  const existingUsers = (usersQuery.data as { users?: Array<{ id: string; contactId?: string | number; email?: string; role?: string; status?: string }> })?.users;

  const linkedUser = useMemo(() => {
    if (!teacherDraft.contactId && !teacherDraft.userId) return null;
    return existingUsers?.find(
      (u) =>
        (teacherDraft.userId && u.id === teacherDraft.userId) ||
        (teacherDraft.contactId && String(u.contactId) === String(teacherDraft.contactId)),
    );
  }, [existingUsers, teacherDraft.contactId, teacherDraft.userId]);

  const roleOptions = useMemo(() => {
    return workspaceRoles.map((role) => ({
      value: role.id,
      label: `${workspaceRoleLabel(role, t)}${!role.isSystem ? ` (${t("contacts.form.tabCustom")})` : ""}`,
    }));
  }, [workspaceRoles, t]);

  const selectedRoleObj = useMemo(() => {
    const roleId = linkedUser ? (userAccountDraft.role || linkedUser.role) : userAccountDraft.role;
    return workspaceRoles.find((r) => r.id === roleId);
  }, [workspaceRoles, linkedUser, userAccountDraft.role]);

  if (linkedUser) {
    return (
      <SectionCard
        title={t("teachers.form.linkedUserAccount")}
        icon={UserCheck}
        accentColor="primary"
        className="z-elevated"
      >
        <div className="space-y-4 text-start">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-border bg-muted/20">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">{linkedUser.email}</p>
              <p className="text-xs text-muted-foreground">{t("teachers.form.linkedUserAccountHint")}</p>
            </div>
            <Badge pill tone="primary" className="px-2.5 font-bold">
              {resolveRoleDisplayName(linkedUser.role || "teacher", workspaceRoles, t)}
            </Badge>
          </div>

          <Field
            label={t("users.fieldRole")}
            id="linked-user-role"
            error={errors["user.role"]}
          >
            <FormSelect
              id="linked-user-role"
              name="linkedUserRole"
              value={userAccountDraft.role || linkedUser.role || "teacher"}
              onChange={(role) => onUserAccountDraftChange({ ...userAccountDraft, enabled: true, role })}
              options={roleOptions}
            />
            {selectedRoleObj && workspaceRoleDescription(selectedRoleObj, t) ? (
              <p className="text-xs text-muted-foreground mt-1">{workspaceRoleDescription(selectedRoleObj, t)}</p>
            ) : null}
          </Field>
        </div>
      </SectionCard>
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
            <p className="text-sm font-semibold text-foreground">
              {t("teachers.form.grantLoginAccess")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("teachers.form.grantLoginAccessHint")}
            </p>
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
          <div className="space-y-4 pt-2 border-t border-border/50">
            {!primaryEmail ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{t("teachers.form.noEmailWarning")}</span>
              </div>
            ) : null}

            <Field
              label={t("users.fieldRole")}
              id="faculty-user-role"
              required
              error={errors["user.role"]}
            >
              <FormSelect
                id="faculty-user-role"
                name="facultyUserRole"
                value={userAccountDraft.role || "teacher"}
                onChange={(role) => onUserAccountDraftChange({ ...userAccountDraft, role })}
                options={roleOptions}
              />
              {selectedRoleObj ? (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>{workspaceRoleDescription(selectedRoleObj, t)}</span>
                </div>
              ) : null}
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <Field
                label={t("users.addAccountMethod")}
                id="faculty-user-setup-method"
              >
                <FormSelect
                  id="faculty-user-setup-method"
                  name="facultyUserSetupMethod"
                  value={userAccountDraft.setupMethod}
                  onChange={(val) =>
                    onUserAccountDraftChange({
                      ...userAccountDraft,
                      setupMethod: val as "password" | "invite",
                    })
                  }
                  options={[
                    { value: "password", label: t("users.addMethodPassword") },
                    { value: "invite", label: t("users.addMethodInvite") },
                  ]}
                />
              </Field>

              {userAccountDraft.setupMethod === "password" ? (
                <Field
                  label={t("auth.password")}
                  id="faculty-user-password"
                  required
                  error={errors["user.password"]}
                >
                  <PasswordInput
                    id="faculty-user-password"
                    value={userAccountDraft.password || ""}
                    onChange={(e) =>
                      onUserAccountDraftChange({ ...userAccountDraft, password: e.target.value })
                    }
                    placeholder="••••••••"
                  />
                </Field>
              ) : null}
            </div>

            {userAccountDraft.setupMethod === "password" ? (
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="faculty-user-force-reset"
                  checked={userAccountDraft.forceReset !== false}
                  onCheckedChange={(checked) =>
                    onUserAccountDraftChange({
                      ...userAccountDraft,
                      forceReset: Boolean(checked),
                    })
                  }
                />
                <label
                  htmlFor="faculty-user-force-reset"
                  className="text-xs text-muted-foreground cursor-pointer select-none font-medium"
                >
                  {t("users.addForceReset")}
                </label>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
