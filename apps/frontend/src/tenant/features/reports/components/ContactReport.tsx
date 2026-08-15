import React, { useMemo } from "react";
import { Users, MessageCircle, UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactsReportAnalytics } from "@/tenant/hooks/collections/contacts";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { ErrorState } from "@/components/ui/ErrorState";
import { applyContactsWorkDrillDown } from "@/lib/contacts/contactsWorkDrillDown";

interface ContactReportProps {
  onEditVisual?: (config: unknown) => void;
}

/** Contacts CRM Report dashboard — KPIs only; saved reports live under Reports → Saved. */
const ContactReport = React.memo(function ContactReport(props: ContactReportProps): React.JSX.Element {
  void props.onEditVisual;

  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useContactsReportAnalytics();
  const analytics = data?.analytics;

  const totalContacts = analytics?.total ?? 0;
  const missingInfoCount = analytics?.missingInfoCount ?? 0;
  const whatsappRate = analytics?.whatsappRate ?? 0;
  const newLast30Days = analytics?.newLast30Days ?? 0;

  const kpiItems = useMemo(() => [
    {
      icon: Users,
      label: t("contacts.report.totalContacts"),
      value: totalContacts,
      accent: "primary" as const,
      onClick: () => applyContactsWorkDrillDown({}),
    },
    {
      icon: MessageCircle,
      label: t("contacts.report.whatsappVerified"),
      value: `${whatsappRate}%`,
      accent: "warning" as const,
      onClick: () => applyContactsWorkDrillDown({ quickFilter: "whatsapp" }),
    },
    {
      icon: UserPlus,
      label: t("contacts.report.newLast30Days"),
      value: newLast30Days,
      accent: "secondary" as const,
      onClick: () => applyContactsWorkDrillDown({ quickFilter: "recent" }),
    },
    {
      icon: AlertCircle,
      label: t("contacts.report.missingContactInfo"),
      value: missingInfoCount,
      accent: "destructive" as const,
      onClick: () => applyContactsWorkDrillDown({ quickFilter: "missingInfo" }),
    },
  ], [t, totalContacts, whatsappRate, newLast30Days, missingInfoCount]);

  if (isError) {
    return (
      <div className="p-4">
        <ErrorState
          title={t("contacts.report.loadFailed")}
          description={t("contacts.report.loadFailedHint")}
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

  return (
    <div className="space-y-6 text-start p-4">
      <ModuleCommandMetricsGrid items={kpiItems} />
    </div>
  );
});

export default ContactReport;

