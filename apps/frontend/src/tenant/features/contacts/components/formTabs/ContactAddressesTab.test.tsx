import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactAddressesTab } from "./ContactAddressesTab";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("./ContactSubListCards", () => ({
  ContactSubListShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sublist-shell">{children}</div>
  ),
  ListFieldCard: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="list-field-card">{children}</div>
  ),
  resolveSubListAllowAdd: () => true,
}));

vi.mock("@/components/ui/FormPrimitives", () => ({
  Field: ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div data-testid="field">
      <label>{label}</label>
      {children}
    </div>
  ),
  EditableSelect: ({ value }: { value?: string }) => (
    <div data-testid="editable-select">{value}</div>
  ),
}));

describe("ContactAddressesTab Component", () => {
  it("renders address entry fields", () => {
    const html = renderToStaticMarkup(
      <ContactAddressesTab
        contactDraft={{
          addresses: [
            { line1: "123 Main St", city: "Karachi", state: "Sindh", country: "Pakistan", label: "home" },
          ],
        }}
        getLocalId={() => "loc-1"}
        addressLabels={["home", "work"]}
        onUpdateAddressLabels={vi.fn()}
        countryOptions={["Pakistan", "United States"]}
        onUpdateCountryOptions={vi.fn()}
        defaultCity="Karachi"
        defaultProvince="Sindh"
        defaultCountry="Pakistan"
        getListItemError={() => undefined}
        isFieldEnabled={() => true}
        isFieldRequired={() => false}
        fields={{}}
        formInstanceId="inst-1"
        addSubListItem={vi.fn()}
        ensureSubListItem={vi.fn()}
        updateSubListItem={vi.fn()}
        removeSubListItem={vi.fn()}
      />,
    );

    expect(html).toContain("123 Main St");
    expect(html).toContain("Karachi");
    expect(html).toContain("Sindh");
  });
});
