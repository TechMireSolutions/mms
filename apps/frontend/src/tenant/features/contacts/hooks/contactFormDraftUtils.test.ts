import { describe, expect, it } from "vitest";
import type { Contact, FieldDefinition } from "@mms/shared";
import {
  buildInitialContactDraft,
  buildOptionDefaults,
  contactDraftSnapshot,
} from "@/tenant/features/contacts/hooks/contactFormDraftUtils";

describe("contactDraftSnapshot", () => {
  it("strips blank phone rows and enforces a single primary", () => {
    const snapshot = contactDraftSnapshot({
      phones: [
        { number: "", isPrimary: false },
        { number: "3001234567", isPrimary: false },
      ],
    } as Partial<Contact>);
    const parsed = JSON.parse(snapshot) as { phones: { number: string; isPrimary: boolean }[] };
    expect(parsed.phones).toHaveLength(1);
    expect(parsed.phones[0]).toEqual({ number: "3001234567", isPrimary: true });
  });

  it("strips blank custom-collection rows", () => {
    const snapshot = contactDraftSnapshot({
      customCars: [{ brand: "" }, { brand: "Toyota" }],
    } as Partial<Contact>);
    const parsed = JSON.parse(snapshot) as { customCars: { brand: string }[] };
    expect(parsed.customCars).toEqual([{ brand: "Toyota" }]);
  });
});

describe("buildOptionDefaults", () => {
  it("uses the first of each option list", () => {
    expect(
      buildOptionDefaults({
        phoneLabels: ["Mobile", "Home"],
        emailLabels: ["Personal"],
        addressLabels: ["Home"],
        socialPlatforms: ["Facebook"],
        relationshipOptions: ["Parent"],
        defaultPhoneCountryCode: "+92",
      }),
    ).toEqual({
      phoneLabel: "Mobile",
      emailLabel: "Personal",
      addressLabel: "Home",
      socialPlatform: "Facebook",
      relationship: "Parent",
      defaultPhoneCountryCode: "+92",
    });
  });
});

describe("buildInitialContactDraft", () => {
  const optionDefaults = buildOptionDefaults({
    phoneLabels: ["Mobile"],
    emailLabels: ["Personal"],
    addressLabels: ["Home"],
    socialPlatforms: ["Facebook"],
    relationshipOptions: ["Parent"],
    defaultPhoneCountryCode: "+92",
  });

  const fields: Record<string, FieldDefinition[]> = {
    basic: [
      { key: "nickname", label: "Nickname", type: "text", enabled: true, order: 0, defaultValue: "Ali" },
    ],
  };

  it("normalizes a fresh draft with empty rows and applies scalar custom defaults", () => {
    const draft = buildInitialContactDraft({
      contact: undefined,
      initialDraft: undefined,
      defaultCity: "",
      defaultProvince: "",
      defaultCountry: "",
      optionDefaults,
      fields,
      socialPlatforms: ["Facebook"],
      relationshipOptions: ["Parent"],
    });
    expect(draft.nickname).toBe("Ali");
    expect(Array.isArray(draft.phones)).toBe(true);
    expect(draft.socials).toEqual([{ platform: "Facebook", url: "" }]);
    expect(draft.relationshipContacts).toEqual([{ relationship: "Parent", contactId: "" }]);
  });

  it("does not apply scalar defaults when editing an existing contact", () => {
    const draft = buildInitialContactDraft({
      contact: { id: 5, name: "Existing" } as unknown as Contact,
      initialDraft: undefined,
      defaultCity: "",
      defaultProvince: "",
      defaultCountry: "",
      optionDefaults,
      fields,
      socialPlatforms: ["Facebook"],
      relationshipOptions: ["Parent"],
    });
    expect(draft.id).toBe(5);
    expect(draft.nickname).toBeUndefined();
  });
});
