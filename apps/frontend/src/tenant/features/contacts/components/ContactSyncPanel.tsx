import React from "react";
import { Info } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import type { Contact } from "@mms/shared";
import { GoogleContactsPanel } from "./sync/GoogleContactsPanel";
import { AppleContactsPanel } from "./sync/AppleContactsPanel";

interface ContactSyncPanelProps {
  contacts?: Contact[];
  onImport: (contacts: Contact[]) => void | Promise<void>;
  canWrite?: boolean;
}

/**
 * ContactSyncPanel component for managing Google and Apple Contacts synchronization.
 */
export default function ContactSyncPanel({
  contacts = [],
  onImport,
  canWrite = false,
}: ContactSyncPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <div className="space-y-5 max-w-3xl text-start">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/30 text-sm text-info">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-info" />
        <div>
          <h3 className="font-semibold">{t('contacts.sync.title')}</h3>
          <p className="text-xs mt-0.5 text-info/90">
            {t('contacts.sync.description')}
          </p>
        </div>
      </div>

      <GoogleContactsPanel canWrite={canWrite} />
      <AppleContactsPanel contacts={contacts} onImport={onImport} canWrite={canWrite} />
    </div>
  );
}
