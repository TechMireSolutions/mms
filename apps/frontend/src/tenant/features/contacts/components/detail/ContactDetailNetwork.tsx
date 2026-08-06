import { Users as UsersIcon } from "lucide-react";
import {
  Contact,
  deriveSiblingLinks,
  getDisplayName,
  getPrimaryEmail,
  getPrimaryPhone,
  hasWhatsApp,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { formatLocalizedRelationshipLabel } from "@/lib/contacts/formatLocalizedRelationshipLabel";
import { DetailCollectionEmpty } from "./contactDetailChannelHelpers";
import { ContactNetworkLinkCard } from "./ContactNetworkLinkCard";
import { DETAIL_STYLES } from "./contactDetailStyles";

export interface ContactDetailNetworkProps {
  contact: Contact;
  allContacts: Contact[];
  onNavigateToContact: (targetId: string | number) => void;
  onWhatsApp?: (contacts: Contact[]) => void;
  onSms?: (contacts: Contact[]) => void;
  onEmail?: (contacts: Contact[]) => void;
}

type NetworkLink = {
  contactId: string;
  name?: string;
  phone?: string;
  relationship?: string;
  inferred?: boolean;
  derivedSibling?: boolean;
};

function resolveLinkedDisplayName(
  entry: NetworkLink,
  target: Contact | undefined,
  unknownLabel: string,
): string {
  if (target) return getDisplayName(target);
  const legacyName = (entry.name || "").trim();
  if (legacyName) return legacyName;
  if (entry.contactId.trim().length > 0) return unknownLabel;
  return "";
}

/** Merge relationshipContacts + legacy `relationships`; prefer non-inferred when both exist. */
function collectNetworkLinks(contact: Contact): NetworkLink[] {
  const byKey = new Map<string, NetworkLink>();

  const add = (entry: {
    contactId?: string | number | null;
    name?: string;
    phone?: string;
    relationship?: string;
    inferred?: boolean;
    derivedSibling?: boolean;
  }) => {
    const contactId = entry.contactId == null ? "" : String(entry.contactId).trim();
    const name = (entry.name || "").trim();
    const phone = (entry.phone || "").trim();
    if (!contactId && !name && !phone) return;

    const key = contactId || (name ? `name:${name.toLowerCase()}` : `phone:${phone}`);
    const existing = byKey.get(key);
    if (existing && existing.inferred !== true && entry.inferred === true) return;
    if (existing && entry.derivedSibling) return;
    byKey.set(key, {
      contactId,
      name: name || existing?.name,
      phone: phone || existing?.phone,
      relationship: entry.relationship || existing?.relationship,
      inferred: entry.inferred === true,
      ...(entry.derivedSibling ? { derivedSibling: true } : {}),
    });
  };

  for (const entry of contact.relationshipContacts ?? []) add(entry);
  for (const entry of contact.relationships ?? []) add(entry);

  return [...byKey.values()];
}

function mergeDerivedSiblingLinks(contact: Contact, allContacts: Contact[]): NetworkLink[] {
  const stored = collectNetworkLinks(contact);
  const existingIds = new Set(
    stored.map((link) => link.contactId).filter((id) => id.length > 0),
  );
  const peers = allContacts.length > 0 ? allContacts : [contact];
  const siblings = deriveSiblingLinks(contact, peers).filter(
    (link) => !existingIds.has(link.contactId),
  );
  return [
    ...stored,
    ...siblings.map((link) => ({
      contactId: link.contactId,
      name: link.name,
      relationship: link.relationship,
      inferred: true,
      derivedSibling: true as const,
    })),
  ];
}

export function ContactDetailNetwork({
  contact,
  allContacts,
  onNavigateToContact,
  onWhatsApp,
  onSms,
  onEmail,
}: ContactDetailNetworkProps): JSX.Element {
  const { t } = useTranslation();
  const links = mergeDerivedSiblingLinks(contact, allContacts);
  const parentAllowsOutbound = !contact.deletedAt;

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-2xl border flex items-center gap-3 ${DETAIL_STYLES.networkHeader}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs ${DETAIL_STYLES.networkIcon}`}>
          <UsersIcon className="w-5 h-5" aria-hidden />
        </div>
        <div>
          <h4 className={`text-sm font-bold leading-none ${DETAIL_STYLES.networkTitle}`}>
            {links.length} {t("contacts.detail.relationships")}
          </h4>
          {links.length > 0 ? (
            <p className={`text-xs font-medium mt-1 uppercase tracking-tight ${DETAIL_STYLES.networkSubtitle}`}>
              {t("contacts.detail.activeSocialGraph")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {links.length === 0 ? (
          <DetailCollectionEmpty
            title={t("contacts.detail.emptyRelationships")}
            variant="bordered"
          />
        ) : (
          links.map((relationship, relationshipIndex) => {
            const target = relationship.contactId
              ? allContacts.find((c) => String(c.id) === relationship.contactId)
              : undefined;
            const displayName = resolveLinkedDisplayName(
              relationship,
              target,
              t("contacts.detail.unknownContact"),
            );
            const relationshipLabel =
              formatLocalizedRelationshipLabel(
                relationship.relationship,
                target?.gender,
                t,
              ) || t("contacts.detail.linkedContact");
            const linkedId = target?.id ?? (relationship.contactId || undefined);
            const canNavigate = linkedId != null && String(linkedId).length > 0;
            const allowOutbound = parentAllowsOutbound && !target?.deletedAt;
            const targetPhone = target ? getPrimaryPhone(target) : null;
            const targetEmail = target ? getPrimaryEmail(target) : null;
            const legacyPhone = relationship.phone?.trim() || "";
            const showTargetMessaging =
              Boolean(target) &&
              allowOutbound &&
              (Boolean(targetPhone) ||
                Boolean(targetEmail && onEmail) ||
                (Boolean(onWhatsApp) && target != null && hasWhatsApp(target)) ||
                (Boolean(onSms) && Boolean(targetPhone)));
            const showLegacyCall = allowOutbound && !target && Boolean(legacyPhone);

            return (
              <ContactNetworkLinkCard
                key={`${relationship.contactId || relationship.name || "link"}-${relationshipIndex}`}
                displayName={displayName}
                relationshipLabel={relationshipLabel}
                avatarId={target?.id ?? (relationship.contactId || relationship.name || relationshipIndex)}
                avatar={target?.avatar}
                target={target}
                targetPhone={targetPhone}
                targetEmail={targetEmail}
                legacyPhone={legacyPhone}
                showTargetMessaging={showTargetMessaging}
                showLegacyCall={showLegacyCall}
                canNavigate={canNavigate}
                linkedId={linkedId}
                onNavigateToContact={onNavigateToContact}
                onWhatsApp={onWhatsApp}
                onSms={onSms}
                onEmail={onEmail}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
