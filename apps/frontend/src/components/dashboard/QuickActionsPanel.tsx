import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { QUICK_ACTION_ROUTE_KEYS } from "@/lib/config/navConfig";
import { ROUTES } from "@/lib/config/routes";
import {
  UserPlus, CalendarPlus, DollarSign,
  Star, FileText, Printer, BarChart3, UserCheck,
} from "lucide-react";
import { type AppTranslationKey } from "@mms/shared";
import { UserRole } from '@/lib/data/dashboardData';
import useGlobalSettings from "@/hooks/useGlobalSettings";
import useTranslation from "@/hooks/useTranslation";

interface ActionSetItem {
  labelKey: AppTranslationKey;
  descKey: AppTranslationKey;
  icon: React.ElementType;
  color: "emerald" | "blue" | "amber" | "violet" | "slate";
  moduleId: string;
}

const ACTION_SETS: Record<string, ActionSetItem[]> = {
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

const COLOR: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  blue:    "bg-blue-50 text-blue-700",
  amber:   "bg-amber-50 text-amber-700",
  violet:  "bg-violet-50 text-violet-700",
  slate:   "bg-slate-100 text-slate-600",
};

interface QuickActionsPanelProps {
  role: UserRole | string;
}

/**
 * Displays a grid of role-specific quick actions to navigate
 * directly to frequent tasks.
 */
export default function QuickActionsPanel({ role }: QuickActionsPanelProps): React.JSX.Element | null {
  const settings = useGlobalSettings();
  const { t } = useTranslation();
  const enabledModules = settings.enabledModules || {};

  const allActions = ACTION_SETS[role] || ACTION_SETS.admin;
  const actions = allActions.filter((a) => enabledModules[a.moduleId] !== false);

  if (actions.length === 0) return null;

  return (
    <section aria-labelledby="quick-actions-panel-heading" className="bg-card rounded-xl border border-border p-5">
      <h3 id="quick-actions-panel-heading" className="text-sm font-semibold text-foreground mb-4 m-0">
        {t("action.quickActions")}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {actions.map((action, i) => {
          const Icon = action.icon;
          const label = t(action.labelKey);
          const href = QUICK_ACTION_ROUTE_KEYS[action.labelKey] ?? ROUTES.home;
          return (
            <motion.div
              key={action.labelKey}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                to={href}
                aria-label={label}
                className="group flex flex-col items-start gap-2.5 p-3.5 rounded-xl border border-border hover:border-primary/20 hover:shadow-md hover:shadow-primary/[0.04] transition-all duration-200 text-left"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${COLOR[action.color]}`} aria-hidden="true">
                  <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground m-0">{label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 m-0">{t(action.descKey)}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
