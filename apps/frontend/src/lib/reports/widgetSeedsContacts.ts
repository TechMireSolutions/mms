import type { CustomWidget } from "./pinnedWidgetTypes";

export const contactsWidgetSeeds: CustomWidget[] = [
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
        id: "def-card-admin-contacts",
        title: "Total Contacts",
        category: "contacts",
        collection: "contacts",
        widgetType: "card",
        operation: "count",
        icon: "Users",
        color: "blue",
        subTextType: "fixed",
        trend: 0,
        trendType: "manual",
        role: "admin",
        isPinnedToDashboard: true
      },
      {
        id: "def-card-accountant-contacts",
        title: "Total Contacts",
        category: "contacts",
        collection: "contacts",
        widgetType: "card",
        operation: "count",
        icon: "Users",
        color: "blue",
        subTextType: "fixed",
        trend: 0,
        trendType: "manual",
        role: "accountant",
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
    ];
