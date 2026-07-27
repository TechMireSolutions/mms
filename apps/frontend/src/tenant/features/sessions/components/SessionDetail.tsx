import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Clock, Tag, DollarSign,
  Calendar, Gift, Edit2,
} from "lucide-react";
import { DetailDrawerShell } from "@/components/ui/DetailDrawerShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatMoney, SESSIONS_MODULE_CONTRACT, formatDate, toTitleCase, type AppTranslationKey } from "@mms/shared";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useTranslation } from "@/hooks/useTranslation";
import { useSessionConfig } from "@/hooks/useStandardModuleConfig";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";

import { ClassesTab } from "@/tenant/features/sessions/components/tabs/ClassesTab";
import { TimetableTab } from "@/tenant/features/sessions/components/tabs/TimetableTab";
import { DiscountsTab } from "@/tenant/features/sessions/components/tabs/DiscountsTab";
import { BudgetTab } from "@/tenant/features/sessions/components/tabs/BudgetTab";
import { EventsTab } from "@/tenant/features/sessions/components/tabs/EventsTab";
import { TabarrukTab } from "@/tenant/features/sessions/components/tabs/TabarrukTab";

import { Session } from "@/lib/data/sessionsData";
import { Button } from "@/components/ui/button";

const TAB_KEYS = ["classes", "timetable", "discounts", "budget", "events", "tabarruk"] as const;

const TAB_ICONS = {
  classes: GraduationCap,
  timetable: Clock,
  discounts: Tag,
  budget: DollarSign,
  events: Calendar,
  tabarruk: Gift,
} as const;

const TAB_COMPONENTS: Record<string, React.ElementType> = {
  classes: ClassesTab,
  timetable: TimetableTab,
  discounts: DiscountsTab,
  budget: BudgetTab,
  events: EventsTab,
  tabarruk: TabarrukTab,
};

interface SessionDetailProps {
  session: Session;
  onClose: () => void;
  onUpdate: (session: Session) => void | Promise<void>;
  onEdit: (session: Session) => void;
}

export function SessionDetail({ session, onClose, onUpdate, onEdit }: SessionDetailProps) {
  const { t } = useTranslation();
  const { canWrite } = useModulePermissions(SESSIONS_MODULE_CONTRACT);
  const { statuses: statusOptions } = useSessionConfig();
  const [tab, setTab] = useState<string>("classes");
  const TabContent = TAB_COMPONENTS[tab];

  const statusLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const statusOption of statusOptions) {
      const translationKey = `sessions.status.${statusOption}` as AppTranslationKey;
      const translated = t(translationKey);
      labels[statusOption] = translated === translationKey ? toTitleCase(statusOption) : translated;
    }
    return labels;
  }, [statusOptions, t]);

  const statusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    active: { label: statusLabels.active || t("sessions.status.active"), cls: SEMANTIC_BADGE.success },
    upcoming: { label: statusLabels.upcoming || t("sessions.status.upcoming"), cls: SEMANTIC_BADGE.info },
    completed: { label: statusLabels.completed || t("sessions.status.completed"), cls: SEMANTIC_BADGE.muted },
    cancelled: { label: statusLabels.cancelled || t("sessions.status.cancelled"), cls: SEMANTIC_BADGE.destructive },
  }), [statusLabels, t]);

  const tabs = useMemo(
    () =>
      TAB_KEYS.map((key) => ({
        key,
        label: t(`sessions.detail.tab.${key}` as AppTranslationKey),
        icon: TAB_ICONS[key],
      })),
    [t],
  );

  const formatSessionDate = (date?: string | null) => formatDate(date, true);

  return (
    <DetailDrawerShell
      onClose={onClose}
      title={session.name}
      subtitle={
        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
          <span>{formatSessionDate(session.startDate)} → {formatSessionDate(session.endDate)}</span>
          <span className="font-semibold text-foreground">
            {t("sessions.form.perMonth", { amount: formatMoney(session.baseFee, session.currency) })}
          </span>
        </div>
      }
      icon={GraduationCap}
      ariaLabel={t("sessions.detail.ariaLabel")}
      className="max-w-2xl"
      headerExtra={
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={session.status} config={statusConfig} />
          <span className="text-[11px] text-muted-foreground">{session.type}</span>
        </div>
      }
      headerActions={
        canWrite ? (
          <Button
            type="button"
            onClick={() => onEdit(session)}
            variant="ghost"
            size="icon"
            aria-label={t("sessions.detail.editTitle")}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit2 className="w-4 h-4" aria-hidden="true" />
          </Button>
        ) : undefined
      }
    >
      <div className="flex border-b border-border bg-card/40 flex-shrink-0 -mx-1 px-1 py-1.5 overflow-x-auto">
        <SubTabBar
          tabs={tabs}
          value={tab}
          onChange={setTab}
          panelIdPrefix="session-detail-subtab"
        />
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.section
            key={tab}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
            aria-label={tabs.find((tabDefinition) => tabDefinition.key === tab)?.label}
          >
            <TabContent session={session} onUpdate={onUpdate} canWrite={canWrite} />
          </motion.section>
        </AnimatePresence>
      </div>
    </DetailDrawerShell>
  );
}
