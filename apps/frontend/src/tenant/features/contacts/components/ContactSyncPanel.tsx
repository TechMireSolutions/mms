import React from "react";
import { Info } from "lucide-react";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { useTranslation } from "@/hooks/useTranslation";
import type { Contact } from "@mms/shared";
import { GoogleContactsPanel } from "./sync/GoogleContactsPanel";
import { AppleContactsPanel } from "./sync/AppleContactsPanel";

interface ContactSyncPanelProps {
  onImport: (contacts: Contact[]) => void | Promise<void>;
  /** Requires `contacts.write` — sync imports/mutates entities; do not gate on canEditSetup alone. */
  canWrite?: boolean;
}

/**
 * ContactSyncPanel — Google/Apple sync under Setup → Sync.
 * CTAs use `canWrite` (contacts.write), not `canEditSetup`, so Setup-only roles cannot import.
 */
export default function ContactSyncPanel({
  onImport,
  canWrite = false,
}: ContactSyncPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="max-w-3xl space-y-5 text-start">
      <WarningCallout
        icon={Info}
        tone="info"
        title={t("contacts.sync.title")}
        description={t("contacts.sync.description")}
      />

      <GoogleContactsPanel canWrite={canWrite} />
      <AppleContactsPanel onImport={onImport} canWrite={canWrite} />
    </div>
  );
}
