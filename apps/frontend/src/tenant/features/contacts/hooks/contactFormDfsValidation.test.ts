import { describe, expect, it } from "vitest";
import {
  buildDynamicValidationSchema,
  customFieldConfigSchema,
  tabConfigSchema,
  type TabConfig,
} from "@mms/shared";

describe("Contact Form DFS Dynamic Validation", () => {
  const sampleDfsTabs: TabConfig[] = [
    tabConfigSchema.parse({
      id: "11111111-1111-4111-8111-111111111111",
      key: "basic",
      label: "Basic Info",
      enabled: true,
      required: false,
      sortOrder: 0,
      isSystem: true,
      fields: [
        customFieldConfigSchema.parse({
          id: "22222222-2222-4222-8222-222222222222",
          tabId: "11111111-1111-4111-8111-111111111111",
          key: "blood_group",
          label: "Blood Group",
          type: "select",
          enabled: true,
          required: true,
          unique: false,
          options: ["A+", "B+", "O+", "AB+"],
          sortOrder: 0,
        }),
      ],
    }),
    tabConfigSchema.parse({
      id: "33333333-3333-4333-8333-333333333333",
      key: "custom_preferences",
      label: "Custom Preferences",
      enabled: true,
      required: false,
      sortOrder: 1,
      isSystem: false,
      fields: [
        customFieldConfigSchema.parse({
          id: "44444444-4444-4444-8444-444444444444",
          tabId: "33333333-3333-4333-8333-333333333333",
          key: "membership_number",
          label: "Membership Number",
          type: "number",
          enabled: true,
          required: true,
          unique: false,
          minValue: 100,
          maxValue: 9999,
          sortOrder: 0,
        }),
      ],
    }),
  ];

  it("builds a dynamic Zod schema for active DFS tab fields", () => {
    const activeFields = sampleDfsTabs
      .filter((t) => t.enabled)
      .flatMap((t) => t.fields)
      .filter((f) => f.enabled);

    const schema = buildDynamicValidationSchema(activeFields);

    const validResult = schema.safeParse({
      blood_group: "O+",
      membership_number: 500,
    });
    expect(validResult.success).toBe(true);

    const invalidResult = schema.safeParse({
      blood_group: "",
      membership_number: 50,
    });
    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      expect(invalidResult.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("supports reading DFS field values from customData or top-level draft", () => {
    const activeFields = sampleDfsTabs[1].fields.filter((f) => f.enabled);
    const schema = buildDynamicValidationSchema(activeFields);

    const draftWithCustomData = {
      firstName: "Ali",
      customData: {
        membership_number: 1234,
      },
    };

    const merged = { ...draftWithCustomData.customData, ...draftWithCustomData };
    const result = schema.safeParse(merged);
    expect(result.success).toBe(true);
  });
});
