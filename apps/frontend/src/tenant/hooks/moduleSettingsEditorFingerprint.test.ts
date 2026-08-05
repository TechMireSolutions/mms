import { describe, expect, it } from "vitest";
import { moduleSettingsEditorFingerprint } from "./moduleSettingsEditorFingerprint";

describe("moduleSettingsEditorFingerprint", () => {
  const base = {
    fields: {
      basic: [
        {
          key: "cnic",
          label: "CNIC",
          type: "text" as const,
          enabled: true,
          required: false,
          unique: false,
          order: 0,
        },
      ],
    },
    enabledTabs: ["basic"],
    requiredTabs: [] as string[],
    formTabs: [{ key: "basic", label: "Basic", enabled: true, order: 0 }],
    tabRegistry: [{ key: "basic" }],
    resolvedDefaultEnabledTabs: ["basic"],
    defaultRequiredTabs: [] as string[],
  };

  it("is stable across object identity churn with the same content", () => {
    const first = moduleSettingsEditorFingerprint(base);
    const second = moduleSettingsEditorFingerprint({
      ...base,
      fields: {
        basic: [
          {
            key: "cnic",
            label: "CNIC",
            type: "text",
            enabled: true,
            required: false,
            unique: false,
            order: 0,
          },
        ],
      },
      enabledTabs: ["basic"],
      formTabs: [{ key: "basic", label: "Basic", enabled: true, order: 0 }],
      tabRegistry: [{ key: "basic" }],
    });
    expect(first).toBe(second);
  });

  it("changes when a field required/unique flag in persisted fields changes", () => {
    const before = moduleSettingsEditorFingerprint(base);
    const after = moduleSettingsEditorFingerprint({
      ...base,
      fields: {
        basic: [
          {
            ...base.fields.basic[0],
            required: true,
            unique: true,
          },
        ],
      },
    });
    expect(before).not.toBe(after);
  });
});
