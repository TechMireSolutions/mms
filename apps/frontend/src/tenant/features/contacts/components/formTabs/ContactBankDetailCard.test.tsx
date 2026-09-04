import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ContactBankDetailCard } from "./ContactBankDetailCard";
import type { ContactBankDetail } from "@mms/shared";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
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

vi.mock("@/components/ui/FormSelect", () => ({
  FormSelect: ({ value }: { value?: string }) => (
    <div data-testid="form-select">{value}</div>
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

vi.mock("./ContactSubListCards", () => ({
  ListFieldCard: ({
    children,
    typeSelect,
    headerExtras,
    label,
    removeLabel,
  }: {
    children: React.ReactNode;
    typeSelect?: React.ReactNode;
    headerExtras?: React.ReactNode;
    label?: React.ReactNode;
    removeLabel?: string;
  }) => (
    <div data-testid="list-field-card">
      <div data-testid="card-label">{label}</div>
      <div data-testid="card-type-select">{typeSelect}</div>
      <div data-testid="card-extra-action">{headerExtras}</div>
      <div data-testid="card-body">{children}</div>
      {removeLabel && <div data-testid="card-remove-label">{removeLabel}</div>}
    </div>
  ),
}));

vi.mock("@/lib/semanticTone", () => ({
  SUB_LIST_CARD_ACCENTS: {
    bankDetails: { accent: "accent-bank", icon: "icon-bank" },
  },
}));

const baseDetail: ContactBankDetail = {
  id: "bnk-test-1",
  bankName: "Meezan Bank",
  accountTitle: "Muhammad Ali",
  accountNumber: "010203040506",
  iban: "PK36MEZN00010203040506",
  swiftCode: "MEZNPKKA",
  branchName: "Gulshan Branch",
  branchCode: "0102",
  routingNumber: "123456789",
  currency: "PKR",
  isPrimary: true,
  label: "Salary",
};

const baseProps = {
  idx: 0,
  formInstanceId: "test-form",
  labelOptions: ["Primary", "Salary"],
  currencyOptions: ["PKR", "USD"],
  showBankName: true,
  showAccountTitle: true,
  showAccountNumber: true,
  showIban: true,
  showSwiftCode: true,
  showBranchName: true,
  showBranchCode: true,
  showRoutingNumber: true,
  showCurrency: true,
  showIsPrimary: true,
  isFieldRequired: () => false,
  getListItemError: () => undefined,
  getLocalId: (_g: string, idx: number) => `local-bank-${idx}`,
  onSetPrimary: vi.fn(),
  updateBankDetail: vi.fn(),
  removeBankDetail: vi.fn(),
};

describe("ContactBankDetailCard", () => {
  it("renders all visible fields with correct values", () => {
    const html = renderToStaticMarkup(
      <ContactBankDetailCard {...baseProps} bankDetail={baseDetail} />,
    );

    expect(html).toContain("Meezan Bank");
    expect(html).toContain("Muhammad Ali");
    expect(html).toContain("010203040506");
    expect(html).toContain("PK36MEZN00010203040506");
    expect(html).toContain("MEZNPKKA");
    expect(html).toContain("Gulshan Branch");
    expect(html).toContain("0102");
    expect(html).toContain("123456789");
    expect(html).toContain("PKR");
  });

  it("renders primary badge when isPrimary is true", () => {
    const html = renderToStaticMarkup(
      <ContactBankDetailCard
        {...baseProps}
        bankDetail={{ ...baseDetail, isPrimary: true }}
      />,
    );

    expect(html).toContain("contacts.form.primary");
  });

  it("renders set-primary button text when isPrimary is false", () => {
    const html = renderToStaticMarkup(
      <ContactBankDetailCard
        {...baseProps}
        bankDetail={{ ...baseDetail, isPrimary: false }}
      />,
    );

    expect(html).toContain("contacts.form.setPrimary");
  });

  it("hides primary badge when showIsPrimary is false", () => {
    const html = renderToStaticMarkup(
      <ContactBankDetailCard
        {...baseProps}
        showIsPrimary={false}
        bankDetail={{ ...baseDetail, isPrimary: true }}
      />,
    );

    expect(html).not.toContain("contacts.form.primary");
  });

  it("propagates field errors for accountNumber", () => {
    const html = renderToStaticMarkup(
      <ContactBankDetailCard
        {...baseProps}
        getListItemError={(_group, field) =>
          field === "accountNumber" ? "Invalid account number" : undefined
        }
        bankDetail={{ ...baseDetail, accountNumber: "" }}
      />,
    );

    expect(html).toContain("Invalid account number");
    expect(html).toContain("field-error");
  });

  it("propagates field errors for iban", () => {
    const html = renderToStaticMarkup(
      <ContactBankDetailCard
        {...baseProps}
        getListItemError={(_group, field) =>
          field === "iban" ? "Invalid IBAN format" : undefined
        }
        bankDetail={{ ...baseDetail, iban: "INVALID" }}
      />,
    );

    expect(html).toContain("Invalid IBAN format");
    expect(html).toContain("field-error");
  });

  it("hides IBAN field when showIban is false", () => {
    const html = renderToStaticMarkup(
      <ContactBankDetailCard
        {...baseProps}
        showIban={false}
        bankDetail={baseDetail}
      />,
    );

    expect(html).not.toContain("PK36MEZN00010203040506");
  });

  it("hides SWIFT field when showSwiftCode is false", () => {
    const html = renderToStaticMarkup(
      <ContactBankDetailCard
        {...baseProps}
        showSwiftCode={false}
        bankDetail={baseDetail}
      />,
    );

    expect(html).not.toContain("MEZNPKKA");
  });

  it("renders removal label in the card", () => {
    const html = renderToStaticMarkup(
      <ContactBankDetailCard {...baseProps} bankDetail={baseDetail} idx={2} />,
    );

    expect(html).toContain("contacts.form.removeBankDetail");
  });

  it("uses fallback label when bankDetail.label is undefined", () => {
    const html = renderToStaticMarkup(
      <ContactBankDetailCard
        {...baseProps}
        bankDetail={{ ...baseDetail, label: undefined }}
      />,
    );

    // Should fall back to first labelOption "Primary"
    expect(html).toContain("Primary");
  });
});
