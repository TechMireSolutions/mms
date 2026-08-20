import React, { ChangeEvent } from "react";
import { Camera } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { AvatarCropper } from "@/components/ui/AvatarCropper";
import { useTranslation } from "@/hooks/useTranslation";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { type Contact, getDisplayName } from "@mms/shared";
import { GenderIcon } from "@/components/ui/GenderIcon";
import { Badge } from "@/components/ui/badge";
import { genderBadgeClass } from "@/lib/semanticTone";

export function ContactBasicAvatarSection({
  contactDraft,
  formInstanceId,
  cropSrc,
  setCropSrc,
  updateDraft,
  handleAvatarChange,
}: {
  contactDraft: Partial<Contact>;
  formInstanceId: string;
  cropSrc: string | null;
  setCropSrc: (src: string | null) => void;
  updateDraft: (patch: Partial<Contact>) => void;
  handleAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const avatarInputId = `cf-${formInstanceId}-avatar-file`;

  return (
    <div className="mb-2 flex flex-col items-center gap-6 border-b border-border/60 pb-6 @sm:flex-row">
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
        <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary/30 via-accent/30 to-secondary/30 group-hover:from-primary/60 group-hover:via-accent/60 group-hover:to-secondary/60 blur-subtle transition-all duration-500 opacity-75 group-hover:opacity-100" />
        <div className="relative w-20 h-20 rounded-full bg-card overflow-hidden flex items-center justify-center border border-border/80 shadow-surface group-hover:scale-105 transition-transform duration-300">
          <UserAvatar
            id={contactDraft.id}
            name={getDisplayName(contactDraft)}
            avatar={contactDraft.avatar}
            className="w-full h-full text-2xl"
          />

          <label
            htmlFor={avatarInputId}
            className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 text-white opacity-100 backdrop-blur-subtle transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100"
          >
            <Camera className="h-6 w-6 scale-90 transition-transform duration-300 group-hover:scale-100" aria-hidden />
            <input
              id={avatarInputId}
              name="avatarFile"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarChange}
              aria-label={t("account.changePhoto")}
            />
          </label>
        </div>
      </div>

      <div className="min-w-0 flex-1 text-center @sm:text-start">
        <h3 className="truncate text-base font-bold text-foreground">
          {contactDraft.name || t("contacts.form.draftHeading")}
        </h3>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2 @sm:justify-start">
          {contactDraft.gender && contactDraft.gender !== "unspecified" && (
            <Badge pill variant="outline" className={`gap-1 px-2.5 font-bold ${genderBadgeClass(contactDraft.gender)}`}>
              <GenderIcon gender={contactDraft.gender} className="w-3 h-3" />
              {formatContactGenderLabel(contactDraft.gender, t)}
            </Badge>
          )}
          {contactDraft.isSyed && (
            <Badge pill tone="primary" className="px-2.5 font-bold bg-primary/15">
              {t("contacts.fields.isSyed")}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
