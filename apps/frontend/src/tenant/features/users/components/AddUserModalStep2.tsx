import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_INPUT } from "@/components/ui/formStyles";
import { Input as UiInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/useTranslation";
import { useUsersConfig } from "@/hooks/useStandardModuleConfig";
import { useWorkspaceRoles } from "@/tenant/hooks/useWorkspaceRoles";
import { todayISO } from "@mms/shared";
import { FieldError, Label } from "./AddUserModalFieldHelpers";
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
                value={form.roleExpiry || ""}
                min={todayISO()}
                onChange={(val) => setForm((previousForm) => ({ ...previousForm, roleExpiry: val }))}
                className={FORM_INPUT}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {additionalFields.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest ps-1">{t("users.addAdditionalDetails")}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {additionalFields.map((field) => {
              const value = form[field.id] ?? "";
              const updateFieldValue = (fieldValue: AddUserFormValue): void => {
                setForm((previousForm) => ({ ...previousForm, [field.id]: fieldValue }));
              };
              return (
                <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <Label required={field.required}>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      className="min-h-[3.75rem]"
                      value={String(value)}
                      onChange={(event) => updateFieldValue(event.target.value)}
                      placeholder={field.placeholder || t("users.addEnterField", { label: field.label.toLowerCase() })}
                      required={field.required}
                    />
                  ) : field.type === "select" ? (
                    <FormSelect
                      value={String(value)}
                      onChange={updateFieldValue}
                      options={field.options || []}
                      placeholder={t("users.addSelectOption")}
                    />
                  ) : field.type === "boolean" ? (
                    <label className="flex items-center gap-2.5 py-2 cursor-pointer select-none">
                      <Checkbox
                        checked={!!value}
                        onCheckedChange={(checked) => updateFieldValue(!!checked)}
                      />
                      <span className="text-xs font-medium text-foreground">{field.label}</span>
                    </label>
                  ) : field.type === "number" ? (
                    <UiInput
                      type="number"
                      value={typeof value === "number" || typeof value === "string" ? value : ""}
                      onChange={(event) => updateFieldValue(event.target.value)}
                      placeholder={field.placeholder || t("users.addEnterNumber")}
                      required={field.required}
                    />
                  ) : field.type === "date" ? (
                    <DatePicker
                      value={String(value)}
                      onChange={(val) => updateFieldValue(val)}
                      required={field.required}
                    />
                  ) : (
                    <UiInput
                      type="text"
                      value={String(value)}
                      onChange={(event) => updateFieldValue(event.target.value)}
                      placeholder={field.placeholder || t("users.addEnterField", { label: field.label.toLowerCase() })}
                      required={field.required}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
