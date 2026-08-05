import { ExternalLink } from "lucide-react";
import type { Contact } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveSocialPlatformLabel } from "@/lib/contacts/contactI18n";
import { ContactDetailExternalLinkSection } from "./ContactDetailExternalLinkSection";

export function ContactDetailSocialsSection({
  contact,
  socialPlatforms,
}: {
  contact: Contact;
  socialPlatforms: string[];
}): React.JSX.Element {
  const { t } = useTranslation();
  const socials = contact.socials ?? [];

  return (
    <ContactDetailExternalLinkSection
      title={t("contacts.detail.socials")}
      emptyMessage={t("contacts.detail.emptySocials")}
      emptyDash={t("contacts.table.emptyDash")}
      actionIcon={ExternalLink}
      actionTitle={t("contacts.detail.visitSocialProfile")}
      rows={socials.map((social, socialIndex) => {
        const handle = String(social.url || "");
        const url = handle.startsWith("http") ? handle : `https://${handle}`;
        return {
          key: `social-${socialIndex}`,
          label: resolveSocialPlatformLabel(social.platform, socialPlatforms, t),
          value: handle,
          href: handle ? url : undefined,
        };
      })}
    />
  );
}
