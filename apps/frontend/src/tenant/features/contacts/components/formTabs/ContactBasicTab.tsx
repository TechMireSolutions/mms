import React, { ChangeEvent } from "react";
import { User, FileText, Camera, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/DatePicker";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { AvatarCropper } from "@/components/ui/AvatarCropper";
import { Field, EditableSelect } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Contact,
  getDisplayName,
  formatCnic,
  toTitleCase,
  GENDERS,
} from "@mms/shared";

export interface ContactBasicTabProps {
  contactDraft: Partial<Contact>;
  formInstanceId: string;
  isFieldEnabled: (tabId: string, fieldId: string) => boolean;
  getFieldError: (fieldId: string) => string | undefined;
  updateDraft: (patch: Partial<Contact>) => void;
  cropSrc: string | null;
  setCropSrc: (src: string | null) => void;
  genders: string[];
  lockGender: boolean;
  handleAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function ContactBasicTab({
  contactDraft,
  formInstanceId,
  isFieldEnabled,
  getFieldError,
  updateDraft,
  cropSrc,
  setCropSrc,
  genders,
  lockGender,
  handleAvatarChange,
}: ContactBasicTabProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 text-left">
      <SectionCard
        title={t("contacts.form.createNewContact")}
        icon={User}
        accentColor="primary"
      >
        {isFieldEnabled("basic", "avatar") && (
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 mb-2 border-b border-border/60">
            {cropSrc && (
              <AvatarCropper
                src={cropSrc}
                onCrop={(url) => {
                  updateDraft({ avatar: url });
                  setCropSrc(null);
                }}
                onCancel={() => setCropSrc(null)}
              />
            )}
            <div className="relative flex-shrink-0 group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary/30 via-accent/30 to-secondary/30 group-hover:from-primary/60 group-hover:via-accent/60 group-hover:to-secondary/60 blur-[2px] transition-all duration-500 opacity-75 group-hover:opacity-100" />
              <div className="relative w-20 h-20 rounded-full bg-card overflow-hidden flex items-center justify-center border border-border/80 shadow-surface group-hover:scale-[1.02] transition-transform duration-300">
                <UserAvatar
                  id={contactDraft.id}
                  name={getDisplayName(contactDraft)}
                  avatar={contactDraft.avatar}
                  className="w-full h-full text-2xl"
                />

                <label className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white gap-1 rounded-full">
                  <Camera className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {t("account.changePhoto")}
                  </span>
                  <input
                    id="contact-avatar-file-input"
                    name="avatarFile"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    aria-label={t("account.changePhoto")}
                  />
                </label>
              </div>
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground truncate">
                {contactDraft.name || t("contacts.form.createNewContact")}
              </h3>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                {contactDraft.gender &&
                  contactDraft.gender !== "unspecified" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border/80">
                      {contactDraft.gender}
                    </span>
                  )}
                {contactDraft.isSyed && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/20">
                    {t("contacts.reportFields.isSyed")}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isFieldEnabled("basic", "firstName") && (
            <Field
              label={t("contacts.reportFields.firstName")}
              required
              error={getFieldError("firstName")}
              id={`cf-${formInstanceId}-firstName`}
            >
              <div className="relative flex items-center group/input">
                <User className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id={`cf-${formInstanceId}-firstName`}
                  name="firstName"
                  value={contactDraft.firstName || ""}
                  onChange={(e) => updateDraft({ firstName: e.target.value })}
                  placeholder={t("contacts.reportFields.firstName")}
                  className="pl-10"
                />
              </div>
            </Field>
          )}

          {isFieldEnabled("basic", "lastName") && (
            <Field
              label={t("contacts.reportFields.lastName")}
              error={getFieldError("lastName")}
              id={`cf-${formInstanceId}-lastName`}
            >
              <div className="relative flex items-center group/input">
                <User className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id={`cf-${formInstanceId}-lastName`}
                  name="lastName"
                  value={contactDraft.lastName || ""}
                  onChange={(e) => updateDraft({ lastName: e.target.value })}
                  placeholder={t("contacts.reportFields.lastName")}
                  className="pl-10"
                />
              </div>
            </Field>
          )}

          {isFieldEnabled("basic", "gender") && (
            <Field
              label={t("contacts.reportFields.gender")}
              error={getFieldError("gender")}
              id={`cf-${formInstanceId}-gender`}
            >
              {lockGender ? (
                <div className="flex h-10 w-full items-center rounded-xl border border-border bg-muted/40 px-3.5 text-xs text-muted-foreground select-none font-semibold">
                  {toTitleCase(contactDraft.gender || "unspecified")}
                </div>
              ) : (
                <EditableSelect
                  id={`cf-${formInstanceId}-gender`}
                  options={
                    genders.length > 0
                      ? genders
                      : (GENDERS as unknown as string[])
                  }
                  value={contactDraft.gender || ""}
                  onChange={(val) => updateDraft({ gender: val.toLowerCase() })}
                  placeholder={t("contacts.form.selectOption")}
                  className="w-full"
                />
              )}
            </Field>
          )}

          {isFieldEnabled("basic", "dob") && (
            <Field
              label={t("contacts.reportFields.dob")}
              error={getFieldError("dob")}
              id={`cf-${formInstanceId}-dob`}
            >
              <DatePicker
                id={`cf-${formInstanceId}-dob`}
                name="dob"
                value={contactDraft.dob || undefined}
                onChange={(dateStr) => updateDraft({ dob: dateStr })}
              />
            </Field>
          )}

          {isFieldEnabled("basic", "cnic") && (
            <Field
              label={t("contacts.form.cnic")}
              id={`cf-${formInstanceId}-cnic`}
              error={getFieldError("cnic")}
            >
              <div className="relative flex items-center group/input">
                <FileText className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                <Input
                  id={`cf-${formInstanceId}-cnic`}
                  name="cnic"
                  value={contactDraft.cnic || ""}
                  onChange={(e) => {
                    const formatted = formatCnic(e.target.value);
                    updateDraft({ cnic: formatted });
                  }}
                  placeholder={t("contacts.form.cnicPlaceholder")}
                  className="pl-10"
                />
              </div>
            </Field>
          )}

          {isFieldEnabled("basic", "isSyed") && (
            <div className="flex flex-col justify-end min-h-[44px]">
              <label
                htmlFor="isSyed"
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none",
                  contactDraft.isSyed
                    ? "bg-primary/10 border-primary/40 text-primary font-bold shadow-sm"
                    : "bg-muted/30 border-border/70 hover:bg-muted/50 text-muted-foreground",
                )}
              >
                <Checkbox
                  id="isSyed"
                  name="isSyed"
                  checked={Boolean(contactDraft.isSyed)}
                  onCheckedChange={(checked) =>
                    updateDraft({ isSyed: Boolean(checked) })
                  }
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Star
                  className={cn(
                    "w-4 h-4 transition-colors",
                    contactDraft.isSyed
                      ? "fill-primary text-primary"
                      : "text-muted-foreground/60",
                  )}
                />
                <span className="text-xs font-semibold">
                  {t("contacts.reportFields.isSyed")}
                </span>
              </label>
            </div>
          )}
        </div>

        {isFieldEnabled("basic", "notes") && (
          <div className="pt-2">
            <Field
              label={t("contacts.form.notes")}
              error={getFieldError("notes")}
              id={`cf-${formInstanceId}-notes`}
            >
              <Textarea
                id={`cf-${formInstanceId}-notes`}
                name="notes"
                value={(contactDraft.notes as string) || ""}
                onChange={(e) => updateDraft({ notes: e.target.value })}
                placeholder={t("contacts.form.notesPlaceholder")}
                rows={3}
                className="w-full"
              />
            </Field>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
