import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, UserPlus, ChevronRight, ChevronLeft, Check,
  Eye, EyeOff, Info, Mail, Lock, User, Phone,
  ShieldCheck, AlertCircle, Loader2, CalendarClock
} from "lucide-react";
import {
  USER_STATUS_VALUES,
  isRbacModuleEnabled,
  rbacModuleLabel,
  workspaceRoleDescription,
  workspaceRoleLabel,
  type WorkspaceRole,
  type SystemUser,
  type UserStatus,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useGlobalSettings } from "@/tenant/hooks/useGlobalSettings";
import { useWorkspaceRoles } from "@/tenant/hooks/useWorkspaceRoles";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { Input as UiInput } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSelect } from "@/components/ui/FormSelect";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Textarea } from "@/components/ui/textarea";
import type { Contact } from "@mms/shared";
import {
  getPasswordPolicyHintKey,
  toTitleCase,
  translateApp,
  validatePasswordPolicy,
  getInitials,
  todayISO,
} from "@mms/shared";

import ContactPicker from '@/tenant/features/contacts/components/contactLink/ContactPicker';
import { getGlobalSettings } from "@/lib/db";
import { useUsersConfig } from "@/hooks/useStandardModuleConfig";
import { DatePicker } from "@/components/ui/DatePicker";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";

const STEP_DEFS = [
  { id: 1, labelKey: "users.addStepContact" as const, icon: User },
  { id: 2, labelKey: "users.addStepRoles" as const, icon: ShieldCheck },
  { id: 3, labelKey: "users.addStepAccount" as const, icon: Lock },
];

// ── Sub-components ───────────────────────────────────────────────────────────

interface StepIndicatorProps {
  step: number;
  t: ReturnType<typeof useTranslation>["t"];
}

