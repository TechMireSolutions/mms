import { describe, expect, it } from "vitest";
import {
  applyContactScalarCustomFieldDefaults,
  listEnabledCustomContactFormFields,
} from "./contactFormCustomFields.js";
import type { FieldDefinition } from "./contactFieldSchemaTypes.js";

function field(partial: Partial<FieldDefinition> & { key: string }): FieldDefinition {
  return {
    label: partial.key,
    type: "text",
    enabled: true,
    order: 0,
    required: false,
    permissions: [],
    defaultValue: "",
    ...partial,
  };
}

describe("listEnabledCustomContactFormFields", () => {
  it("scopes non-seed fields to the requested tab", () => {
    const fields = {
      basic: [
        field({ key: "firstName", order: 0 }),
        field({ key: "loyaltyNotes", order: 10 }),
      ],
      custom: [field({ key: "extraNote", order: 0 })],
    };

    expect(listEnabledCustomContactFormFields(fields, "basic").map((f) => f.key)).toEqual([
      "loyaltyNotes",
    ]);
    expect(listEnabledCustomContactFormFields(fields, "custom").map((f) => f.key)).toEqual([
      "extraNote",
    ]);
  });

  it("excludes disabled and system seed keys", () => {
    const fields = {
      basic: [
        field({ key: "firstName" }),
        field({ key: "hiddenCustom", enabled: false }),
        field({ key: "visibleCustom", enabled: true }),
      ],
    };

    expect(listEnabledCustomContactFormFields(fields, "basic").map((f) => f.key)).toEqual([
      "visibleCustom",
    ]);
  });

  it("aggregates all tabs when tabId is omitted", () => {
    const fields = {
      basic: [field({ key: "onBasic", order: 2 })],
      custom: [field({ key: "onCustom", order: 1 })],
    };

    expect(listEnabledCustomContactFormFields(fields).map((f) => f.key)).toEqual([
      "onCustom",
      "onBasic",
    ]);
  });
});

describe("applyContactScalarCustomFieldDefaults", () => {
  it("seeds defaultValue on new contacts only", () => {
    const fields = {
      basic: [field({ key: "loyaltyTier", defaultValue: "Gold" })],
      custom: [field({ key: "extraNote", defaultValue: "Hello" })],
    };

    expect(
      applyContactScalarCustomFieldDefaults({ firstName: "" }, fields),
    ).toMatchObject({
      firstName: "",
      loyaltyTier: "Gold",
      extraNote: "Hello",
    });

    expect(
      applyContactScalarCustomFieldDefaults({ id: "c1", firstName: "Ali" }, fields),
    ).toEqual({ id: "c1", firstName: "Ali" });
  });

  it("does not overwrite initialDraft values", () => {
    const fields = {
      custom: [field({ key: "extraNote", defaultValue: "Hello" })],
    };
    expect(
      applyContactScalarCustomFieldDefaults({ extraNote: "Keep me" }, fields),
    ).toEqual({ extraNote: "Keep me" });
  });
});
