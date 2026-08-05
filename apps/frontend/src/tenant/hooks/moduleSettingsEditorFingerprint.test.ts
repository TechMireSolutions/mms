import { describe, expect, it } from "vitest";
import { moduleSettingsEditorFingerprint } from "./moduleSettingsEditorFingerprint";
import { toggleFieldRequired, toggleFieldUnique } from "./moduleFieldsEditorFieldHandlers";

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

describe("field chip toggles survive same-content fingerprint", () => {
  it("keeps Required/Unique Set membership when fingerprint is unchanged", () => {
    let tabFieldRequired: Record<string, Set<string>> = { basic: new Set() };
    let tabFieldUnique: Record<string, Set<string>> = { basic: new Set() };

    toggleFieldRequired("basic", "cnic", (updater) => {
      tabFieldRequired = typeof updater === "function" ? updater(tabFieldRequired) : updater;
    });
    toggleFieldUnique("basic", "cnic", (updater) => {
      tabFieldUnique = typeof updater === "function" ? updater(tabFieldUnique) : updater;
    });

    expect(tabFieldRequired.basic.has("cnic")).toBe(true);
    expect(tabFieldUnique.basic.has("cnic")).toBe(true);

    const fingerprintBefore = moduleSettingsEditorFingerprint({
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
      requiredTabs: [],
      formTabs: [{ key: "basic", label: "Basic", enabled: true, order: 0 }],
      tabRegistry: [{ key: "basic" }],
      resolvedDefaultEnabledTabs: ["basic"],
    });
    const fingerprintAfterIdentityChurn = moduleSettingsEditorFingerprint({
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
      requiredTabs: [],
      formTabs: [{ key: "basic", label: "Basic", enabled: true, order: 0 }],
      tabRegistry: [{ key: "basic" }],
      resolvedDefaultEnabledTabs: ["basic"],
    });

    // Same content → rehydrate effect must not run → draft Sets keep membership.
    expect(fingerprintBefore).toBe(fingerprintAfterIdentityChurn);
    expect(tabFieldRequired.basic.has("cnic")).toBe(true);
    expect(tabFieldUnique.basic.has("cnic")).toBe(true);
  });
});