function StepIndicator({ step, t }: StepIndicatorProps): JSX.Element {
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEP_DEFS.map((stepDefinition, stepIndex) => {
        const done    = step > stepDefinition.id;
        const active  = step === stepDefinition.id;
        const Icon    = stepDefinition.icon;
        return (
          <React.Fragment key={stepDefinition.id}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                done   ? "bg-primary border-primary text-primary-foreground" :
                active ? "border-primary bg-primary/10 text-primary" :
                         "border-border bg-muted text-muted-foreground"
               }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap ${active ? "text-primary" : "text-muted-foreground"}`}>
                {t(stepDefinition.labelKey)}
              </span>
            </div>
            {stepIndex < STEP_DEFS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 mx-1 transition-all ${step > stepDefinition.id ? "bg-primary" : "bg-border"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

interface FieldErrorProps {
  msg?: string;
}

/**
 * Small error message helper for form inputs.
 *
 * @param props - Error descriptor.
 * @returns The error message layout or null.
 */
function FieldError({ msg }: FieldErrorProps): JSX.Element | null {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-[11px] text-destructive font-medium mt-1">
      <AlertCircle className="w-3 h-3" /> {msg}
    </p>
  );
}

interface LabelProps {
  children: React.ReactNode;
  required?: boolean;
}

/**
 * Standard form label helper.
 *
 * @param props - Label contents and options.
 * @returns The label element.
 */
function Label({ children, required = false }: LabelProps): JSX.Element {
  return (
    <label className={FORM_LABEL}>
      {children}{required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}


interface RoleCardProps {
  role: WorkspaceRole;
  selected: boolean;
  onSelect: (id: string) => void;
}

function RoleCard({ role, selected, onSelect }: RoleCardProps): JSX.Element {
  const { t } = useTranslation();
  const globalSettings = useGlobalSettings();
  const [showPerms, setShowPerms] = useState(false);

  return (
    <div className={`rounded-xl border-2 transition-all cursor-pointer ${
      selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
    }`}>
      <div className="p-3 flex items-start gap-3" onClick={() => onSelect(role.id)}>
        <div className={`w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          selected ? "bg-primary border-primary" : "border-border"
        }`}>
          {selected && <Check className="w-2.5 h-2.5 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary">
              {workspaceRoleLabel(role, t)}
            </span>
            <Button
              type="button"
              variant="link"
              onClick={(event) => { event.stopPropagation(); setShowPerms((visible) => !visible); }}
              className="text-[10px] text-primary font-semibold flex items-center gap-0.5 hover:underline p-0 h-auto shadow-none"
            >
              <Info className="w-3 h-3" /> {showPerms ? t("users.addHidePermissions") : t("users.addShowPermissions")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{workspaceRoleDescription(role, t)}</p>
        </div>
      </div>

      <AnimatePresence>
        {showPerms && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-border">
            <div className="p-3 grid grid-cols-2 gap-1">
              {Object.entries(role.permissions || {})
                .filter(([moduleId]) => isRbacModuleEnabled(moduleId, globalSettings.enabledModules))
                .map(([moduleId, permissions]) => (
                <div key={moduleId} className="text-[10px] text-muted-foreground">
                  <span className="font-semibold text-foreground">{rbacModuleLabel(moduleId, t)}:</span>{" "}
                  {permissions.map((permissionAction) => t(`users.permission.${permissionAction}`)).join(", ")}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Form State ────────────────────────────────────────────────────────────────

interface AddUserFormState {
  contactId: string | number | null;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: UserStatus;
  temporaryRole: boolean;
  roleExpiry: string;
  setupMethod: "invite" | "password";
  password?: string;
  forceReset: boolean;
  twoFactorEnabled: boolean;
}

// ── Steps ────────────────────────────────────────────────────────────────────

interface Step1Props {
  form: AddUserFormState;
  setForm: React.Dispatch<React.SetStateAction<AddUserFormState>>;
  errors: Record<string, string>;
  existingEmails: string[];
}

/**
 * Step 1: Select Contact screen.
 *
 * @param props - Sub-form state.
 * @returns Contact selector section.
 */
function Step1({ form, setForm, errors }: Step1Props): JSX.Element {
  const { t } = useTranslation();

  const handleContactChange = (contactId: string | number | null, contact?: Contact | null): void => {
    if (!contactId || !contact) {
      setForm((previousForm) => ({ ...previousForm, contactId: null, name: "", email: "", phone: "" }));
      return;
    }
    const primaryEmail = contact.emails?.[0]?.address || (contact.email as string | undefined) || "";
    const primaryPhone = contact.phones?.[0]?.number || (contact.phone as string | undefined) || "";
    setForm((previousForm) => ({
      ...previousForm,
      contactId: contact.id,
      name: contact.name,
      email: primaryEmail,
      phone: primaryPhone,
    }));
  };

  const statusOptions = React.useMemo(() => USER_STATUS_VALUES.map((status) => ({
    value: status,
    label: t(`users.status.${status}`),
  })), [t]);

  return (
    <div className="space-y-4">
      <div>
        <ContactPicker
          label={t("users.addSearchContact")}
          value={form.contactId}
          onChange={handleContactChange}
          searchPlaceholder={t("users.addSearchPlaceholder")}
          emptyTitle={t("users.addNoContacts")}
        />
        <FieldError msg={errors.contactId} />
      </div>

      {form.contactId && form.name ? (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center gap-3">
            <UserAvatar id={form.contactId} name={form.name} className="w-10 h-10 rounded-full text-xs font-semibold" />
            <div>
              <p className="text-sm font-bold text-foreground">{form.name}</p>
              <p className="text-[11px] text-muted-foreground">{form.email}</p>
            </div>
          </div>
          {form.phone ? (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> {form.phone}
            </p>
          ) : null}
        </motion.div>
      ) : null}

      <div>
        <Label>{t("users.fieldStatus")}</Label>
        <FormSelect
          value={form.status}
          onChange={(val) => setForm((f) => ({ ...f, status: val as UserStatus }))}
          options={statusOptions}
        />
      </div>
    </div>
  );
}

interface Step2Props {
  form: AddUserFormState;
  setForm: React.Dispatch<React.SetStateAction<AddUserFormState>>;
  errors: Record<string, string>;
}

/**
 * Step 2: Role Assignment screen.
 *
 * @param props - Sub-form state.
 * @returns Role configuration section.
 */
function Step2({ form, setForm, errors }: Step2Props): JSX.Element {
  const { t } = useTranslation();
  const workspaceRoles = useWorkspaceRoles();
  const selectRole = (id: string): void => setForm((f) => ({ ...f, role: id }));

  const { orderedFields } = useUsersConfig();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {workspaceRoles.map((role) => (
          <RoleCard key={role.id} role={role} selected={form.role === role.id} onSelect={selectRole} />
        ))}
      </div>
      <FieldError msg={errors.role} />

      {/* Temporary role */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={!!form.temporaryRole}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, temporaryRole: !!checked, roleExpiry: "" }))} />
          <div className="flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">{t("users.addTemporaryRole")}</span>
          </div>
        </label>
        <AnimatePresence>
          {form.temporaryRole && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2">
              <DatePicker value={form.roleExpiry || ""}
                min={todayISO()}
                onChange={(val) => setForm((f) => ({ ...f, roleExpiry: val }))}
                className={FORM_INPUT} />

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic custom fields */}
      {orderedFields.filter((field) => !["name", "email", "role"].includes(field.id)).length > 0 && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{t("users.addAdditionalDetails")}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orderedFields.filter((field) => !["name", "email", "role"].includes(field.id)).map((field) => {
              const value = (form as unknown as Record<string, unknown>)[field.id] ?? "";
              const updateFieldValue = (fieldValue: unknown) => setForm((previousForm) => ({ ...previousForm, [field.id]: fieldValue }));
              return (
                <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <Label required={field.required}>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      className="min-h-[60px]"
                      value={value as string}
                      onChange={(e) => updateFieldValue(e.target.value)}
                      placeholder={field.placeholder || t("users.addEnterField", { label: field.label.toLowerCase() })}
                      required={field.required}
                    />
                  ) : field.type === "select" ? (
                    <FormSelect
                      value={value as string}
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
                      value={value as string | number}
                      onChange={(e) => updateFieldValue(e.target.value)}
                      placeholder={field.placeholder || t("users.addEnterNumber")}
                      required={field.required}
                    />
                  ) : field.type === "date" ? (
                    <DatePicker
                      value={value as string}
                      onChange={(val) => updateFieldValue(val)}
                      required={field.required}
                    />
                  ) : (
                    <UiInput
                      type="text"
                      value={value as string}
                      onChange={(e) => updateFieldValue(e.target.value)}
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

interface Step3Props {
  form: AddUserFormState;
  setForm: React.Dispatch<React.SetStateAction<AddUserFormState>>;
  errors: Record<string, string>;
}

/**
 * Step 3: Account Setup (Invite / Password) screen.
 *
 * @param props - Sub-form state.
 * @returns Account authentication settings section.
 */
function Step3({ form, setForm, errors }: Step3Props): JSX.Element {
  const { t } = useTranslation();
  const [showPwd, setShowPwd] = useState(false);
  const gs = getGlobalSettings();
  const passwordHint = translateApp(getPasswordPolicyHintKey(gs.passwordPolicy), gs.language);

  return (
    <div className="space-y-4">
      <div>
        <Label>{t("users.addAccountMethod")}</Label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {[
            { id: "invite", labelKey: "users.addMethodInvite" as const, descKey: "users.addMethodInviteDesc" as const, icon: Mail },
            { id: "password", labelKey: "users.addMethodPassword" as const, descKey: "users.addMethodPasswordDesc" as const, icon: Lock },
          ].map((setupOption) => {
            const Icon = setupOption.icon;
            const active = form.setupMethod === setupOption.id;
            return (
              <Button type="button" variant="ghost" key={setupOption.id} onClick={() => setForm((previousForm) => ({ ...previousForm, setupMethod: setupOption.id as "invite" | "password" }))}
                className={`p-3 rounded-xl border-2 text-left transition-all h-auto flex flex-col items-start shadow-none ${
                  active ? "border-primary bg-primary/5 hover:bg-primary/5 text-foreground" : "border-border bg-card hover:border-primary/40 text-muted-foreground hover:text-foreground"
                }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-[11px] font-bold ${active ? "text-primary" : "text-foreground"}`}>{t(setupOption.labelKey)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">{t(setupOption.descKey)}</p>
              </Button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {form.setupMethod === "invite" && (
          <motion.div key="invite" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{t("users.addInviteTitle")}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("users.addInviteBody", { email: form.email || "…" })}
            </p>
            <p className="text-[10px] text-muted-foreground">{t("users.addInvitePending")}</p>
          </motion.div>
        )}

        {form.setupMethod === "password" && (
          <motion.div key="password" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div>
              <Label required>{t("users.addTempPassword")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <UiInput
                  type={showPwd ? "text" : "password"}
                  placeholder={passwordHint}
                  value={form.password || ""}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="pl-9.5 pr-9"
                />
                <Button type="button" variant="ghost" onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground h-auto p-0 hover:bg-transparent shadow-none"
                >
                  {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
              </div>
              <FieldError msg={errors.password} />
              <p className="mt-1 text-[10px] text-muted-foreground">{passwordHint}</p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={form.forceReset !== false}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, forceReset: !!checked }))} />
              <span className="text-xs font-medium text-foreground">{t("users.addForceReset")}</span>
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2FA option */}
      <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
        <Checkbox checked={!!form.twoFactorEnabled}
          onCheckedChange={(checked) => setForm((f) => ({ ...f, twoFactorEnabled: !!checked }))} />
        <div>
          <span className="text-xs font-semibold text-foreground">{t("users.add2faTitle")}</span>
          <p className="text-[10px] text-muted-foreground">{t("users.add2faDesc")}</p>
        </div>
      </label>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export interface AddUserModalProps {
  onClose: () => void;
  onAdd: (user: SystemUser) => void;
  existingEmails?: string[];
}

/**
 * AddUserModal component renders a multi-step registration modal to create a new user.
 *
 * @param props - AddUserModal properties.
 * @returns The modal dialog element.
 */
export function AddUserModal({ onClose, onAdd, existingEmails = [] }: AddUserModalProps): JSX.Element {
  const { t } = useTranslation();
  const { customFields } = useUsersConfig();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<AddUserFormState>({
    contactId: null, name: "", email: "", phone: "",
    role: '', status: "active",
    temporaryRole: false, roleExpiry: "",
    setupMethod: "invite",
    password: "", forceReset: true,
    twoFactorEnabled: false,
  });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!form.contactId) e.contactId = t("users.addErrorContact");
      else if (!form.email.trim()) e.contactId = t("users.addErrorContactEmail");
      else if (existingEmails.includes(form.email.toLowerCase())) e.contactId = t("users.addErrorContactExists");
    }
    if (step === 2) {
      if (!form.role) e.role = t("users.addErrorRole");

      for (const customField of customFields) {
        if (customField.required) {
          const fieldValue = (form as unknown as Record<string, unknown>)[customField.id];
          if (fieldValue === undefined || fieldValue === null || fieldValue === "") {
            e.role = t("users.addErrorFieldRequired", { label: customField.label });
          }
        }
      }
    }
    if (step === 3 && form.setupMethod === "password") {
      if (!form.password) {
        e.password = t("users.addErrorPassword");
      } else {
        const policyResult = validatePasswordPolicy(
          form.password,
          getGlobalSettings().passwordPolicy
        );
        if (!policyResult.valid) {
          e.password = policyResult.errorKey
            ? translateApp(policyResult.errorKey, getGlobalSettings().language)
            : policyResult.message;
        }
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = (): void => {
    if (!validate()) return;
    setStep((currentStep) => currentStep + 1);
  };

  const handleBack = (): void => {
    setErrors({});
    setStep((currentStep) => currentStep - 1);
  };

  const handleSubmit = (): void => {
    if (!validate()) return;
    setSubmitting(true);
    const newUser: SystemUser = {
      id: `u${Date.now()}`,
      contactId: form.contactId!,
      name: toTitleCase(form.name.trim()) as string,
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      role: form.role,
      status: form.setupMethod === "invite" ? "inactive" : form.status,
      mustChangePassword: form.setupMethod === "password" ? form.forceReset !== false : false,
      temporaryPassword: form.setupMethod === "password" ? form.password : undefined,
      twoFactorEnabled: form.twoFactorEnabled,
      lastLogin: "",
      createdDate: todayISO(),
      failedLoginAttempts: 0,

      activeSessions: 0,
      avatarInitials: getInitials(form.name),
      ...Object.fromEntries(
        customFields.map((cf) => [cf.id, (form as unknown as Record<string, unknown>)[cf.id] ?? cf.defaultValue ?? ""])
      ),
    };
    setSubmitting(false);
    setSuccess(true);
    onAdd(newUser);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t("users.addTitle")}
      subtitle={t("users.addSubtitle")}
      icon={UserPlus}
      size="lg"
      footer={
        success ? undefined : (
          <div className="flex w-full items-center justify-between gap-2">
            <Button type="button" variant="outline" onClick={step === 1 ? onClose : handleBack}>
              {step === 1 ? <X className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
              {step === 1 ? t("users.cancel") : t("users.addBack")}
            </Button>
            <div className="flex items-center gap-1.5">
              {STEP_DEFS.map((stepDefinition) => (
                <div
                  key={stepDefinition.id}
                  className={`h-1.5 rounded-full transition-all ${step === stepDefinition.id ? "w-3 bg-primary" : step > stepDefinition.id ? "w-1.5 bg-primary/40" : "w-1.5 bg-border"}`}
                />
              ))}
            </div>
            {step < 3 ? (
              <Button type="button" onClick={handleNext}>
                {t("users.addNext")} <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                {submitting ? t("users.addCreating") : t("users.addCreate")}
              </Button>
            )}
          </div>
        )
      }
    >
      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center gap-4 py-10 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="text-base font-bold text-foreground">{t("users.addSuccessTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {form.setupMethod === "invite"
                ? t("users.addSuccessInvite", { email: form.email })
                : t("users.addSuccessPassword", { name: form.name })}
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          <StepIndicator step={step} t={t} />
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
            >
              {step === 1 && (
                <Step1 form={form} setForm={setForm} errors={errors} existingEmails={existingEmails} />
              )}
              {step === 2 && <Step2 form={form} setForm={setForm} errors={errors} />}
              {step === 3 && <Step3 form={form} setForm={setForm} errors={errors} />}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </Modal>
  );
}
