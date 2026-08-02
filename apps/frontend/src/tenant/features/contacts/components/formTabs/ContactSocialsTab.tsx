import React from "react";
import { Share2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { EditableSelect, TYPE_SELECT_WIDTH } from "@/components/ui/FormPrimitives";
import { ListFieldCard, ContactSubListShell, FieldInlineError } from "./ContactSubListCards";
import type { ContactSubListTabBaseProps } from "./types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveSocialPlatformLabel } from "@/lib/contacts/contactI18n";
import { SocialLink } from "@mms/shared";

export interface ContactSocialsTabProps extends ContactSubListTabBaseProps {
  socialPlatforms: string[];
  onUpdateSocialPlatforms: (platforms: string[]) => void;
}

export function ContactSocialsTab({
  contactDraft,
  getLocalId,
  socialPlatforms,
  onUpdateSocialPlatforms,
  getListItemError,
  isFieldEnabled,
  isFieldRequired,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactSocialsTabProps): JSX.Element {
  const { t } = useTranslation();
  const showPlatform = isFieldEnabled("socials", "platform");
  const showUrl = isFieldEnabled("socials", "url");
  const allowAdd = showPlatform || showUrl;
  const socials = contactDraft.socials || [];
  const emptySocial = () => ({
    platform: resolveSocialPlatformLabel(undefined, socialPlatforms, t),
    url: "",
  });
  const addSocial = () => {
    addSubListItem("socials", emptySocial());
  };
  const ensureSocial = () => {
    ensureSubListItem("socials", emptySocial());
  };
  const removeSocial = (idx: number) => removeSubListItem("socials", idx);
  const updateSocial = (idx: number, patch: Partial<SocialLink>) => updateSubListItem("socials", idx, patch);

  return (
    <ContactSubListShell
      isEmpty={socials.length === 0}
      emptyIcon={Share2}
      emptyMessage={t("contacts.form.noSocialLinksYet")}
      addLabel={t("contacts.form.addSocialLink")}
      onAdd={addSocial}
      onEnsureRow={ensureSocial}
      allowAdd={allowAdd}
    >
      <AnimatePresence initial={false}>
        {socials.map((soc, idx) => {
          const urlError = getListItemError("socials", "url", idx);
          return (
            <ListFieldCard
              key={getLocalId("socials", idx)}
              id={getLocalId("socials", idx)}
              index={idx}
              icon={Share2}
              accentClass="bg-destructive/60 group-hover:bg-destructive"
              iconClass="text-destructive group-hover:text-destructive"
              label={`${t("contacts.form.type")}:`}
              typeSelect={
                showPlatform ? (
                  <EditableSelect
                    options={socialPlatforms}
                    value={resolveSocialPlatformLabel(soc.platform, socialPlatforms, t)}
                    onChange={(val) => updateSocial(idx, { platform: val })}
                    onUpdateOptions={onUpdateSocialPlatforms}
                    className={TYPE_SELECT_WIDTH}
                    id={`social-platform-${idx}`}
                    name={`social-platform-${idx}`}
                  />
                ) : undefined
              }
              onRemove={() => removeSocial(idx)}
              removeLabel={t("contacts.form.removeSocialLink", { index: idx + 1 })}
            >
              {showUrl ? (
                <>
                  <div className="relative flex items-center group/input">
                    <Share2 className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                    <Input
                      id={`social-url-${idx}`}
                      name={`social-url-${idx}`}
                      value={soc.url || ""}
                      required={isFieldRequired("socials", "url")}
                      onChange={(e) => updateSocial(idx, { url: e.target.value })}
                      placeholder={t("contacts.form.socialHandlePlaceholder")}
                      className={cn(
                        "ps-10",
                        urlError && "border-destructive focus-visible:ring-destructive",
                      )}
                    />
                  </div>
                  <FieldInlineError message={urlError} />
                </>
              ) : null}
            </ListFieldCard>
          );
        })}
      </AnimatePresence>
    </ContactSubListShell>
  );
}
