import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ContactCustomTab } from "./ContactCustomTab";
import type { FieldDefinition } from "@mms/shared";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    language: "en",
    t: (key: string, params?: Record<string, string | number>) => {
      const labels: Record<string, string> = {
        "contacts.form.noCustomTabEntriesYet": "No entries yet.",
        "contacts.form.addCustomTabEntry": "Add Entry",
        "contacts.form.customTabEntryLabel": `Entry ${params?.index ?? ""}`.trim(),
        "contacts.form.customTabEmpty": "No fields configured for this tab.",
        "common.remove": "Remove",
      };
      return labels[key] ?? key;
    },
    isLoading: false,
    dir: "ltr" as const,
    isRtl: false,
  }),
}));

vi.mock("@/hooks/useCurrency", () => ({
  useFinanceCurrency: () => ({
    activeCurrency: "PKR",
    formatAmount: (val: number | string) => `Rs ${val}`,
  }),
}));

describe("ContactCustomTab", () => {
  const fields: Record<string, FieldDefinition[]> = {
    custom_cars: [
      {
        key: "make",
        label: "Make",
        type: "text",
        enabled: true,
        order: 0,
        required: true,
      },
      {
        key: "model",
        label: "Model",
        type: "text",
        enabled: true,
        order: 1,
      },
    ],
    custom: [
      {
        key: "emergencyContactName",
        label: "Emergency Name",
        type: "text",
        enabled: true,
        order: 0,
      },
    ],
  };

  it("renders custom collection rows with cards and inputs", () => {
    const markup = renderToStaticMarkup(
      <ContactCustomTab
        tabKey="custom_cars"
        tabLabel="Vehicles"
        contactDraft={{
          custom_cars: [{ make: "Toyota", model: "Corolla" }],
        }}
        fields={fields}
        formInstanceId="1"
        isFieldEnabled={() => true}
        isFieldRequired={(tabId, fieldId) => fieldId === "make"}
        getFieldError={() => undefined}
        getListItemError={() => undefined}
        updateDraft={vi.fn()}
        addSubListItem={vi.fn()}
        ensureSubListItem={vi.fn()}
        updateSubListItem={vi.fn()}
        removeSubListItem={vi.fn()}
        getLocalId={(tab, idx) => `id-${tab}-${idx}`}
      />,
    );

    expect(markup).toContain("Toyota");
    expect(markup).toContain("Make");
    expect(markup).toContain("Model");
    expect(markup).toContain("Entry 1");
  });

  it("renders empty state for scalar custom tab when no fields exist", () => {
    const markup = renderToStaticMarkup(
      <ContactCustomTab
        tabKey="custom"
        tabLabel="Empty"
        contactDraft={{}}
        fields={{ custom: [] }}
        formInstanceId="1"
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        getFieldError={() => undefined}
        getListItemError={() => undefined}
        updateDraft={vi.fn()}
        addSubListItem={vi.fn()}
        ensureSubListItem={vi.fn()}
        updateSubListItem={vi.fn()}
        removeSubListItem={vi.fn()}
        getLocalId={(tab, idx) => `id-${tab}-${idx}`}
      />,
    );

    expect(markup).toContain("No fields configured for this tab.");
  });

  it("renders scalar custom fields inside SectionCard", () => {
    const markup = renderToStaticMarkup(
      <ContactCustomTab
        tabKey="custom"
        tabLabel="Custom Details"
        contactDraft={{
          emergencyContactName: "Ahmad",
        }}
        fields={fields}
        formInstanceId="1"
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        getFieldError={() => undefined}
        getListItemError={() => undefined}
        updateDraft={vi.fn()}
        addSubListItem={vi.fn()}
        ensureSubListItem={vi.fn()}
        updateSubListItem={vi.fn()}
        removeSubListItem={vi.fn()}
        getLocalId={(tab, idx) => `id-${tab}-${idx}`}
      />,
    );

    expect(markup).toContain("Emergency Name");
    expect(markup).toContain("Ahmad");
  });
});
