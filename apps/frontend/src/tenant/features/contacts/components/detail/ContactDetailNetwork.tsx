import { ArrowUpRight, Phone, Users as UsersIcon } from "lucide-react";
import {
  Contact,
  getDisplayName,
  getPrimaryEmail,
  getPrimaryPhone,
  hasWhatsApp,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { formatContactOptionLabel, formatTelHref } from "@/lib/contacts/contactI18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ContactCardMessagingButtons } from "@/tenant/features/contacts/components/ContactCardMessagingButtons";
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
  }) => {
    const contactId = entry.contactId == null ? "" : String(entry.contactId).trim();
    const name = (entry.name || "").trim();
    const phone = (entry.phone || "").trim();
    if (!contactId && !name && !phone) return;

    const key = contactId || (name ? `name:${name.toLowerCase()}` : `phone:${phone}`);
    const existing = byKey.get(key);
    if (existing && existing.inferred !== true && entry.inferred === true) return;
    byKey.set(key, {
      contactId,
      name: name || existing?.name,
      phone: phone || existing?.phone,
      relationship: entry.relationship || existing?.relationship,
      inferred: entry.inferred === true,
    });
  };

  for (const entry of contact.relationshipContacts ?? []) add(entry);
  for (const entry of contact.relationships ?? []) add(entry);

  return [...byKey.values()];
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
  const links = collectNetworkLinks(contact);
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
          <p className="rounded-xl border border-border/60 bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
            {t("contacts.detail.emptyRelationships")}
          </p>
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
              formatContactOptionLabel(relationship.relationship, t) ||
              t("contacts.detail.linkedContact");
            const linkedId = target?.id ?? (relationship.contactId || undefined);
            const canNavigate = linkedId != null && String(linkedId).length > 0;
            const allowOutbound = parentAllowsOutbound && !target?.deletedAt;
            const targetPhone = target ? getPrimaryPhone(target) : null;
            const targetEmail = target ? getPrimaryEmail(target) : null;
            const legacyPhone = relationship.phone?.trim() || "";
            // Align with ContactCardMessagingButtons mount rules.
            const showTargetMessaging =
              Boolean(target) &&
              allowOutbound &&
              (Boolean(targetPhone) ||
                Boolean(targetEmail && onEmail) ||
                (Boolean(onWhatsApp) && target != null && hasWhatsApp(target)) ||
                (Boolean(onSms) && Boolean(targetPhone)));
            const showLegacyCall = allowOutbound && !target && Boolean(legacyPhone);
            const hasActions = showTargetMessaging || showLegacyCall || canNavigate;

            return (
              <Card
                key={`${relationship.contactId || relationship.name || "link"}-${relationshipIndex}`}
                className={`flex flex-col gap-2.5 p-4 ${DETAIL_STYLES.networkItemCard}`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  <UserAvatar
                    id={target?.id ?? (relationship.contactId || relationship.name || relationshipIndex)}
                    name={displayName || t("contacts.detail.unknownContact")}
                    avatar={target?.avatar}
                    className="w-10 h-10 rounded-xl text-xs flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <h5 className="text-sm font-bold text-foreground leading-snug break-words">
                      {displayName || t("contacts.detail.unknownContact")}
                    </h5>
                    <p
                      className={`text-xs font-semibold uppercase tracking-widest ${DETAIL_STYLES.networkRelType}`}
                    >
                      {relationshipLabel}
                    </p>
                  </div>
                </div>

                {hasActions ? (
                  <div className="flex flex-wrap items-center gap-1.5 ps-[3.25rem]">
                    {showTargetMessaging && target ? (
                      <ContactCardMessagingButtons
                        contact={target}
                        displayName={displayName || t("contacts.detail.unknownContact")}
                        phone={targetPhone}
                        email={targetEmail}
                        showArchived={false}
                        onWhatsApp={onWhatsApp}
                        onSms={onSms}
                        onEmail={onEmail}
                      />
                    ) : showLegacyCall ? (
                      <a
                        href={formatTelHref(legacyPhone)}
                        className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl border border-border/50 bg-muted/40 text-muted-foreground shadow-none transition-colors hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
                        title={t("contacts.detail.callPhone", { phone: legacyPhone })}
                        aria-label={t("contacts.detail.callPhone", { phone: legacyPhone })}
                      >
                        <Phone aria-hidden="true" className="w-4 h-4" />
                      </a>
                    ) : null}

                    {canNavigate ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={
                          displayName
                            ? t("contacts.detail.viewContact", { name: displayName })
                            : t("contacts.fields.linkedContact")
                        }
                        onClick={() => onNavigateToContact(linkedId)}
                        className={`min-h-11 min-w-11 rounded-xl border border-border/50 transition-all shadow-none ${DETAIL_STYLES.networkItemAction}`}
                        type="button"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
