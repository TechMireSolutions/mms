import type { LucideIcon } from "lucide-react";
import { CollectionRowItem, DetailSection } from "./ContactDetailShared";
import { DetailCollectionEmpty } from "./contactDetailChannelHelpers";

export interface ContactDetailExternalLinkRow {
  key: string;
  label: string;
  value: string;
  href?: string;
}

/** Shared Addresses / Socials detail section: empty hint + external-link collection rows. */
export function ContactDetailExternalLinkSection({
  title,
  emptyMessage,
  emptyDash,
  rows,
  actionIcon,
  actionTitle,
}: {
  title: string;
  emptyMessage: string;
  emptyDash: string;
  rows: ContactDetailExternalLinkRow[];
  actionIcon: LucideIcon;
  actionTitle: string;
}): React.JSX.Element {
  return (
    <DetailSection title={title}>
      {rows.length === 0 ? (
        <DetailCollectionEmpty title={emptyMessage} />
      ) : (
        rows.map((row) => (
          <CollectionRowItem
            key={row.key}
            label={row.label}
            value={row.value || emptyDash}
            copyable={Boolean(row.value)}
            actionHref={row.href}
            actionIcon={actionIcon}
            actionTitle={actionTitle}
            actionColorClass="text-primary hover:bg-primary/10"
            external
          />
        ))
      )}
    </DetailSection>
  );
}
