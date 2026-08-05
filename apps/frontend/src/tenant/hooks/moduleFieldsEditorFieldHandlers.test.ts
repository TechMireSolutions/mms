import { describe, expect, it } from "vitest";
import type { FieldDefinition } from "@mms/shared";
import { buildFieldsMap } from "./moduleFieldsEditorBuildMap";
import {
  handleCustomFieldsChange,
  handleEditField,
  toggleFieldEnabled,
} from "./moduleFieldsEditorFieldHandlers";

function field(partial: Partial<FieldDefinition> & { key: string }): FieldDefinition {
  return {
    label: partial.key,
    type: "text",
    enabled: true,
    order: 0,
    required: false,
    unique: false,
    permissions: [],
    defaultValue: "",
    ...partial,
  };
}

describe("moduleFieldsEditorFieldHandlers Set sync", () => {
  it("clears required and unique when disabling a field", () => {
    let tabFieldEnabled: Record<string, Set<string>> = {
      basic: new Set(["cnic"]),
    };
    let tabFieldRequired: Record<string, Set<string>> = {
      basic: new Set(["cnic"]),
    };
    let tabFieldUnique: Record<string, Set<string>> = {
      basic: new Set(["cnic"]),
    };

    toggleFieldEnabled(
      "basic",
      "cnic",
      (updater) => {
        tabFieldEnabled = typeof updater === "function" ? updater(tabFieldEnabled) : updater;
      },
      (updater) => {
        tabFieldRequired = typeof updater === "function" ? updater(tabFieldRequired) : updater;
      },
      (updater) => {
        tabFieldUnique = typeof updater === "function" ? updater(tabFieldUnique) : updater;
      },
    );

    expect(tabFieldEnabled.basic.has("cnic")).toBe(false);
    expect(tabFieldRequired.basic.has("cnic")).toBe(false);
    expect(tabFieldUnique.basic.has("cnic")).toBe(false);
  });

  it("persists FieldEditor required/unique via Sets in buildFieldsMap", () => {
    let tabFields: Record<string, FieldDefinition[]> = {
      custom: [field({ key: "loyaltyNotes" })],
    };
    let tabFieldRequired: Record<string, Set<string>> = { custom: new Set() };
    let tabFieldUnique: Record<string, Set<string>> = { custom: new Set() };
    const tabFieldEnabled: Record<string, Set<string>> = {
      custom: new Set(["loyaltyNotes"]),
    };
    const tabFieldOrder: Record<string, string[]> = { custom: ["loyaltyNotes"] };

    handleEditField(
      "custom",
      field({ key: "loyaltyNotes", required: true, unique: true }),
      (updater) => {
        tabFields = typeof updater === "function" ? updater(tabFields) : updater;
      },
      (updater) => {
        tabFieldRequired =
          typeof updater === "function" ? updater(tabFieldRequired) : updater;
      },
      (updater) => {
        tabFieldUnique = typeof updater === "function" ? updater(tabFieldUnique) : updater;
      },
    );

    const map = buildFieldsMap(
      [{ key: "custom", label: "Custom", enabled: true, order: 0 }],
      tabFields,
      tabFieldEnabled,
      tabFieldRequired,
      tabFieldUnique,
      tabFieldOrder,
      {},
      {},
    );

    expect(map.custom?.[0]?.required).toBe(true);
    expect(map.custom?.[0]?.unique).toBe(true);
  });

  it("opts new custom fields into required/unique Sets from FieldEditor flags", () => {
    let tabFields: Record<string, FieldDefinition[]> = { custom: [] };
    let tabFieldOrder: Record<string, string[]> = { custom: [] };
    let tabFieldEnabled: Record<string, Set<string>> = { custom: new Set() };
    let tabFieldRequired: Record<string, Set<string>> = { custom: new Set() };
    let tabFieldUnique: Record<string, Set<string>> = { custom: new Set() };

    handleCustomFieldsChange(
      "custom",
      [
        {
          key: "score",
          label: "Score",
          type: "number",
          enabled: true,
          required: true,
          unique: true,
          order: 0,
          permissions: [],
          defaultValue: 0,
        },
      ],
      (updater) => {
        tabFieldOrder = typeof updater === "function" ? updater(tabFieldOrder) : updater;
      },
      (updater) => {
        tabFields = typeof updater === "function" ? updater(tabFields) : updater;
      },
      (updater) => {
        tabFieldEnabled =
          typeof updater === "function" ? updater(tabFieldEnabled) : updater;
      },
      (updater) => {
        tabFieldRequired =
          typeof updater === "function" ? updater(tabFieldRequired) : updater;
      },
      (updater) => {
        tabFieldUnique = typeof updater === "function" ? updater(tabFieldUnique) : updater;
      },
    );

    expect(tabFieldEnabled.custom?.has("score")).toBe(true);
    expect(tabFieldRequired.custom?.has("score")).toBe(true);
    expect(tabFieldUnique.custom?.has("score")).toBe(true);

    const map = buildFieldsMap(
      [{ key: "custom", label: "Custom", enabled: true, order: 0 }],
      tabFields,
      tabFieldEnabled,
      tabFieldRequired,
      tabFieldUnique,
      tabFieldOrder,
      {},
      {},
    );
    expect(map.custom?.[0]).toMatchObject({
      key: "score",
      required: true,
      unique: true,
      enabled: true,
    });
  });

  it("buildFieldsMap writes enabled/required/unique from Sets", () => {
    const map = buildFieldsMap(
      [{ key: "basic", label: "Basic", enabled: true, order: 0 }],
      {
        basic: [
          field({ key: "cnic", enabled: false, required: false, unique: false }),
        ],
      },
      { basic: new Set(["cnic"]) },
      { basic: new Set(["cnic"]) },
      { basic: new Set(["cnic"]) },
      { basic: ["cnic"] },
      {},
      {},
    );
    expect(map.basic?.[0]).toMatchObject({
      key: "cnic",
      enabled: true,
      required: true,
      unique: true,
    });
  });
});
