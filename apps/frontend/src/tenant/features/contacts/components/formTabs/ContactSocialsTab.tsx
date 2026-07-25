import React from "react";
import { Share2, Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EditableSelect, TYPE_SELECT_WIDTH } from "@/components/ui/FormPrimitives";
import { ListFieldCard, EmptyListCard } from "./FormCardUtils";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { Contact, SocialLink, DEFAULT_SOCIAL_PLATFORMS } from "@mms/shared";

export interface ContactSocialsTabProps {
  contactDraft: Partial<Contact>;
  getLocalId: (tabName: string, idx: number) => string;
  socialPlatforms: string[];
  getListItemError: (tabId: string, fieldId: string, index: number) => string | undefined;
  addSubListItem: <K extends "phones" | "emails" | "addresses" | "socials" | "emergencyContacts">(
    fieldKey: K,
    newItem: NonNullable<Contact[K]>[number]
  ) => void;
  updateSubListItem: <K extends "phones" | "emails" | "addresses" | "socials" | "emergencyContacts">(
    fieldKey: K,
    idx: number,
    patch: Partial<NonNullable<Contact[K]>[number]>
  ) => void;
  removeSubListItem: (fieldKey: "phones" | "emails" | "addresses" | "socials" | "emergencyContacts", idx: number) => void;
}

export function ContactSocialsTab({
  contactDraft,
  getLocalId,
  socialPlatforms,
  getListItemError,
  addSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactSocialsTabProps): JSX.Element {
  const { t } = useTranslation();
  const socials = contactDraft.socials || [];
  const addSocial = () => {
    addSubListItem("socials", { platform: socialPlatforms[0] || "WhatsApp", url: "" });
  };
  const removeSocial = (idx: number) => removeSubListItem("socials", idx);
  const updateSocial = (idx: number, patch: Partial<SocialLink>) => updateSubListItem("socials", idx, patch);

  return (
    <div className="space-y-3 text-left">
      {socials.length === 0 && (
        <EmptyListCard icon={Share2} message={t("contacts.form.noSocialLinksYet")} />
      )}

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {socials.map((soc, idx) => {
            const urlError = getListItemError("socials", "url", idx);
            return (
              <ListFieldCard
                key={getLocalId("socials", idx)}
                id={getLocalId("socials", idx)}
                index={idx}
                icon={Share2}
                accentClass="bg-indigo-500/60 group-hover:bg-indigo-500"
                iconClass="text-indigo-500/70 group-hover:text-indigo-500"
                label={`${t("contacts.form.type")}:`}
                typeSelect={
                  <EditableSelect
                    options={
                      socialPlatforms.length > 0
                        ? socialPlatforms
                        : (DEFAULT_SOCIAL_PLATFORMS as unknown as string[])
                    }
                    value={soc.platform || "WhatsApp"}
                    onChange={(val) => updateSocial(idx, { platform: val })}
                    className={TYPE_SELECT_WIDTH}
                    id={`social-platform-${idx}`}
                    name={`social-platform-${idx}`}
                  />
                }
                onRemove={() => removeSocial(idx)}
                removeLabel={t("contacts.form.removeSocialLink", { index: idx + 1 })}
              >
                <div className="relative flex items-center group/input">
                  <Share2 className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                  <Input
                    id={`social-url-${idx}`}
                    name={`social-url-${idx}`}
                    value={soc.url || ""}
                    onChange={(e) => updateSocial(idx, { url: e.target.value })}
                    placeholder={t("contacts.form.socialHandlePlaceholder")}
                    className={cn(
                      "pl-10",
                      urlError && "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                </div>
                {urlError && (
                  <p className="text-[10px] text-destructive mt-1 font-medium">
                    {urlError}
                  </p>
                )}
              </ListFieldCard>
            );
          })}
        </AnimatePresence>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={addSocial}
        className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start mt-2 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addSocialLink")}</span>
      </Button>
    </div>
  );
}
