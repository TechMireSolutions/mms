import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, UserPlus, ChevronRight, ChevronLeft, Check,
  Eye, EyeOff, Info, Mail, Lock, User, Phone,
  ShieldCheck, AlertCircle, Loader2, CalendarClock, Search
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
import useTranslation from "@/hooks/useTranslation";
import useGlobalSettings from "@/hooks/useGlobalSettings";
import { useWorkspaceRoles } from "@/hooks/useWorkspaceRoles";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { useLiveCollection } from "@/hooks/useLiveCollection";
import {
  getPasswordPolicyHintKey,
  toTitleCase,
  translateApp,
  validatePasswordPolicy,
} from "@mms/shared";
import { CONTACTS } from '@/lib/data/contactsData';
import type { Contact } from "../../lib/contactFields";
import { getGlobalSettings, getObject } from "../../lib/db";
import {
  DEFAULT_USERS_SETTINGS,
  DEFAULT_USERS_FIELD_DEFS,
  getSortedFields,
} from "@mms/shared";
import { DatePicker } from "../ui/DatePicker";
import { FORM_INPUT, FORM_LABEL, FORM_INPUT_ICON, FORM_SELECT, FORM_TEXTAREA } from "@/components/ui/formStyles";

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
      {STEP_DEFS.map((s, i) => {
        const done    = step > s.id;
        const active  = step === s.id;
        const Icon    = s.icon;
        return (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                done   ? "bg-primary border-primary text-primary-foreground" :
                active ? "border-primary bg-primary/10 text-primary" :
                         "border-border bg-muted text-muted-foreground"
               }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap ${active ? "text-primary" : "text-muted-foreground"}`}>
                {t(s.labelKey)}
              </span>
            </div>
            {i < STEP_DEFS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 mx-1 transition-all ${step > s.id ? "bg-primary" : "bg-border"}`} />
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

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Customized text input field wrapper.
 *
 * @param props - Input options and HTML attributes.
 * @returns The styled input field.
 */
function Input({ icon: Icon, className = "", ...props }: InputProps): JSX.Element {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />}
      <input
        {...props}
        className={`${Icon ? FORM_INPUT_ICON : FORM_INPUT} ${className}`}
      />
    </div>
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
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowPerms((v) => !v); }}
              className="text-[10px] text-primary font-semibold flex items-center gap-0.5 hover:underline"
            >
              <Info className="w-3 h-3" /> {showPerms ? t("users.addHidePermissions") : t("users.addShowPermissions")}
            </button>
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
                .filter(([mod]) => isRbacModuleEnabled(mod, globalSettings.enabledModules))
                .map(([mod, perms]) => (
                <div key={mod} className="text-[10px] text-muted-foreground">
                  <span className="font-semibold text-foreground">{rbacModuleLabel(mod, t)}:</span>{" "}
                  {perms.map((p) => t(`users.permission.${p}`)).join(", ")}
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
function Step1({ form, setForm, errors, existingEmails }: Step1Props): JSX.Element {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const contacts = useLiveCollection<Contact>('contacts', CONTACTS);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contacts.filter((c) => {
      const emailVal = (c.email as string | undefined) || c.emails?.[0]?.address || "";
      const phoneVal = (c.phone as string | undefined) || c.phones?.[0]?.number || "";
      return (
        c.name.toLowerCase().includes(q) ||
        emailVal.toLowerCase().includes(q) ||
        phoneVal.includes(q)
      );
    }).slice(0, 8);
  }, [search, contacts]);

  const selected = form.contactId ? contacts.find((c) => String(c.id) === String(form.contactId)) : null;

  const selectContact = (c: Contact) => {
    const primaryEmail = c.emails?.[0]?.address || (c.email as string | undefined) || "";
    const primaryPhone = c.phones?.[0]?.number || (c.phone as string | undefined) || "";
    setForm((f) => ({
      ...f,
      contactId: c.id,
      name: c.name,
      email: primaryEmail,
      phone: primaryPhone,
    }));
    setSearch("");
    setOpen(false);
  };

  const clear = () => {
    setForm((f) => ({ ...f, contactId: null, name: "", email: "", phone: "" }));
    setSearch("");
  };

  return (
    <div className="space-y-4">
      <div>
        <Label required>{t("users.addSearchContact")}</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={selected ? selected.name : search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); if (selected) clear(); }}
            onFocus={() => setOpen(true)}
            placeholder={t("users.addSearchPlaceholder")}
            className={FORM_INPUT_ICON}
          />
          {selected && (
            <button type="button" onClick={clear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <FieldError msg={errors.contactId} />

        <AnimatePresence>
          {open && !selected && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="mt-1 rounded-xl border border-border bg-background shadow-lg overflow-hidden z-10 relative">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">{t("users.addNoContacts")}</p>
              ) : (
                <ul className="max-h-48 overflow-y-auto divide-y divide-border">
                  {filtered.map((c) => {
                    const email = c.emails?.[0]?.address || (c.email as string | undefined) || "";
                    const phone = c.phones?.[0]?.number || (c.phone as string | undefined) || "";
                    const alreadyUser = existingEmails.includes(email.toLowerCase());
                    const avatarInitials = c.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                    const tagVal = c.tag as string | undefined;
                    return (
                      <li key={c.id}>
                        <button type="button" disabled={alreadyUser}
                          onClick={() => selectContact(c)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${alreadyUser ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"}`}>
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">{avatarInitials}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{email || phone}</p>
                          </div>
                          {tagVal && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border whitespace-nowrap">{tagVal}</span>}
                          {alreadyUser && <span className="text-[10px] text-muted-foreground">{t("users.addAlreadyUser")}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected contact preview */}
      {selected && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">{selected.name.split(" ").map((w) => w[0]).join("").slice(0,2).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{selected.name}</p>
              <p className="text-[11px] text-muted-foreground">{form.email}</p>
            </div>
            {(selected.tag as string | undefined) && <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">{selected.tag as string}</span>}
          </div>
          {form.phone && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> {form.phone}
            </p>
          )}
        </motion.div>
      )}

      <div>
        <Label>{t("users.fieldStatus")}</Label>
        <select
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as UserStatus }))}
          className={FORM_SELECT}
        >
          {USER_STATUS_VALUES.map((s) => (
            <option key={s} value={s}>
              {t(`users.status.${s}`)}
            </option>
          ))}
        </select>
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

  const settings = getObject("users_settings", DEFAULT_USERS_SETTINGS);
  const customFields = settings.customFields || [];
  const fieldOrder = settings.fieldOrder || DEFAULT_USERS_SETTINGS.fieldOrder || [];
  const fields = settings.fields || DEFAULT_USERS_SETTINGS.fields || {};

  const orderedFields = getSortedFields(
    DEFAULT_USERS_FIELD_DEFS,
    fieldOrder,
    fields,
    customFields
  );

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
          <input type="checkbox" checked={!!form.temporaryRole}
            onChange={(e) => setForm((f) => ({ ...f, temporaryRole: e.target.checked, roleExpiry: "" }))}
            className="rounded" />
          <div className="flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">{t("users.addTemporaryRole")}</span>
          </div>
        </label>
        <AnimatePresence>
          {form.temporaryRole && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2">
              <DatePicker value={form.roleExpiry || ""}
                min={new Date().toISOString().split("T")[0]}
                onChange={(val) => setForm((f) => ({ ...f, roleExpiry: val }))}
                className={FORM_INPUT} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic custom fields */}
      {orderedFields.filter(f => !["name", "email", "role"].includes(f.id)).length > 0 && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">{t("users.addAdditionalDetails")}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orderedFields.filter(f => !["name", "email", "role"].includes(f.id)).map((field) => {
              const value = (form as any)[field.id] ?? "";
              const upd = (val: any) => setForm((f) => ({ ...f, [field.id]: val }));
              return (
                <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <Label required={field.required}>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <textarea
                      className={FORM_TEXTAREA + " min-h-[60px]"}
                      value={value as string}
                      onChange={(e) => upd(e.target.value)}
                      placeholder={field.placeholder || t("users.addEnterField", { label: field.label.toLowerCase() })}
                      required={field.required}
                    />
                  ) : field.type === "select" ? (
                    <select
                      className={FORM_SELECT}
                      value={value as string}
                      onChange={(e) => upd(e.target.value)}
                      required={field.required}
                    >
                      <option value="">{t("users.addSelectOption")}</option>
                      {field.options?.map((opt: string) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "boolean" ? (
                    <label className="flex items-center gap-2.5 py-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => upd(e.target.checked)}
                        className="w-4 h-4 rounded border border-border accent-primary cursor-pointer"
                      />
                      <span className="text-xs font-medium text-foreground">{field.label}</span>
                    </label>
                  ) : field.type === "number" ? (
                    <input
                      type="number"
                      className={FORM_INPUT}
                      value={value}
                      onChange={(e) => upd(e.target.value)}
                      placeholder={field.placeholder || t("users.addEnterNumber")}
                      required={field.required}
                    />
                  ) : field.type === "date" ? (
                    <DatePicker
                      value={value as string}
                      onChange={(val) => upd(val)}
                      required={field.required}
                    />
                  ) : (
                    <input
                      type="text"
                      className={FORM_INPUT}
                      value={value as string}
                      onChange={(e) => upd(e.target.value)}
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
          ].map((opt) => {
            const Icon = opt.icon;
            const active = form.setupMethod === opt.id;
            return (
              <button type="button" key={opt.id} onClick={() => setForm((f) => ({ ...f, setupMethod: opt.id as "invite" | "password" }))}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                }`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-[11px] font-bold ${active ? "text-primary" : "text-foreground"}`}>{t(opt.labelKey)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">{t(opt.descKey)}</p>
              </button>
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
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder={passwordHint}
                  value={form.password || ""}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className={`${FORM_INPUT_ICON} pr-9`}
                />
                <button type="button" onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <FieldError msg={errors.password} />
              <p className="mt-1 text-[10px] text-muted-foreground">{passwordHint}</p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.forceReset !== false}
                onChange={(e) => setForm((f) => ({ ...f, forceReset: e.target.checked }))}
                className="rounded" />
              <span className="text-xs font-medium text-foreground">{t("users.addForceReset")}</span>
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2FA option */}
      <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
        <input type="checkbox" checked={!!form.twoFactorEnabled}
          onChange={(e) => setForm((f) => ({ ...f, twoFactorEnabled: e.target.checked }))}
          className="rounded" />
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
export default function AddUserModal({ onClose, onAdd, existingEmails = [] }: AddUserModalProps): JSX.Element {
  const { t } = useTranslation();
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

      const settings = getObject("users_settings", DEFAULT_USERS_SETTINGS);
      const customFields = settings.customFields || [];
      for (const cf of customFields) {
        if (cf.required) {
          const val = (form as unknown as Record<string, unknown>)[cf.id];
          if (val === undefined || val === null || val === "") {
            e.role = t("users.addErrorFieldRequired", { label: cf.label });
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
    setStep((s) => s + 1);
  };

  const handleBack = (): void => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const handleSubmit = (): void => {
    if (!validate()) return;
    setSubmitting(true);
    const settings = getObject("users_settings", DEFAULT_USERS_SETTINGS);
    const customFields = settings.customFields || [];
    const newUser: SystemUser = {
      id: `u${Date.now()}`,
      name: toTitleCase(form.name.trim()) as string,
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      role: form.role,
      status: form.setupMethod === "invite" ? "inactive" : form.status,
      twoFactorEnabled: form.twoFactorEnabled,
      lastLogin: "",
      createdDate: new Date().toISOString().split("T")[0],
      failedLoginAttempts: 0,
      activeSessions: 0,
      avatarInitials: form.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
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
      size="md"
      footer={
        success ? undefined : (
          <div className="flex w-full items-center justify-between gap-2">
            <Button type="button" variant="outline" onClick={step === 1 ? onClose : handleBack}>
              {step === 1 ? <X className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
              {step === 1 ? t("users.cancel") : t("users.addBack")}
            </Button>
            <div className="flex items-center gap-1.5">
              {STEP_DEFS.map((s) => (
                <div
                  key={s.id}
                  className={`h-1.5 rounded-full transition-all ${step === s.id ? "w-3 bg-primary" : step > s.id ? "w-1.5 bg-primary/40" : "w-1.5 bg-border"}`}
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
