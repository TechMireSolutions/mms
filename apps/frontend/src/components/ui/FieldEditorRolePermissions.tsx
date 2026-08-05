import type { AppTranslationKey, WorkspaceRole } from "@mms/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { useTranslation } from "@/hooks/useTranslation";
import { useWorkspaceRoles } from "@/tenant/hooks/useWorkspaceRoles";

function roleLabel(
  role: WorkspaceRole,
  t: (key: AppTranslationKey) => string,
): string {
  return role.customLabel?.trim() || t(role.labelKey);
}

/** Role multi-select for field visibility (`permissions[]` = role ids). */
export function FieldEditorRolePermissions({
  selected,
  onChange,
  fieldKey,
}: {
  selected: string[];
  onChange: (roles: string[]) => void;
  fieldKey: string;
}): JSX.Element {
  const { t } = useTranslation();
  const roles = useWorkspaceRoles();
  const selectedSet = new Set(selected);

  const toggleRole = (roleId: string): void => {
    if (selectedSet.has(roleId)) {
      onChange(selected.filter((id) => id !== roleId));
      return;
    }
    onChange([...selected, roleId]);
  };

  return (
    <div className="space-y-2 text-start">
      <p className={FORM_LABEL} id={`perm-label-${fieldKey}`}>
        {t("fields.permissionsLabel")}
      </p>
      <p className="text-xs text-muted-foreground">{t("fields.permissionsHint")}</p>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-labelledby={`perm-label-${fieldKey}`}
      >
        {roles.map((role) => {
          const inputId = `perm-${fieldKey}-${role.id}`;
          const checked = selectedSet.has(role.id);
          return (
            <label
              key={role.id}
              htmlFor={inputId}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-sm font-medium text-foreground"
            >
              <Checkbox
                id={inputId}
                checked={checked}
                onCheckedChange={() => toggleRole(role.id)}
                aria-label={roleLabel(role, t)}
              />
              <span>{roleLabel(role, t)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
