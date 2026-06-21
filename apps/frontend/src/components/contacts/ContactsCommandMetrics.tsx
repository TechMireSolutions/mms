import React from "react";
import { Users, Filter, MessageCircle, AlertCircle, GitMerge, Clock, CalendarPlus, AlertTriangle } from "lucide-react";
import useTranslation from "@/hooks/useTranslation";
import { useContactsSyncOutbox } from "@/hooks/useContactsSyncOutbox";
import { useContactsMetrics } from "@/hooks/useContacts";
import ModuleCommandMetricCard from "@/components/ui/ModuleCommandMetricCard";

interface ContactsCommandMetricsProps {
  total: number;
  shown: number;
  onOpenDuplicates?: () => void;
  onReviewConflicts?: () => void;
}

/** Permission-scoped quick metrics for the Contacts module command centre (globle1 §2.1). */
export default function ContactsCommandMetrics({
  total,
  shown,
  onOpenDuplicates,
  onReviewConflicts,
}: ContactsCommandMetricsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { pendingCount, conflictCount, flushing, flush } = useContactsSyncOutbox();
  const { data: serverMetrics } = useContactsMetrics();

  const metrics = {
    total: serverMetrics?.total ?? total,
    newThisPeriod: serverMetrics?.newThisPeriod ?? 0,
    whatsappCount: serverMetrics?.whatsappCount ?? 0,
    incompleteCount: serverMetrics?.incompleteCount ?? 0,
    duplicatePairCount: serverMetrics?.duplicatePairCount ?? 0,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8 gap-2">
      <ModuleCommandMetricCard icon={Users} label={t("contacts.metrics.total")} value={metrics.total} />
      <ModuleCommandMetricCard icon={Filter} label={t("contacts.metrics.filtered")} value={shown} />
      <ModuleCommandMetricCard icon={CalendarPlus} label={t("contacts.metrics.newThisPeriod")} value={metrics.newThisPeriod} />
      <ModuleCommandMetricCard
        icon={Clock}
        label={t("contacts.metrics.pendingSync")}
        value={pendingCount}
        onClick={pendingCount > 0 && !flushing ? () => void flush() : undefined}
      />
      <ModuleCommandMetricCard
        icon={AlertTriangle}
        label={t("contacts.metrics.syncConflicts")}
        value={conflictCount}
        onClick={conflictCount > 0 ? onReviewConflicts : undefined}
      />
      <ModuleCommandMetricCard icon={MessageCircle} label={t("contacts.metrics.whatsapp")} value={metrics.whatsappCount} />
      <ModuleCommandMetricCard icon={AlertCircle} label={t("contacts.metrics.incomplete")} value={metrics.incompleteCount} />
      <ModuleCommandMetricCard
        icon={GitMerge}
        label={t("contacts.metrics.duplicates")}
        value={metrics.duplicatePairCount}
        onClick={metrics.duplicatePairCount > 0 ? onOpenDuplicates : undefined}
      />
    </div>
  );
}
