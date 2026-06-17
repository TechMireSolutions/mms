import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, GraduationCap, Clock, Tag, DollarSign,
  Calendar, Gift, Edit2,
} from "lucide-react";
import { formatDate } from "../../lib/db";

import ClassesTab from "./tabs/ClassesTab";
import TimetableTab from "./tabs/TimetableTab";
import DiscountsTab from "./tabs/DiscountsTab";
import BudgetTab from "./tabs/BudgetTab";
import EventsTab from "./tabs/EventsTab";
import TabarrukTab from "./tabs/TabarrukTab";

import { Session } from '@/lib/data/sessionsData';

const TABS = [
  { id: "classes",   label: "Classes",   icon: GraduationCap },
  { id: "timetable", label: "Timetable", icon: Clock },
  { id: "discounts", label: "Discounts", icon: Tag },
  { id: "budget",    label: "Budget",    icon: DollarSign },
  { id: "events",    label: "Events",    icon: Calendar },
  { id: "tabarruk",  label: "Tabarruk",  icon: Gift },
];

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
export default function SessionDetail({ session, onClose, onUpdate, onEdit }: SessionDetailProps) {
  const [tab, setTab] = useState("classes");
  const TabContent = TAB_COMPONENTS[tab];

  const fmtDate = (d?: string | null) => formatDate(d, true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="session-detail-title">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col z-10"
      >
        {/* Header */}
        <header className="px-6 py-4 border-b border-border flex-shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[session.status] || STATUS_CONFIG.active}`}>
                  {session.status?.toUpperCase()}
                </span>
                <span className="text-[11px] text-muted-foreground">{session.type}</span>
              </div>
              <h2 id="session-detail-title" className="text-base font-bold text-foreground leading-snug truncate m-0">{session.name}</h2>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                <span>{fmtDate(session.startDate)} → {fmtDate(session.endDate)}</span>
                <span className="font-semibold text-foreground">{session.currency} {Number(session.baseFee).toLocaleString()} / month</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => onEdit(session)} aria-label="Edit Session" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Edit2 className="w-4 h-4" aria-hidden="true" />
              </button>
              <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <nav aria-label="Session Tabs" className="flex border-b border-border overflow-x-auto flex-shrink-0 px-2 bg-card">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 px-3.5 py-3 text-[12px] font-semibold whitespace-nowrap border-b-2 transition-all ${
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            <motion.section
              key={tab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              aria-label={`${TABS.find((t) => t.id === tab)?.label} Content`}
            >
              <TabContent session={session} onUpdate={onUpdate} />
            </motion.section>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
