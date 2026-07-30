import type { CustomWidget } from "./pinnedWidgetTypes";

export const hasanatWidgetSeeds: CustomWidget[] = [
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
    ];
