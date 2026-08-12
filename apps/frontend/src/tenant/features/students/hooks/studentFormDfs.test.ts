import { describe, expect, it } from "vitest";
import {
  buildDynamicValidationSchema,
  customFieldConfigSchema,
  listEnabledCustomStudentFormFields,
  applyStudentScalarCustomFieldDefaults,
  applyStudentDfsCustomFieldDefaults,
  type TabConfig,
  type Student,
} from "@mms/shared";
import { getInitialStudentDraft } from "../components/studentFormDraft";
import { validateStudentDraft } from "./studentFormValidation";

describe("Student Form DFS (Dynamic Form System) Integration", () => {
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
      key: "custom_academic_info",
      label: "Academic Extra",
      enabled: true,
      required: false,
      sortOrder: 1,
      isSystem: false,
      fields: [
        customFieldConfigSchema.parse({
          id: "44444444-4444-4444-8444-444444444444",
          tabId: "22222222-2222-4222-8222-222222222222",
          key: "previousSchool",
          label: "Previous School",
          type: "text",
          enabled: true,
          required: false,
          defaultValue: "N/A",
        }),
      ],
    },
  ];

  it("lists custom student form fields correctly while excluding system fields", () => {
    const fields = {
      basic: [
        { key: "contactId", label: "Contact", type: "text", enabled: true, required: true },
        { key: "customHobby", label: "Hobby", type: "text", enabled: true, required: false, order: 1 },
      ],
      registration: [
        { key: "grNumber", label: "GR Number", type: "text", enabled: true, required: true },
        { key: "customFeeNote", label: "Fee Note", type: "text", enabled: true, required: false, order: 2 },
      ],
    };

    const customBasic = listEnabledCustomStudentFormFields(fields as any, "basic");
    expect(customBasic.map((f) => f.key)).toEqual(["customHobby"]);

    const customRegistration = listEnabledCustomStudentFormFields(fields as any, "registration");
    expect(customRegistration.map((f) => f.key)).toEqual(["customFeeNote"]);
  });

  it("applies DFS custom field defaults to customData on new student drafts", () => {
    const draft = applyStudentDfsCustomFieldDefaults({}, mockDfsTabs);
    const customData = draft.customData as Record<string, unknown>;

    expect(customData?.bloodGroup).toBe("O+");
    expect(customData?.previousSchool).toBe("N/A");
  });

  it("does not overwrite existing customData keys when applying DFS defaults", () => {
    const draft = applyStudentDfsCustomFieldDefaults(
      { customData: { bloodGroup: "B+", previousSchool: "City High" } },
      mockDfsTabs,
    );
    const customData = draft.customData as Record<string, unknown>;

    expect(customData?.bloodGroup).toBe("B+");
    expect(customData?.previousSchool).toBe("City High");
  });

  it("does not apply DFS defaults when editing an existing student", () => {
    const draft = applyStudentDfsCustomFieldDefaults(
      { id: "std-123", contactId: "c-1" } as Partial<Student>,
      mockDfsTabs,
    );

    expect(draft.customData).toBeUndefined();
  });

  it("applies scalar custom field defaults to top-level keys for new students", () => {
    const fields = {
      basic: [
        { key: "customTransport", label: "Transport Mode", type: "text", enabled: true, required: false, defaultValue: "Bus" },
      ],
    };

    const draft = applyStudentScalarCustomFieldDefaults({}, fields as any);
    expect((draft as any).customTransport).toBe("Bus");
  });

  it("integrates seamlessly into getInitialStudentDraft with options object", () => {
    const draft = getInitialStudentDraft({
      student: null,
      dfsTabs: mockDfsTabs,
    });

    const customData = draft.customData as Record<string, unknown>;
    expect(customData?.bloodGroup).toBe("O+");
    expect(customData?.previousSchool).toBe("N/A");
  });

  it("validates DFS custom fields cleanly using buildDynamicValidationSchema", () => {
    const activeFields = mockDfsTabs
      .filter((t) => t.enabled)
      .flatMap((t) => t.fields)
      .filter((f) => f.enabled);

    const schema = buildDynamicValidationSchema(activeFields);

    const valid = schema.safeParse({
      bloodGroup: "A+",
      previousSchool: "St. Marys",
    });
    expect(valid.success).toBe(true);

    const invalidSelect = schema.safeParse({
      bloodGroup: "InvalidGroup",
      previousSchool: "St. Marys",
    });
    expect(invalidSelect.success).toBe(false);
  });

  it("validates DFS custom fields within validateStudentDraft", () => {
    const testSettings = {
      formTabs: [{ key: "basic", enabled: true }],
      fields: {},
      requiredTabs: [],
    } as any;

    const draftWithMissingRequiredDfs = {
      contactId: "c-100",
      customData: {},
    };

    const errors = validateStudentDraft(draftWithMissingRequiredDfs, {
      settings: testSettings,
      enabledTabs: new Set(["basic"]),
      requiredTabs: new Set(),
      fields: {},
      language: "en",
      linkedGenderRaw: "male",
      linkedDob: "2010-01-01",
      dfsTabs: mockDfsTabs,
    });

    expect(errors).not.toBeNull();
    const bloodGroupError = errors?.find((e) => e.fieldId === "bloodGroup");
    expect(bloodGroupError).toBeDefined();
    expect(bloodGroupError?.tabId).toBe("basic");
  });

  it("passes validation cleanly when all required system and DFS fields are valid", () => {
    const testSettings = {
      formTabs: [{ key: "basic", enabled: true }],
      fields: {},
      requiredTabs: [],
    } as any;

    const validDraft: Partial<Student> = {
      contactId: "c-100",
      grNumber: "GR-001",
      status: "active",
      customData: {
        bloodGroup: "O+",
        previousSchool: "Al-Huda Academy",
      },
    };

    const errors = validateStudentDraft(validDraft, {
      settings: testSettings,
      enabledTabs: new Set(["basic"]),
      requiredTabs: new Set(),
      fields: {},
      language: "en",
      linkedGenderRaw: "male",
      linkedDob: "2010-01-01",
      dfsTabs: mockDfsTabs,
    });

    expect(errors).toBeNull();
  });
});
