import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactBankDetailsTab } from "./ContactBankDetailsTab";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params?.index !== undefined) {
        return `${key}:${params.index}`;
      }
      return key;
    },
  }),
}));

vi.mock("./ContactSubListCards", () => ({
  ContactSubListShell: ({
    children,
    isEmpty,
    emptyMessage,
  }: {
    children: React.ReactNode;
    isEmpty?: boolean;
    emptyMessage?: React.ReactNode;
  }) => (
    <div data-testid="sublist-shell">
      {isEmpty ? <div data-testid="empty-message">{emptyMessage}</div> : children}
    </div>
  ),
  ListFieldCard: ({
    label,
    children,
  }: {
    label?: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="list-field-card">
      {label && <div data-testid="card-label">{label}</div>}
      <div data-testid="card-body">{children}</div>
    </div>
  ),
  resolveSubListAllowAdd: () => true,
}));

vi.mock("@/components/ui/FormPrimitives", () => ({
  Field: ({
    label,
    error,
    children,
  }: {
    label: string;
    error?: string;
    children: React.ReactNode;
  }) => (
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
  LeadingIconInput: ({
    value,
    placeholder,
    className,
  }: {
    value?: string;
    placeholder?: string;
    className?: string;
  }) => (
    <input
      data-testid="leading-icon-input"
      value={value || ""}
      placeholder={placeholder}
      className={className}
      readOnly
    />
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

  it("renders bank account cards with bankName, accountType, and accountNumber", () => {
    const html = renderToStaticMarkup(
      <ContactBankDetailsTab
        {...baseProps}
        contactDraft={{
          bankDetails: [
            {
              id: "bnk-1",
              bankName: "Meezan Bank",
              accountType: "Salary",
              accountNumber: "010203040506",
            },
          ],
        }}
      />,
    );

    expect(html).toContain("Meezan Bank");
    expect(html).toContain("Salary");
    expect(html).toContain("010203040506");
    expect(html).toContain("contacts.fields.bankName");
    expect(html).toContain("contacts.fields.bankAccountType");
    expect(html).toContain("contacts.fields.bankAccountNumber");
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
              accountType: "Current",
              accountNumber: "",
            },
          ],
        }}
      />,
    );

    expect(html).toContain("Invalid account number");
    expect(html).toContain("field-error");
  });

  it("renders multiple bank cards with sequence counters and without primary logic", () => {
    const html = renderToStaticMarkup(
      <ContactBankDetailsTab
        {...baseProps}
        contactDraft={{
          bankDetails: [
            {
              id: "bnk-1",
              bankName: "Meezan Bank",
              accountType: "Current",
              accountNumber: "010203040506",
            },
            {
              id: "bnk-2",
              bankName: "HBL",
              accountType: "Savings",
              accountNumber: "987654321000",
            },
          ],
        }}
      />,
    );

    expect(html).toContain("Meezan Bank");
    expect(html).toContain("HBL");
    expect(html).toContain("contacts.form.bankAccountSequence:1");
    expect(html).toContain("contacts.form.bankAccountSequence:2");
    expect(html).not.toContain("contacts.form.primary");
    expect(html).not.toContain("contacts.form.setPrimary");
  });
});
