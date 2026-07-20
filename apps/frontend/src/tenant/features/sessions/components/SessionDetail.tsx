import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Clock, Tag, DollarSign,
  Calendar, Gift, Edit2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { formatMoney, SESSIONS_MODULE_CONTRACT, formatDate } from "@mms/shared";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { SubTabBar } from "@/components/ui/SubTabBar";

import { ClassesTab } from "@/tenant/features/sessions/components/tabs/ClassesTab";
import { TimetableTab } from "@/tenant/features/sessions/components/tabs/TimetableTab";
import { DiscountsTab } from "@/tenant/features/sessions/components/tabs/DiscountsTab";
import { BudgetTab } from "@/tenant/features/sessions/components/tabs/BudgetTab";
import { EventsTab } from "@/tenant/features/sessions/components/tabs/EventsTab";
import { TabarrukTab } from "@/tenant/features/sessions/components/tabs/TabarrukTab";

import { Session } from '@/lib/data/sessionsData';
import { Button } from "@/components/ui/button";

const TABS = [
  { key: "classes",   label: "Classes",   icon: GraduationCap },
  { key: "timetable", label: "Timetable", icon: Clock },
  { key: "discounts", label: "Discounts", icon: Tag },
  { key: "budget",    label: "Budget",    icon: DollarSign },
  { key: "events",    label: "Events",    icon: Calendar },
  { key: "tabarruk",  label: "Tabarruk",  icon: Gift },
] as const;

const STATUS_CONFIG: Record<string, string> = {
  active:    "bg-success/10 text-success border-success/20",
  upcoming:  "bg-info/10 text-info border-info/20",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const TAB_COMPONENTS: Record<string, React.ElementType> = {
  classes:   ClassesTab,
  timetable: TimetableTab,
  discounts: DiscountsTab,
  budget:    BudgetTab,
  events:    EventsTab,
  tabarruk:  TabarrukTab,
};

interface SessionDetailProps {
  session: Session;
  onClose: () => void;
  onUpdate: (session: Session) => void;
  onEdit: (session: Session) => void;
}

/**
 * SessionDetail Component
 *
 * Displays detailed information about a specific session in a modal.
 * Includes tabs for Classes, Timetable, Discounts, Budget, Events, and Tabarruk.
 *
 * @param {SessionDetailProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function SessionDetail({ session, onClose, onUpdate, onEdit }: SessionDetailProps) {
  const { canWrite } = useModulePermissions(SESSIONS_MODULE_CONTRACT);
  const [tab, setTab] = useState("classes");
  const TabContent = TAB_COMPONENTS[tab];

  const formatSessionDate = (date?: string | null) => formatDate(date, true);

  return (
    <Modal
      open
      onClose={onClose}
      title={session.name}
      subtitle={
        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
          <span>{formatSessionDate(session.startDate)} → {formatSessionDate(session.endDate)}</span>
          <span className="font-semibold text-foreground">{formatMoney(session.baseFee, session.currency)} / month</span>
        </div>
      }
      icon={GraduationCap}
      size="lg"
      headerExtra={
        <div className="flex items-center gap-2 flex-wrap mb-1 mt-1">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[session.status] || STATUS_CONFIG.active}`}>
            {session.status?.toUpperCase()}
          </span>
          <span className="text-[11px] text-muted-foreground">{session.type}</span>
        </div>
      }
      headerActions={
        canWrite && (
          <Button onClick={() => onEdit(session)} variant="ghost" size="icon" aria-label="Edit Session" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <Edit2 className="w-4 h-4" aria-hidden="true" />
          </Button>
        )
      }
    >

        <div className="flex border-b border-border bg-card flex-shrink-0 px-2 py-1.5 overflow-x-auto">
          <SubTabBar
            tabs={TABS}
            value={tab}
            onChange={setTab}
            panelIdPrefix="session-detail-subtab"
          />
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            <motion.section
              key={tab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              aria-label={`${TABS.find((tabDefinition) => tabDefinition.key === tab)?.label} Content`}
            >
              <TabContent session={session} onUpdate={onUpdate} />
            </motion.section>
          </AnimatePresence>
        </div>
    </Modal>
  );
}
