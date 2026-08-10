import { Share2 } from "lucide-react";
import type { ContactSubListTabBaseProps } from "./types";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveSocialPlatformLabel } from "@/lib/contacts/contactI18n";
import { ContactLabeledValueSubListTab } from "./ContactLabeledValueSubListTab";

interface ContactSocialsTabProps extends ContactSubListTabBaseProps {
  socialPlatforms: string[];
  onUpdateSocialPlatforms: (platforms: string[]) => void;
}

export function ContactSocialsTab({
  socialPlatforms,
  onUpdateSocialPlatforms,
  ...base
}: ContactSocialsTabProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <ContactLabeledValueSubListTab
      {...base}
      listKey="socials"
      labelFieldKey="platform"
      valueFieldKey="url"
      options={socialPlatforms}
      onUpdateOptions={onUpdateSocialPlatforms}
      resolveLabel={(raw, options, translate) =>
        resolveSocialPlatformLabel(raw as string | undefined, options, translate)
      }
      emptyItem={(resolvedLabel) => ({ platform: resolvedLabel, url: "" })}
      icon={Share2}
      accentClass="bg-destructive/60 group-hover:bg-destructive"
      iconClass="text-destructive group-hover:text-destructive"
      emptyMessage={t("contacts.form.noSocialLinksYet")}
      addLabel={t("contacts.form.addSocialLink")}
      removeLabel={(index) => t("contacts.form.removeSocialLink", { index })}
      valuePlaceholder={t("contacts.form.socialHandlePlaceholder")}
      valueInputIdPrefix="social-url"
      labelSelectIdPrefix="social-platform"
    />
  );
}
