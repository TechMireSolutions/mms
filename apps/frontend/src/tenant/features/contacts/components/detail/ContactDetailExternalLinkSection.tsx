import type { LucideIcon } from "lucide-react";
import {
  CollectionRowItem,
  type CollectionRowAction,
  DetailSection,
} from "./ContactDetailShared";
import { DetailCollectionEmpty } from "./contactDetailChannelHelpers";

interface ContactDetailExternalLinkRow {
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
        rows.map((row) => {
          const actions: CollectionRowAction[] = row.href
            ? [
                {
                  key: "open",
                  icon: actionIcon,
                  title: actionTitle,
                  href: row.href,
                  external: true,
                  className: "text-primary hover:bg-primary/10",
                },
              ]
            : [];
          return (
            <CollectionRowItem
              key={row.key}
              label={row.label}
              value={row.value || emptyDash}
              copyable={Boolean(row.value)}
              actions={actions}
            />
          );
        })
      )}
    </DetailSection>
  );
}
