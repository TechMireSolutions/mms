import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactBankDetailsTab } from "./ContactBankDetailsTab";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("./ContactSubListCards", () => ({
  ContactSubListShell: ({ children, isEmpty, emptyMessage }: { children: React.ReactNode; isEmpty?: boolean; emptyMessage?: React.ReactNode }) => (
    <div data-testid="sublist-shell">{isEmpty ? <div data-testid="empty-message">{emptyMessage}</div> : children}</div>
  ),
  ListFieldCard: ({ children, typeSelect, headerExtras }: {
    children: React.ReactNode;
    typeSelect?: React.ReactNode;
    headerExtras?: React.ReactNode;
  }) => (
    <div data-testid="list-field-card">
      <div data-testid="card-type-select">{typeSelect}</div>
      <div data-testid="card-extra-action">{headerExtras}</div>
      <div data-testid="card-body">{children}</div>
    </div>
  ),
  resolveSubListAllowAdd: () => true,
}));

vi.mock("@/components/ui/FormPrimitives", () => ({
  Field: ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div data-testid="field">
      <label>{label}</label>
      {error && <span data-testid="field-error">{error}</span>}
      {children}
    </div>
  ),
  EditableSelect: ({ value }: { value?: string }) => (
    <div data-testid="editable-select">{value}</div>
  ),
}));

vi.mock("@/components/ui/LeadingIconInput", () => ({
  LeadingIconInput: ({ value, placeholder, className }: { value?: string; placeholder?: string; className?: string }) => (
    <input data-testid="leading-icon-input" value={value || ""} placeholder={placeholder} className={className} readOnly />
  ),
}));

describe("ContactBankDetailsTab Component", () => {
  const baseProps = {
    formInstanceId: "test-form",
    getLocalId: (_g: string, idx: number) => `local-bank-${idx}`,
    getListItemError: () => undefined,
    isFieldEnabled: () => true,
    isFieldRequired: () => false,
    fields: {},
    addSubListItem: vi.fn(),
    ensureSubListItem: vi.fn(),
    updateSubListItem: vi.fn(),
    removeSubListItem: vi.fn(),
  };

  it("renders empty state when no bank accounts exist", () => {
    const html = renderToStaticMarkup(
      <ContactBankDetailsTab
        {...baseProps}
        contactDraft={{ bankDetails: [] }}
      />,
    );

    expect(html).toContain("contacts.form.noBankDetailsYet");
    expect(html).toContain("empty-message");
  });

  it("renders bank account cards with complete details", () => {
    const html = renderToStaticMarkup(
      <ContactBankDetailsTab
        {...baseProps}
        contactDraft={{
          bankDetails: [
            {
              id: "bnk-1",
              bankName: "Meezan Bank",
              accountTitle: "Muhammad Ali",
              accountNumber: "010203040506",
              iban: "PK36MEZN00010203040506",
              swiftCode: "MEZNPKKA",
              branchName: "Gulshan Branch",
              branchCode: "0102",
              currency: "PKR",
              isPrimary: true,
              label: "Salary",
            },
          ],
        }}
      />,
    );

    expect(html).toContain("Meezan Bank");
    expect(html).toContain("Muhammad Ali");
    expect(html).toContain("010203040506");
    expect(html).toContain("PK36MEZN00010203040506");
    expect(html).toContain("MEZNPKKA");
    expect(html).toContain("Gulshan Branch");
    expect(html).toContain("Salary");
    expect(html).toContain("contacts.form.primary");
  });

  it("propagates field errors when present", () => {
    const html = renderToStaticMarkup(
      <ContactBankDetailsTab
        {...baseProps}
        getListItemError={(_group, field, _idx) =>
          field === "accountNumber" ? "Invalid account number" : undefined
        }
        contactDraft={{
          bankDetails: [
            {
              id: "bnk-1",
              bankName: "HBL",
              accountTitle: "Ali Khan",
              accountNumber: "",
            },
          ],
        }}
      />,
    );

    expect(html).toContain("Invalid account number");
    expect(html).toContain("field-error");
  });
});
