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

  it("normalizes a fresh draft with empty rows", () => {
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
    expect(Array.isArray(draft.phones)).toBe(true);
    expect(draft.socials).toEqual([{ platform: "Facebook", url: "" }]);
    expect(draft.relationshipContacts).toEqual([{ relationship: "Parent", contactId: "" }]);
  });

  it("applies DFS custom field defaults into customData for new contacts", () => {
    const dfsTabs = [
      {
        id: "tab-1",
        key: "custom_tab",
        label: "Custom Info",
        enabled: true,
        required: false,
        sortOrder: 0,
        isSystem: false,
        fields: [
          {
            id: "f-1",
            tabId: "tab-1",
            key: "bloodGroup",
            label: "Blood Group",
            type: "select" as const,
            enabled: true,
            required: false,
            unique: false,
            defaultValue: "O+",
            sortOrder: 0,
            hasData: false,
            isSystem: false,
          },
        ],
      },
    ];

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
      dfsTabs,
    });

    expect((draft.customData as Record<string, unknown>)?.bloodGroup).toBe("O+");
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

