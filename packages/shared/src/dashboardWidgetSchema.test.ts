import { describe, expect, it } from "vitest";
import {
  customWidgetSchema,
  dashboardWidgetsPutBodySchema,
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

  it("rejects unknown keys (strict)", () => {
    const parsed = customWidgetSchema.safeParse({ ...validWidget, bogus: true });
    expect(parsed.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const { id: _id, ...missingId } = validWidget;
    expect(customWidgetSchema.safeParse(missingId).success).toBe(false);
    const { operation: _op, ...missingOp } = validWidget;
    expect(customWidgetSchema.safeParse(missingOp).success).toBe(false);
    const { color: _color, ...missingColor } = validWidget;
    expect(customWidgetSchema.safeParse(missingColor).success).toBe(false);
  });

  it("rejects an invalid operation / widgetType enum", () => {
    expect(
      customWidgetSchema.safeParse({ ...validWidget, operation: "median" }).success,
    ).toBe(false);
    expect(
      customWidgetSchema.safeParse({ ...validWidget, widgetType: "heatmap" }).success,
    ).toBe(false);
  });
});

describe("dashboardWidgetsPutBodySchema", () => {
  it("parses an array of widgets", () => {
    const parsed = dashboardWidgetsPutBodySchema.safeParse([validWidget, { ...validWidget, id: "custom-2" }]);
    expect(parsed.success).toBe(true);
  });

  it("rejects more than 500 widgets", () => {
    const tooMany = Array.from({ length: 501 }, (_, i) => ({ ...validWidget, id: `w-${i}` }));
    expect(dashboardWidgetsPutBodySchema.safeParse(tooMany).success).toBe(false);
  });
});