import React from "react";
import { X, Mail, Phone, Camera } from "lucide-react";
import {
  type Contact,
  getDisplayName,
  getPrimaryPhone,
  getPrimaryEmail,
} from "@mms/shared";
import { cn } from "@/lib/utils";
import { genderBadgeClass } from "@/lib/semanticTone";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { RequiredMark } from "@/components/ui/FormField";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { GenderIcon } from "@/components/ui/GenderIcon";

export interface ContactPickerSelectedProps {
  selected: Contact;
  label: string;
  required?: boolean;
  value: string | number | null;
  resolvedId: string;
  resolvedName: string;
  avatarInputId: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarChange?: (avatarUrl: string) => void;
  onClear: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ContactPickerSelected({
  selected,
  label,
  required = false,
  value,
  resolvedId,
  resolvedName,
  avatarInputId,
  fileInputRef,
  onAvatarChange,
  onClear,
  onFileChange,
}: ContactPickerSelectedProps): React.JSX.Element {
  const { t } = useTranslation();
  const genderBadgeColor = genderBadgeClass(selected.gender ?? "");
  const selectedPhone = getPrimaryPhone(selected);
  const selectedEmail = getPrimaryEmail(selected);
  const selectedName = getDisplayName(selected);

  return (
    <div className="relative">
      <label htmlFor={resolvedId} className={FORM_LABEL}>
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      <div className="group relative flex items-center gap-3.5 p-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.01] to-primary/[0.04] dark:from-primary/[0.02] dark:to-primary/[0.06] shadow-sm hover:shadow-md transition-all duration-200">
        <div
          onClick={() => onAvatarChange && fileInputRef.current?.click()}
          className={cn(
            "w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-muted border border-border flex items-center justify-center shadow-sm relative",
            onAvatarChange && "cursor-pointer group/avatar",
          )}
        >
          <UserAvatar
            id={selected.id}
            name={selectedName}
            avatar={selected.avatar}
            className="w-full h-full text-sm"
          />
          {onAvatarChange && (
            <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity duration-150">
              <Camera className="w-4 h-4 text-white" />
            </div>
          )}
          <input
            id={avatarInputId}
            name={`${resolvedName}-avatar`}
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
            aria-label={t("account.changePhoto")}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <p className="min-w-0 truncate text-sm font-bold text-foreground">{selectedName}</p>
            {selected.gender && (
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${genderBadgeColor}`}>
                <GenderIcon gender={selected.gender} className="w-3 h-3" />
                {formatContactGenderLabel(selected.gender, t)}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {selectedPhone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-muted-foreground/60" />
                {selectedPhone}
              </span>
            )}
            {selectedEmail && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-muted-foreground/60" />
                {selectedEmail}
              </span>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/20 shadow-none"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <input type="hidden" id={resolvedId} name={resolvedName} value={value ?? ""} />
    </div>
  );
}
