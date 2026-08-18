import { describe, expect, it } from "vitest";
import {
  customWidgetSchema,
  dashboardWidgetsPutBodySchema,
  normalizeDashboardWidget,
  normalizeDashboardWidgets,
  type DashboardWidgetDto,
} from "./dashboardWidgetSchema.js";

const validWidget: DashboardWidgetDto = {
  id: "custom-1",
  title: "My KPI",
  category: "students",
  collection: "students",
  operation: "count",
  color: "emerald",
  isPinnedToDashboard: true,
};

describe("customWidgetSchema", () => {
  it("parses a minimal valid widget", () => {
    const parsed = customWidgetSchema.safeParse(validWidget);
    expect(parsed.success).toBe(true);
  });

  it("parses a fully-populated widget", () => {
    const parsed = customWidgetSchema.safeParse({
      ...validWidget,
      widgetType: "card",
      icon: "Users",
      titleKey: "widget.title.totalStudents",
      fixedSubTextKey: "widget.subtitle.registeredStudents",
      role: "admin",
      trend: 5,
      trendType: "database",
      thresholdEnabled: true,
      thresholdCondition: "lt",
      thresholdValue: 60,
      thresholdColor: "red",
      chartType: "bar",
      sortOrder: 2,
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts passthrough extra fields gracefully", () => {
    const parsed = customWidgetSchema.safeParse({ ...validWidget, isDefault: true, customProp: "ok" });
    expect(parsed.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const { id: _id, ...missingId } = validWidget;
    expect(customWidgetSchema.safeParse(missingId).success).toBe(false);
    const { operation: _op, ...missingOp } = validWidget;
    expect(customWidgetSchema.safeParse(missingOp).success).toBe(false);
    const { color: _color, ...missingColor } = validWidget;
    expect(customWidgetSchema.safeParse(missingColor).success).toBe(false);
  });
});

describe("normalizeDashboardWidget", () => {
  it("normalizes empty string enums and legacy type/threshold keys", () => {
    const legacy = {
      id: "legacy-1",
      title: "Active Users",
      type: "kpi",
      category: "users",
      collection: "users",
      operation: "count",
      color: "blue",
      isPinnedToDashboard: true,
      filterOperator: "",
      subTextType: "",
      trendType: "",
      switchActionType: "",
      thresholdCondition: "",
      thresholdColor: "",
      chartType: "",
      threshold: "50",
      trend: "12",
      isDefault: true,
    };

    const normalized = normalizeDashboardWidget(legacy);
    expect(normalized).toBeDefined();
    expect(normalized?.id).toBe("legacy-1");
    expect(normalized?.widgetType).toBe("kpi");
    expect(normalized?.thresholdValue).toBe(50);
    expect(normalized?.trend).toBe(12);
    expect(normalized?.filterOperator).toBeUndefined();
    expect(normalized?.subTextType).toBeUndefined();
  });

  it("returns null for non-objects or empty id", () => {
    expect(normalizeDashboardWidget(null)).toBeNull();
    expect(normalizeDashboardWidget({ id: " " })).toBeNull();
  });
});

describe("dashboardWidgetsPutBodySchema", () => {
  it("parses and pre-normalizes an array of widgets", () => {
    const parsed = dashboardWidgetsPutBodySchema.safeParse([
      validWidget,
      { ...validWidget, id: "custom-2", type: "card", filterOperator: "" },
    ]);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toHaveLength(2);
      expect(parsed.data[1].id).toBe("custom-2");
      expect(parsed.data[1].widgetType).toBe("card");
    }
  });

  it("rejects more than 500 widgets", () => {
    const tooMany = Array.from({ length: 501 }, (_, i) => ({ ...validWidget, id: `w-${i}` }));
    expect(dashboardWidgetsPutBodySchema.safeParse(tooMany).success).toBe(false);
  });
});