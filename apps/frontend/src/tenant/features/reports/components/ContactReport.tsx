import React, { useState } from "react";
import { Users, UserCheck, MessageCircle, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactsReportAnalytics } from "@/tenant/features/contacts/hooks/useContacts";
import { StatCard } from "@/components/ui/StatCard";
import ContactsSavedReports from "@/tenant/features/contacts/components/ContactsSavedReports";
import type { ContactsWorkDrillDown } from "@mms/shared";

interface ContactReportProps {
  onEditVisual?: (config: unknown) => void;
}


/** Contacts CRM Report sub-tab layout. */
export default function ContactReport(props: ContactReportProps): React.JSX.Element {
  void props.onEditVisual;

  const { t } = useTranslation();
  const { data, isLoading } = useContactsReportAnalytics();
  const analytics = data?.analytics;
  const [lastDrillDown] = useState<ContactsWorkDrillDown>({});

  const totalContacts = analytics?.total ?? 0;
  const activeContacts = analytics?.activeCount ?? 0;
  const whatsappRate = analytics?.whatsappRate ?? 0;

  if (isLoading && !analytics) {
    return (
      <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground" role="status">
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
        <span className="text-sm">{t("common.loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left p-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label={t("contacts.report.totalContacts")} value={totalContacts} color="primary" />
        <StatCard icon={UserCheck} label={t("contacts.report.activeContacts")} value={activeContacts} color="green" />
        <StatCard icon={MessageCircle} label={t("contacts.report.whatsappVerified")} value={`${whatsappRate}%`} color="amber" />
      </div>

      <ContactsSavedReports suggestedDrillDown={lastDrillDown} />
    </div>
  );
}
