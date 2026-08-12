import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import { CustomFieldInput } from "@/components/ui/FormCustomFieldInput";
import { Field } from "@/components/ui/FormPrimitives";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useTranslation } from "@/hooks/useTranslation";
import { useUsersConfig } from "@/hooks/useStandardModuleConfig";
import { useWorkspaceRoles } from "@/tenant/hooks/useWorkspaceRoles";
import { todayISO } from "@mms/shared";
import { FieldError } from "./AddUserModalFieldHelpers";
import { RoleCard } from "./AddUserModalRoleCard";
import type { AddUserFormValue, AddUserStepProps } from "./addUserModalTypes";

export function Step2({ form, setForm, errors }: AddUserStepProps): JSX.Element {
  const { t } = useTranslation();
  const workspaceRoles = useWorkspaceRoles();
  const selectRole = (id: string): void => setForm((previousForm) => ({ ...previousForm, role: id }));

  const { orderedFields } = useUsersConfig();
  const additionalFields = orderedFields.filter((field) => !["name", "email", "role"].includes(field.id));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {workspaceRoles.map((role) => (
          <RoleCard key={role.id} role={role} selected={form.role === role.id} onSelect={selectRole} />
        ))}
      </div>
      <FieldError msg={errors.role} />

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={!!form.temporaryRole}
            onCheckedChange={(checked) => setForm((previousForm) => ({ ...previousForm, temporaryRole: !!checked, roleExpiry: "" }))}
          />
          <div className="flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">{t("users.addTemporaryRole")}</span>
          </div>
        </label>
        <AnimatePresence>
          {form.temporaryRole && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-2"
            >
              <DatePicker
                id="users-role-expiry"
                name="roleExpiry"
                value={form.roleExpiry || ""}
                min={todayISO()}
                onChange={(val) => setForm((previousForm) => ({ ...previousForm, roleExpiry: val }))}
                className="w-full"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {additionalFields.length > 0 && (
        <div className="space-y-4">
          <SectionLabel as="h4" className="ps-1">{t("users.addAdditionalDetails")}</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {additionalFields.map((field) => {
              const value = form[field.id] ?? "";
              const updateFieldValue = (fieldValue: AddUserFormValue): void => {
                setForm((previousForm) => ({ ...previousForm, [field.id]: fieldValue }));
              };
              const fieldId = `users-custom-${field.id}`;

              // Boolean fields render inline with label (checkbox UX).
              if (field.type === "boolean") {
                return (
                  <div key={field.id}>
                    <label className="flex items-center gap-2.5 py-2 cursor-pointer select-none">
                      <Checkbox
                        id={fieldId}
                        checked={!!value}
                        onCheckedChange={(checked) => updateFieldValue(!!checked)}
                      />
                      <span className="text-xs font-medium text-foreground">{field.label}</span>
                    </label>
                  </div>
                );
              }

              // Use the shared CustomFieldInput component — eliminates the hand-rolled type-switch.
              const adaptedField = {
                key: field.id,
                label: field.label,
                type: (field.type || "text") as any,
                required: field.required,
                options: field.options,
                placeholder: field.placeholder || t("users.addEnterField", { label: field.label.toLowerCase() }),
                defaultValue: field.defaultValue,
              };

              return (
                <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <Field id={fieldId} label={field.label} required={field.required}>
                    <CustomFieldInput
                      field={adaptedField as any}
                      value={value}
                      onChange={(val) => updateFieldValue(val as AddUserFormValue)}
                    />
                  </Field>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
