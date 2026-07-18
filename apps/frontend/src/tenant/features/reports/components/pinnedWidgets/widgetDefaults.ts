import type { CustomWidget } from "@/tenant/features/reports/components/pinnedWidgets/types";
import { DEFAULT_WIDGET_TITLE_KEYS } from "@/lib/dashboardWidgets";
import { DASHBOARD_WIDGETS_KEY } from "@mms/shared";
import { getObject } from "@/lib/db";

function withDefaultTitleKey(widget: CustomWidget): CustomWidget {
  const titleKey = widget.titleKey ?? DEFAULT_WIDGET_TITLE_KEYS[widget.id];
  return titleKey ? { ...widget, titleKey } : widget;
}

export function getDefaultCustomWidgets(category: string): CustomWidget[] {
  const defaults: Record<string, CustomWidget[]> = {
    contacts: [
      {
        id: "def-contacts-total",
        title: "Total Contacts",
        category: "contacts",
        collection: "contacts",
        widgetType: "kpi",
        operation: "count",
        color: "blue",
        isPinnedToDashboard: true
      },
      {
        id: "def-contacts-whatsapp",
        title: "WhatsApp Verified Rate",
        category: "contacts",
        collection: "contacts",
        widgetType: "progress",
        operation: "percentage",
        filterField: "whatsappStatus",
        filterOperator: "equals",
        filterValue: "REGISTERED",
        color: "amber",
        isPinnedToDashboard: false
      }
    ],
    students: [
      {
        id: "def-card-admin-students",
        title: "Total Students",
        category: "students",
        collection: "students",
        widgetType: "card",
        operation: "count",
        icon: "GraduationCap",
        color: "emerald",
        subTextType: "fixed",
        fixedSubText: "Registered students",
        trend: 14,
        trendType: "manual",
        role: "admin",
        isPinnedToDashboard: false
      },
      {
        id: "def-card-admin-attendance",
        title: "Attendance Today",
        category: "students",
        collection: "attendance_records",
        widgetType: "card",
        operation: "percentage",
        filterField: "status",
        filterOperator: "equals",
        filterValue: "present",
        icon: "UserCheck",
        color: "amber",
        subTextType: "fixed",
        fixedSubText: "Attendance rate today",
        trend: -3,
        trendType: "manual",
        role: "admin",
        isPinnedToDashboard: false
      },
      {
        id: "def-card-teacher-attendance",
        title: "Attendance Today",
        category: "students",
        collection: "attendance_records",
        widgetType: "card",
        operation: "percentage",
        filterField: "status",
        filterOperator: "equals",
        filterValue: "present",
        icon: "UserCheck",
        color: "emerald",
        subTextType: "fixed",
        fixedSubText: "Average present rate",
        trend: 5,
        trendType: "manual",
        role: "teacher",
        isPinnedToDashboard: false
      },
      {
        id: "def-students-kpi",
        title: "Active Students",
        category: "students",
        collection: "students",
        widgetType: "kpi",
        operation: "count",
        filterField: "status",
        filterOperator: "equals",
        filterValue: "active",
        color: "emerald",
        isPinnedToDashboard: true,
        thresholdEnabled: true,
        thresholdCondition: "lt",
        thresholdValue: 10,
        thresholdColor: "amber"
      },
      {
        id: "def-students-lock",
        title: "Attendance Locking",
        category: "students",
        collection: "students",
        widgetType: "switch",
        operation: "count",
        switchActionType: "app_setting",
        switchStateKey: "app_setting_attendance_lock",
        switchLabelOn: "Locked",
        switchLabelOff: "Unlocked",
        color: "red",
        isPinnedToDashboard: true
      },
      {
        id: "def-attendance-summary",
        title: "Today's Attendance Summary",
        category: "students",
        collection: "attendance_records",
        widgetType: "attendance-summary",
        operation: "percentage",
        filterField: "status",
        filterOperator: "equals",
        filterValue: "present",
        color: "amber",
        isPinnedToDashboard: true
      },
      {
        id: "def-enrollment-trends",
        title: "Enrollment Trends",
        category: "students",
        collection: "students",
        widgetType: "enrollment-trends",
        operation: "count",
        color: "emerald",
        isPinnedToDashboard: true
      },
      {
        id: "def-attendance-rate",
        title: "Attendance Rate",
        category: "students",
        collection: "attendance_records",
        widgetType: "attendance-rate",
        operation: "percentage",
        color: "blue",
        isPinnedToDashboard: true
      }
    ],
    financial: [
      {
        id: "def-card-admin-fees",
        title: "Fee Collection",
        category: "financial",
        collection: "finance_invoices",
        widgetType: "card",
        operation: "sum",
        targetField: "paidAmt",
        filterField: "status",
        filterOperator: "equals",
        filterValue: "paid",
        icon: "DollarSign",
        color: "emerald",
        subTextType: "fixed",
        fixedSubText: "This month",
        trend: 11,
        trendType: "manual",
        role: "admin",
        isPinnedToDashboard: false
      },
      {
        id: "def-card-admin-outstanding",
        title: "Outstanding Payments",
        category: "financial",
        collection: "finance_invoices",
        widgetType: "card",
        operation: "sum",
        targetField: "finalAmt",
        filterField: "status",
        filterOperator: "equals",
        filterValue: "unpaid",
        icon: "AlertCircle",
        color: "red",
        subTextType: "fixed",
        fixedSubText: "Unpaid invoices",
        trend: -8,
        trendType: "manual",
        role: "admin",
        isPinnedToDashboard: false
      },
      {
        id: "def-card-accountant-fees",
        title: "Fee Collection",
        category: "financial",
        collection: "finance_invoices",
        widgetType: "card",
        operation: "sum",
        targetField: "paidAmt",
        filterField: "status",
        filterOperator: "equals",
        filterValue: "paid",
        icon: "DollarSign",
        color: "emerald",
        subTextType: "fixed",
        fixedSubText: "This month",
        trend: 11,
        trendType: "manual",
        role: "accountant",
        isPinnedToDashboard: false
      },
      {
        id: "def-card-accountant-outstanding",
        title: "Outstanding Payments",
        category: "financial",
        collection: "finance_invoices",
        widgetType: "card",
        operation: "sum",
        targetField: "finalAmt",
        filterField: "status",
        filterOperator: "equals",
        filterValue: "unpaid",
        icon: "AlertCircle",
        color: "red",
        subTextType: "fixed",
        fixedSubText: "Unpaid invoices",
        trend: -8,
        trendType: "manual",
        role: "accountant",
        isPinnedToDashboard: false
      },
      {
        id: "def-card-accountant-revenue",
        title: "Total Revenue (YTD)",
        category: "financial",
        collection: "finance_invoices",
        widgetType: "card",
        operation: "sum",
        targetField: "finalAmt",
        filterField: "status",
        filterOperator: "equals",
        filterValue: "paid",
        icon: "TrendingUp",
        color: "blue",
        subTextType: "fixed",
        fixedSubText: "From invoices",
        trend: 11.4,
        trendType: "manual",
        role: "accountant",
        isPinnedToDashboard: false
      },
      {
        id: "def-card-accountant-expenses",
        title: "Total Expenses (YTD)",
        category: "financial",
        collection: "finance_invoices",
        widgetType: "card",
        operation: "sum",
        targetField: "discountAmt",
        icon: "Receipt",
        color: "violet",
        subTextType: "fixed",
        fixedSubText: "Total discount offset",
        trend: -2,
        trendType: "manual",
        role: "accountant",
        isPinnedToDashboard: false
      },
      {
        id: "def-finance-outstanding",
        title: "Overdue Payments",
        category: "financial",
        collection: "finance_invoices",
        widgetType: "kpi",
        operation: "sum",
        targetField: "finalAmt",
        filterField: "status",
        filterOperator: "equals",
        filterValue: "unpaid",
        color: "red",
        isPinnedToDashboard: true,
        thresholdEnabled: true,
        thresholdCondition: "gt",
        thresholdValue: 10000,
        thresholdColor: "red"
      },
      {
        id: "def-finance-paid-rate",
        title: "Paid Invoices Ratio",
        category: "financial",
        collection: "finance_invoices",
        widgetType: "progress",
        operation: "percentage",
        filterField: "status",
        filterOperator: "equals",
        filterValue: "paid",
        color: "emerald",
        isPinnedToDashboard: true,
        thresholdEnabled: true,
        thresholdCondition: "lt",
        thresholdValue: 70,
        thresholdColor: "yellow"
      },
      {
        id: "def-finance-toggle-rev",
        title: "Show Revenue Graph",
        category: "financial",
        collection: "finance_invoices",
        widgetType: "switch",
        operation: "count",
        switchActionType: "app_setting",
        switchStateKey: "section_revenueChart",
        switchLabelOn: "Visible",
        switchLabelOff: "Hidden",
        color: "blue",
        isPinnedToDashboard: true
      },
      {
        id: "def-fee-summary",
        title: "Fee Collection Summary",
        category: "financial",
        collection: "finance_invoices",
        widgetType: "fee-summary",
        operation: "sum",
        targetField: "paidAmt",
        color: "emerald",
        isPinnedToDashboard: true
      },
      {
        id: "def-outstanding-list",
        title: "Outstanding Invoices List",
        category: "financial",
        collection: "finance_invoices",
        widgetType: "outstanding-list",
        operation: "sum",
        targetField: "finalAmt",
        color: "red",
        isPinnedToDashboard: true
      },
      {
        id: "def-overdue-obligations",
        title: "Overdue Obligations Table",
        category: "financial",
        collection: "finance_invoices",
        widgetType: "overdue-obligations",
        operation: "sum",
        targetField: "finalAmt",
        color: "red",
        isPinnedToDashboard: true
      },
      {
        id: "def-revenue-expenses",
        title: "Revenue & Expenses",
        category: "financial",
        collection: "finance_invoices",
        widgetType: "revenue-expenses",
        operation: "sum",
        color: "emerald",
        isPinnedToDashboard: true
      }
    ],
    hasanat: [
      {
        id: "def-card-admin-hasanat",
        title: "Hasanat Awarded",
        category: "hasanat",
        collection: "hasanat_distributions",
        widgetType: "card",
        operation: "sum",
        targetField: "points",
        icon: "Star",
        color: "amber",
        subTextType: "fixed",
        fixedSubText: "All-time points",
        trend: 22,
        trendType: "manual",
        role: "admin",
        isPinnedToDashboard: false
      },
      {
        id: "def-card-teacher-hasanat",
        title: "Hasanat Awarded",
        category: "hasanat",
        collection: "hasanat_distributions",
        widgetType: "card",
        operation: "sum",
        targetField: "points",
        icon: "Star",
        color: "amber",
        subTextType: "fixed",
        fixedSubText: "Awarded by me",
        trend: 12,
        trendType: "manual",
        role: "teacher",
        isPinnedToDashboard: false
      },
      {
        id: "def-hasanat-points",
        title: "Total Points Issued",
        category: "hasanat",
        collection: "hasanat_distributions",
        widgetType: "kpi",
        operation: "sum",
        targetField: "points",
        color: "amber",
        isPinnedToDashboard: true
      },
      {
        id: "def-hasanat-distribution",
        title: "Hasanat Distribution",
        category: "hasanat",
        collection: "hasanat_distributions",
        widgetType: "hasanat-distribution",
        operation: "sum",
        color: "amber",
        isPinnedToDashboard: true
      }
    ],
    sessions: [
      {
        id: "def-card-admin-sessions",
        title: "Active Sessions",
        category: "sessions",
        collection: "sessions",
        widgetType: "card",
        operation: "count",
        filterField: "status",
        filterOperator: "equals",
        filterValue: "active",
        icon: "CalendarCheck",
        color: "blue",
        subTextType: "fixed",
        fixedSubText: "Active sessions",
        trend: 0,
        trendType: "manual",
        role: "admin",
        isPinnedToDashboard: false
      },
      {
        id: "def-card-admin-classes",
        title: "Active Classes",
        category: "sessions",
        collection: "sessions",
        widgetType: "card",
        operation: "count",
        icon: "BookOpen",
        color: "violet",
        subTextType: "fixed",
        fixedSubText: "From active sessions",
        trend: 4,
        trendType: "manual",
        role: "admin",
        isPinnedToDashboard: false
      },
      {
        id: "def-card-teacher-classes",
        title: "My Classes",
        category: "sessions",
        collection: "sessions",
        widgetType: "card",
        operation: "count",
        icon: "BookOpen",
        color: "violet",
        subTextType: "fixed",
        fixedSubText: "All active classes",
        trend: 0,
        trendType: "manual",
        role: "teacher",
        isPinnedToDashboard: false
      },
      {
        id: "def-card-teacher-sessions",
        title: "Sessions Today",
        category: "sessions",
        collection: "sessions",
        widgetType: "card",
        operation: "count",
        icon: "CalendarCheck",
        color: "blue",
        subTextType: "fixed",
        fixedSubText: "Active classes count",
        trend: 0,
        trendType: "manual",
        role: "teacher",
        isPinnedToDashboard: false
      },
      {
        id: "def-sessions-count",
        title: "Active Sessions",
        category: "sessions",
        collection: "sessions",
        widgetType: "kpi",
        operation: "count",
        filterField: "status",
        filterOperator: "equals",
        filterValue: "active",
        color: "blue",
        isPinnedToDashboard: true
      },
      {
        id: "def-sessions-toggle-grid",
        title: "Dashboard Session List",
        category: "sessions",
        collection: "sessions",
        widgetType: "switch",
        operation: "count",
        switchActionType: "app_setting",
        switchStateKey: "section_sessionsTable",
        switchLabelOn: "Visible",
        switchLabelOff: "Hidden",
        color: "violet",
        isPinnedToDashboard: false
      },
      {
        id: "def-sessions-list",
        title: "Active Sessions List",
        category: "sessions",
        collection: "sessions",
        widgetType: "sessions-list",
        operation: "count",
        color: "blue",
        isPinnedToDashboard: true
      }
    ]
  };

  return defaults[category] || [];
}

