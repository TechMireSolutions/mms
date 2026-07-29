import React, { ChangeEvent } from "react";
import { Camera } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { AvatarCropper } from "@/components/ui/AvatarCropper";
import { useTranslation } from "@/hooks/useTranslation";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { Contact, getDisplayName } from "@mms/shared";

export function ContactBasicAvatarSection({
  contactDraft,
  cropSrc,
  setCropSrc,
  updateDraft,
  handleAvatarChange,
}: {
  contactDraft: Partial<Contact>;
  cropSrc: string | null;
  setCropSrc: (src: string | null) => void;
  updateDraft: (patch: Partial<Contact>) => void;
  handleAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
}): React.JSX.Element {
  const { t } = useTranslation();

  return (
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

          <label className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity duration-300 text-white gap-1 rounded-full">
            <Camera className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
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

      <div className="text-center sm:text-start flex-1 min-w-0">
        <h3 className="text-base font-bold text-foreground truncate">
          {contactDraft.name || t("contacts.form.createNewContact")}
        </h3>
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
          {contactDraft.gender && contactDraft.gender !== "unspecified" && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border/80">
              {formatContactGenderLabel(contactDraft.gender, t)}
            </span>
          )}
          {contactDraft.isSyed && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/20">
              {t("contacts.fields.isSyed")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
