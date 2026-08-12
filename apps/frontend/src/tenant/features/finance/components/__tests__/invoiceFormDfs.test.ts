import { describe, expect, it } from "vitest";
import { createInitialDraft } from "../invoiceFormDraft";
import { validateDfsCustomFields, type TabConfig } from "@mms/shared";

describe("Invoice Form DFS Integration", () => {
  const mockDfsTabs: TabConfig[] = [
    {
      id: "basic",
      key: "basic",
      label: "Basic Info",
      enabled: true,
      required: false,
      sortOrder: 1,
      isSystem: true,
      fields: [
        {
          id: "cf_notes",
          tabId: "basic",
          key: "notes",
          label: "Invoice Notes",
          type: "text",
          required: true,
          enabled: true,
          unique: false,
          sortOrder: 1,
          hasData: false,
          isSystem: false,
          defaultValue: "Default payment note",
        },
      ],
    },
    {
      id: "custom_extra",
      key: "extra",
      label: "Extra Details",
      enabled: true,
      required: false,
      sortOrder: 2,
      isSystem: false,
      fields: [
        {
          id: "cf_tax_id",
          tabId: "custom_extra",
          key: "tax_id",
          label: "Tax Identifier",
          type: "text",
          required: false,
          enabled: true,
          unique: false,
          sortOrder: 1,
          hasData: false,
          isSystem: false,
          defaultValue: "TAX-12345",
        },
      ],
    },
  ];

  it("seeds DFS custom field defaults when creating an initial invoice draft", () => {
    const draft = createInitialDraft("7", mockDfsTabs);

    expect(draft.studentName).toBe("");
    expect(draft.customData).toEqual({
      notes: "Default payment note",
      tax_id: "TAX-12345",
    });
  });

  it("validates required DFS custom fields against draft customData", () => {
    const draft = createInitialDraft("7", mockDfsTabs);
    // Clear required field
    draft.customData = { notes: "", tax_id: "TAX-12345" };

    const errors = validateDfsCustomFields(mockDfsTabs, draft.customData, draft as unknown as Record<string, unknown>);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]?.fieldId).toBe("notes");
  });

  it("passes validation when all required DFS custom fields are filled", () => {
    const draft = createInitialDraft("7", mockDfsTabs);
    draft.customData = { notes: "Valid note content", tax_id: "TAX-999" };

    const errors = validateDfsCustomFields(mockDfsTabs, draft.customData, draft as unknown as Record<string, unknown>);

    expect(errors.length).toBe(0);
  });
});