/**
 * Loads, merges, and initializes the custom widgets database in local storage.
 * Synchronizes new defaults dynamically.
 */
export function getOrInitializeCustomWidgets(): CustomWidget[] {
  try {
    const saved = getObject<CustomWidget[] | null>(DASHBOARD_WIDGETS_KEY, null);
    const defaults = [
      ...getDefaultCustomWidgets("contacts"),
      ...getDefaultCustomWidgets("students"),
      ...getDefaultCustomWidgets("financial"),
      ...getDefaultCustomWidgets("hasanat"),
      ...getDefaultCustomWidgets("sessions"),
    ].map(withDefaultTitleKey);
    if (!saved) {
      return defaults;
    }
    const parsed = saved.map(withDefaultTitleKey);
    const existingIds = new Set(parsed.map((widget) => widget.id));
    const merged = [...parsed];
    for (const defaultWidget of defaults) {
      if (!existingIds.has(defaultWidget.id)) {
        merged.push(defaultWidget);
      } else {
        const widgetIndex = merged.findIndex((widget) => widget.id === defaultWidget.id);
        if (widgetIndex >= 0 && defaultWidget.titleKey && !merged[widgetIndex].titleKey) {
          merged[widgetIndex] = { ...merged[widgetIndex], titleKey: defaultWidget.titleKey };
        }
      }
    }
    return merged;
  } catch (error) {
    console.error("Failed to load custom widgets", error);
    return [];
  }
}
