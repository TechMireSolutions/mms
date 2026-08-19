import { MapPin, type LucideIcon } from "lucide-react";
import {
  CollectionRowItem,
  type CollectionRowAction,
  DetailSection,
} from "./ContactDetailShared";
import { DetailCollectionEmpty } from "./contactDetailChannelHelpers";
import {
  MESSAGING_ICON_BTN,
  MESSAGING_ICON_BTN_TONES,
} from "@/components/ui/messagingActionStyles";
import { cn } from "@/lib/utils";

interface ContactDetailExternalLinkRow {
  key: string;
  label: string;
  value: string;
  href?: string;
}

/** Shared Addresses / Socials detail section: empty hint + external-link collection rows with outlined action buttons. */
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
          const tone =
            actionIcon === MapPin
              ? MESSAGING_ICON_BTN_TONES.location
              : MESSAGING_ICON_BTN_TONES.link;
          const actions: CollectionRowAction[] = row.href
            ? [
                {
                  key: "open",
                  icon: actionIcon,
                  title: actionTitle,
                  href: row.href,
                  external: true,
                  className: cn(MESSAGING_ICON_BTN, tone),
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
