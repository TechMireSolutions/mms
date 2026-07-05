import React from "react";
import { Users, Filter, MessageCircle, AlertCircle, GitMerge, Clock, CalendarPlus, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useContactsSyncOutbox } from "@/tenant/features/contacts/hooks/useContactsSyncOutbox";
import { useContactsMetrics } from "@/tenant/features/contacts/hooks/useContacts";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";

interface ContactsCommandMetricsProps {
  total: number;
  shown: number;
  onOpenDuplicates?: () => void;
  onReviewConflicts?: () => void;
}

/** Permission-scoped quick metrics for the Contacts module command centre (globle1 §2.1). */
export function ContactsCommandMetrics({
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

  const items = [
    { icon: Users, label: t("contacts.metrics.total"), value: metrics.total, accent: "primary" as const },
    { icon: Filter, label: t("contacts.metrics.filtered"), value: shown, accent: "info" as const },
    { icon: CalendarPlus, label: t("contacts.metrics.newThisPeriod"), value: metrics.newThisPeriod, accent: "success" as const },
    {
      icon: Clock,
      label: t("contacts.metrics.pendingSync"),
      value: pendingCount,
      accent: "warning" as const,
      onClick: pendingCount > 0 && !flushing ? () => void flush() : undefined,
    },
    {
      icon: AlertTriangle,
      label: t("contacts.metrics.syncConflicts"),
      value: conflictCount,
      accent: "destructive" as const,
      onClick: conflictCount > 0 ? onReviewConflicts : undefined,
    },
    { icon: MessageCircle, label: t("contacts.metrics.whatsapp"), value: metrics.whatsappCount, accent: "teal" as const },
    { icon: AlertCircle, label: t("contacts.metrics.incomplete"), value: metrics.incompleteCount, accent: "rose" as const },
    {
      icon: GitMerge,
      label: t("contacts.metrics.duplicates"),
      value: metrics.duplicatePairCount,
      accent: "warning" as const,
      onClick: metrics.duplicatePairCount > 0 ? onOpenDuplicates : undefined,
    },
  ];

  return <ModuleCommandMetricsGrid items={items} />;
}
