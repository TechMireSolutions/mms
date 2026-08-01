import { AlertTriangle } from "lucide-react";
import { CONTACTS_MODULE_MANIFEST } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";

export function ContactsWorkTruncatedBanner({ shownCount }: { shownCount: number }) {
  const { t } = useTranslation();

  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-warning"
      role="status"
    >
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      {t("contacts.workTruncated", {
        limit: CONTACTS_MODULE_MANIFEST.maxPageSize,
        total: shownCount,
      })}
    </div>
  );
}
