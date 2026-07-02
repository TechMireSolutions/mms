import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { QUICK_ACTION_ROUTE_KEYS } from "@/lib/config/navConfig";
import { ROUTES } from "@/lib/config/routes";
import {
  UserPlus, CalendarPlus, DollarSign,
  Star, FileText, Printer, BarChart3, UserCheck, Sparkles,
} from "lucide-react";
import { type AppTranslationKey } from "@mms/shared";
import type { DashboardRole } from '@/lib/dashboardRole';
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { useTranslation } from "@/hooks/useTranslation";

interface ActionSetItem {
  labelKey: AppTranslationKey;
  descKey: AppTranslationKey;
  icon: React.ElementType;
  color: "emerald" | "blue" | "amber" | "violet" | "slate";
  moduleId: string;
}

const ACTION_SETS: Record<DashboardRole, ActionSetItem[]> = {
  admin: [
    { labelKey: "action.addStudent", descKey: "action.addStudentDesc", icon: UserPlus, color: "emerald", moduleId: "enrollment" },
    { labelKey: "action.createSession", descKey: "action.createSessionDesc", icon: CalendarPlus, color: "blue", moduleId: "sessions" },
    { labelKey: "action.recordPayment", descKey: "action.recordPaymentDesc", icon: DollarSign, color: "amber", moduleId: "finance" },
    { labelKey: "action.takeAttendance", descKey: "action.takeAttendanceDesc", icon: UserCheck, color: "violet", moduleId: "attendance" },
    { labelKey: "action.awardHasanat", descKey: "action.awardHasanatDesc", icon: Star, color: "amber", moduleId: "hasanat" },
    { labelKey: "action.generateReport", descKey: "action.generateReportDesc", icon: BarChart3, color: "slate", moduleId: "reports" },
  ],
  teacher: [
    { labelKey: "action.takeAttendance", descKey: "action.takeAttendanceDesc", icon: UserCheck, color: "emerald", moduleId: "attendance" },
    { labelKey: "action.awardHasanat", descKey: "action.awardHasanatDesc", icon: Star, color: "amber", moduleId: "hasanat" },
    { labelKey: "action.addStudent", descKey: "action.addStudentDesc", icon: UserPlus, color: "blue", moduleId: "enrollment" },
    { labelKey: "action.createSession", descKey: "action.createSessionDesc", icon: CalendarPlus, color: "violet", moduleId: "sessions" },
  ],
  accountant: [
    { labelKey: "action.recordPayment", descKey: "action.recordPaymentDesc", icon: DollarSign, color: "emerald", moduleId: "finance" },
    { labelKey: "action.generateReport", descKey: "action.generateReportDesc", icon: BarChart3, color: "blue", moduleId: "reports" },
    { labelKey: "action.printReceipt", descKey: "action.printReceiptDesc", icon: Printer, color: "amber", moduleId: "finance" },
    { labelKey: "action.viewLedger", descKey: "action.viewLedgerDesc", icon: FileText, color: "violet", moduleId: "accounting" },
  ],
};

const ACTION_COLOR_CLASSES: Record<ActionSetItem["color"], string> = {
  emerald: "bg-success/10 text-success",
  blue:    "bg-info/10 text-info",
  amber:   "bg-warning/10 text-warning",
  violet:  "bg-primary/10 text-primary",
  slate:   "bg-muted text-muted-foreground",
};

interface QuickActionsPanelProps {
  dashboardRole: DashboardRole;
}

/**
 * Displays a grid of role-specific quick actions to navigate
 * directly to frequent tasks.
 */
export default function QuickActionsPanel({ dashboardRole }: QuickActionsPanelProps): React.JSX.Element | null {
  const settings = useGlobalSettings();
  const { t } = useTranslation();
  const enabledModules = settings.enabledModules || {};

  const allActions = ACTION_SETS[dashboardRole] || ACTION_SETS.admin;
  const actions = allActions.filter((quickAction) => enabledModules[quickAction.moduleId] !== false);

  if (actions.length === 0) return null;

  return (
    <section aria-labelledby="quick-actions-panel-heading" className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5 px-6 pb-6 shadow-sm hover:shadow-md transition-all duration-300 text-left">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/60 transition-colors group-hover:bg-primary" />
      <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-4.5">
        <Sparkles className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
        <h3 id="quick-actions-panel-heading" className="text-xs font-bold text-foreground uppercase tracking-wider m-0">
          {t("action.quickActions")}
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((quickAction, actionIndex) => {
          const Icon = quickAction.icon;
          const label = t(quickAction.labelKey);
          const href = QUICK_ACTION_ROUTE_KEYS[quickAction.labelKey] ?? ROUTES.home;
          return (
            <motion.div
              key={quickAction.labelKey}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: actionIndex * 0.06 }}
            >
              <Link
                to={href}
                aria-label={label}
                className="group/item flex flex-col items-start gap-2.5 p-3.5 rounded-xl border border-border bg-card/25 backdrop-blur-xs hover:border-primary/25 hover:shadow-sm transition-all duration-250 text-left h-full w-full"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover/item:scale-110 duration-200 ${ACTION_COLOR_CLASSES[quickAction.color]}`} aria-hidden="true">
                  <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-foreground group-hover/item:text-primary transition-colors m-0 leading-tight">{label}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5 m-0 leading-normal">{t(quickAction.descKey)}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
