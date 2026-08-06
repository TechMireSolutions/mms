import { Globe, ExternalLink } from "lucide-react";
import type { AppTranslationKey, Contact } from "@mms/shared";
import { deriveSiblingLinks } from "@mms/shared";
import { formatLocalizedRelationshipLabel } from "@/lib/contacts/formatLocalizedRelationshipLabel";

export function renderSocialMetadata({
  contact,
  emptyNode,
  t,
}: {
  contact: Contact;
  emptyNode: React.ReactNode;
  t: (key: AppTranslationKey, params?: Record<string, string | number>) => string;
}): React.ReactNode {
  const socials = (contact.socials || []).filter(
    (social) =>
      (social.platform || "").trim().length > 0 || (social.url || "").trim().length > 0,
  );
  if (socials.length === 0) return emptyNode;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      {socials.map((social, index) => {
        const platform = (social.platform || "").trim();
        const url = (social.url || "").trim();
        const href = url ? (url.startsWith("http") ? url : `https://${url}`) : undefined;
        const displayUrl = url ? url.replace(/^https?:\/\//i, "").replace(/\/$/, "") : "";
        const label = platform && displayUrl ? `${platform}: ${displayUrl}` : (platform || displayUrl);

        if (href) {
          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="inline-flex items-center min-h-11 gap-1 px-2 py-0.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold transition-colors truncate max-w-[12.5rem]"
              title={`${platform || t("contacts.form.link")}: ${url}`}
            >
              <Globe className="w-3 h-3 shrink-0 text-primary" />
              <span className="truncate">{label}</span>
              <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
            </a>
          );
        }

        return (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted text-muted-foreground border border-border/40 text-xs font-medium"
          >
            <Globe className="w-3 h-3 shrink-0" />
            <span>{platform || displayUrl}</span>
          </span>
        );
      })}
    </div>
  );
}

export function renderRelationshipMetadata({
  contact,
  contactsMap,
  emptyNode,
  renderJoinedList,
  t,
}: {
  contact: Contact;
  contactsMap: Map<string, Contact> | null | undefined;
  emptyNode: React.ReactNode;
  renderJoinedList: (items: (string | undefined | null)[], showTitle?: boolean) => React.ReactNode;
  t: (key: AppTranslationKey, params?: Record<string, string | number>) => string;
}): React.ReactNode {
  const stored = (contact.relationshipContacts || []).filter(
    (link) =>
      (link.name || "").trim() ||
      link.contactId ||
      (link.relationship || "").trim(),
  );
  const existingIds = new Set(
    stored
      .map((link) => (link.contactId == null ? "" : String(link.contactId).trim()))
      .filter(Boolean),
  );
  const peers = contactsMap ? [...contactsMap.values()] : [];
  const siblings = deriveSiblingLinks(contact, peers.length > 0 ? peers : [contact]).filter(
    (link) => !existingIds.has(link.contactId),
  );

  type MetaLink = {
    contactId?: string | number;
    name?: string;
    relationship?: string;
  };
  const list: MetaLink[] = [
    ...stored,
    ...siblings.map((link) => ({
      contactId: link.contactId,
      name: link.name,
      relationship: link.relationship,
    })),
  ];
  if (list.length === 0) return emptyNode;

  const items = list.map((link) => {
    let name = link.name ? link.name.trim() : "";
    const linked = link.contactId ? contactsMap?.get(String(link.contactId)) : undefined;
    if (!name && link.contactId) {
      name = linked ? linked.name : `${t("contacts.table.contactIdPrefix")}${link.contactId}`;
    }
    const relationship = link.relationship
      ? formatLocalizedRelationshipLabel(link.relationship.trim(), linked?.gender, t)
      : "";
    if (name && relationship) return `${name} (${relationship})`;
    return name || relationship;
  });

  return renderJoinedList(items.filter(Boolean));
}
