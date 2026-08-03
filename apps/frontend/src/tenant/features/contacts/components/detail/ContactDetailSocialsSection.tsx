import { ExternalLink } from "lucide-react";
import type { Contact } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { resolveSocialPlatformLabel } from "@/lib/contacts/contactI18n";
import { CollectionRowItem, DetailSection } from "./ContactDetailShared";
import { EmptyCollectionHint } from "./contactDetailChannelHelpers";

export function ContactDetailSocialsSection({
  contact,
  socialPlatforms,
}: {
  contact: Contact;
  socialPlatforms: string[];
}): React.JSX.Element {
  const { t } = useTranslation();
  const emptyDash = t("contacts.table.emptyDash");
  const socials = contact.socials ?? [];

  return (
    <DetailSection title={t("contacts.detail.socials")}>
      {socials.length === 0 ? (
        <EmptyCollectionHint message={t("contacts.detail.emptySocials")} />
      ) : (
        socials.map((social, socialIndex) => {
          const handle = String(social.url || "");
          const url = handle.startsWith("http") ? handle : `https://${handle}`;
          return (
            <CollectionRowItem
              key={`social-${socialIndex}`}
              label={resolveSocialPlatformLabel(social.platform, socialPlatforms, t)}
              value={handle || emptyDash}
              copyable={Boolean(handle)}
              actionHref={handle ? url : undefined}
              actionIcon={ExternalLink}
              actionTitle={t("contacts.detail.visitSocialProfile")}
              actionColorClass="text-primary hover:bg-primary/10"
              external
            />
          );
        })
      )}
    </DetailSection>
  );
}
