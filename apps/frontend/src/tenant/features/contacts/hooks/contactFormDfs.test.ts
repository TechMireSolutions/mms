import { describe, expect, it } from "vitest";
import {
  buildDynamicValidationSchema,
  customFieldConfigSchema,
  applyDfsCustomFieldDefaults,
  type TabConfig,
  type Contact,
} from "@mms/shared";
import {
  buildInitialContactDraft,
  buildOptionDefaults,
} from "./contactFormDraftUtils";

describe("Contact Form DFS (Dynamic Form System) Integration", () => {
  const mockDfsTabs: TabConfig[] = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      key: "basic",
      label: "Basic Info",
      enabled: true,
      required: false,
      sortOrder: 0,
      isSystem: true,
      fields: [
        customFieldConfigSchema.parse({
          id: "33333333-3333-4333-8333-333333333333",
          tabId: "11111111-1111-4111-8111-111111111111",
          key: "bloodGroup",
          label: "Blood Group",
          type: "select",
          enabled: true,
          required: true,
          options: ["A+", "B+", "O+", "AB+"],
          defaultValue: "O+",
        }),
      ],
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      key: "custom_medical",
      label: "Medical Info",
      enabled: true,
      required: false,
      sortOrder: 1,
      isSystem: false,
      fields: [
        customFieldConfigSchema.parse({
          id: "44444444-4444-4444-8444-444444444444",
          tabId: "22222222-2222-4222-8222-222222222222",
          key: "allergies",
          label: "Allergies",
          type: "text",
          enabled: true,
          required: false,
          defaultValue: "None",
        }),
        customFieldConfigSchema.parse({
          id: "55555555-5555-4555-8555-555555555555",
          tabId: "22222222-2222-4222-8222-222222222222",
          key: "annualFee",
          label: "Annual Medical Fee",
          type: "currency",
          enabled: true,
          required: true,
        }),
      ],
    },
  ];

  it("applies DFS custom field defaults to customData on new contacts", () => {
    const draft = applyDfsCustomFieldDefaults<{ id?: string; customData?: Record<string, unknown> }>({}, mockDfsTabs);
    const customData = draft.customData as Record<string, unknown> | undefined;

    expect(customData?.bloodGroup).toBe("O+");
    expect(customData?.allergies).toBe("None");
  });

  it("does not overwrite existing customData keys when applying DFS defaults", () => {
    const draft = applyDfsCustomFieldDefaults(
      { customData: { bloodGroup: "B+", allergies: "Peanuts" } },
      mockDfsTabs,
    );
    const customData = draft.customData as Record<string, unknown>;

    expect(customData?.bloodGroup).toBe("B+");
    expect(customData?.allergies).toBe("Peanuts");
  });

  it("does not apply DFS defaults when editing an existing contact", () => {
    const draft = applyDfsCustomFieldDefaults(
      { id: "c-123", name: "Existing Contact" } as Partial<Contact>,
      mockDfsTabs,
    );

    expect(draft.customData).toBeUndefined();
  });

  it("validates DFS custom fields cleanly using buildDynamicValidationSchema", () => {
    const activeFields = mockDfsTabs
      .filter((t) => t.enabled)
      .flatMap((t) => t.fields)
      .filter((f) => f.enabled);

    const schema = buildDynamicValidationSchema(activeFields);

    // Valid values
    const valid = schema.safeParse({
      bloodGroup: "A+",
      allergies: "Dust",
      annualFee: "100.00",
    });
    expect(valid.success).toBe(true);

    // Invalid missing required fields
    const missingRequired = schema.safeParse({
      allergies: "Dust",
    });
    expect(missingRequired.success).toBe(false);

    // Invalid currency format
    const invalidCurrency = schema.safeParse({
      bloodGroup: "O+",
      allergies: "Dust",
      annualFee: "invalid-money",
    });
    expect(invalidCurrency.success).toBe(false);
  });

  it("integrates with buildInitialContactDraft seamlessly", () => {
    const optionDefaults = buildOptionDefaults({
      phoneLabels: ["Mobile"],
      emailLabels: ["Personal"],
      addressLabels: ["Home"],
      socialPlatforms: ["Facebook"],
      relationshipOptions: ["Parent"],
      defaultPhoneCountryCode: "+92",
    });

    const draft = buildInitialContactDraft({
      contact: undefined,
      initialDraft: undefined,
      defaultCity: "Lahore",
      defaultProvince: "Punjab",
      defaultCountry: "Pakistan",
      optionDefaults,
      fields: {},
      socialPlatforms: ["Facebook"],
      relationshipOptions: ["Parent"],
      dfsTabs: mockDfsTabs,
    });

    const customData = draft.customData as Record<string, unknown>;
    expect(customData.bloodGroup).toBe("O+");
    expect(customData.allergies).toBe("None");
  });
});
