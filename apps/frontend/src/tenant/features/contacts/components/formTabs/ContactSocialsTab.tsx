import { Share2 } from "lucide-react";
import { formatSocialPlatformUrl } from "@mms/shared";
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
      valueLabel={t("contacts.fields.socialUrl")}
      options={socialPlatforms}
      onUpdateOptions={onUpdateSocialPlatforms}
      resolveLabel={(raw, options, translate) =>
        resolveSocialPlatformLabel(raw as string | undefined, options, translate)
      }
      emptyItem={(resolvedLabel) => ({ platform: resolvedLabel, url: "" })}
      icon={Share2}
      accentClass="bg-sky-500/80 group-hover:bg-sky-500"
      iconClass="text-sky-600 dark:text-sky-400 group-hover:text-sky-500"
      emptyMessage={t("contacts.form.noSocialLinksYet")}
      addLabel={t("contacts.form.addSocialLink")}
      removeLabel={(index) => t("contacts.form.removeSocialLink", { index })}
      valuePlaceholder={t("contacts.form.socialHandlePlaceholder")}
      valueInputIdPrefix="social-url"
      labelSelectIdPrefix="social-platform"
      onValueBlur={(index) => {
        const item = (base.contactDraft.socials || [])[index];
        if (item?.url && item?.platform) {
          const formatted = formatSocialPlatformUrl(item.platform, item.url);
          if (formatted !== item.url) {
            base.updateSubListItem("socials", index, { url: formatted });
          }
        }
      }}
    />
  );
}

