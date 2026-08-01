import React from "react";
import { Users, UserCheck, MessageCircle, UserPlus, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactsReportAnalytics } from "@/tenant/hooks/collections/contacts";
import { StatCard } from "@/components/ui/StatCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { applyContactsWorkDrillDown } from "@/lib/contacts/contactsWorkDrillDown";

interface ContactReportProps {
  onEditVisual?: (config: unknown) => void;
}

/** Contacts CRM Report dashboard — KPIs only; saved reports live under Reports → Saved. */
export default function ContactReport(props: ContactReportProps): React.JSX.Element {
  void props.onEditVisual;

  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useContactsReportAnalytics();
  const analytics = data?.analytics;

  if (isError) {
    return (
      <div className="p-4">
        <ErrorState
          title={t("contacts.report.loadFailed")}
          description={t("common.retry")}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  if (isLoading && !analytics) {
    return (
      <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground" role="status">
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
        <span className="text-sm">{t("common.loading")}</span>
      </div>
    );
  }

  const totalContacts = analytics?.total ?? 0;
  const activeContacts = analytics?.activeCount ?? 0;
  const whatsappRate = analytics?.whatsappRate ?? 0;
  const newLast30Days = analytics?.newLast30Days ?? 0;

  return (
    <div className="space-y-6 text-start p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label={t("contacts.report.totalContacts")}
          value={totalContacts}
          accent="primary"
          onClick={() => applyContactsWorkDrillDown({})}
        />
        <StatCard
          icon={UserCheck}
          label={t("contacts.report.activeContacts")}
          value={activeContacts}
          accent="success"
        />
        <StatCard
          icon={MessageCircle}
          label={t("contacts.report.whatsappVerified")}
          value={`${whatsappRate}%`}
          accent="warning"
          onClick={() => applyContactsWorkDrillDown({ quickFilter: "whatsapp" })}
        />
        <StatCard
          icon={UserPlus}
          label={t("contacts.report.newLast30Days")}
          value={newLast30Days}
          accent="secondary"
        />
      </div>
    </div>
  );
}
