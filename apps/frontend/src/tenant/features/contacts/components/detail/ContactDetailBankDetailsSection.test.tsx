import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Contact } from "@mms/shared";
import { ContactDetailBankDetailsSection } from "./ContactDetailBankDetailsSection";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockContactWithBank: Contact = {
  id: "cnt-1",
  name: "Ali Raza",
  firstName: "Ali",
  lastName: "Raza",
  bankDetails: [
    {
      id: "bnk-1",
      bankName: "Meezan Bank",
      accountTitle: "Ali Raza",
      accountNumber: "020202020202",
      iban: "PK36MEZN00020202020202",
      swiftCode: "MEZNPKKA",
      branchName: "F-10 Markaz",
      currency: "PKR",
      isPrimary: true,
      label: "Salary",
    },
  ],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const mockContactEmpty: Contact = {
  id: "cnt-2",
  name: "Zainab Bibi",
  firstName: "Zainab",
  bankDetails: [],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("ContactDetailBankDetailsSection Component", () => {
  it("renders bank details with primary badge, account number, and IBAN", () => {
    const html = renderToStaticMarkup(
      <ContactDetailBankDetailsSection contact={mockContactWithBank} />,
    );

    expect(html).toContain("Meezan Bank");
    expect(html).toContain("Ali Raza");
    expect(html).toContain("020202020202");
    expect(html).toContain("PK36MEZN00020202020202");
    expect(html).toContain("MEZNPKKA");
    expect(html).toContain("F-10 Markaz");
    expect(html).toContain("Salary");
    expect(html).toContain("contacts.form.primary");
  });

  it("renders empty state message when no bank accounts exist", () => {
    const html = renderToStaticMarkup(
      <ContactDetailBankDetailsSection contact={mockContactEmpty} />,
    );

    expect(html).toContain("contacts.detail.emptyBankDetails");
  });
});
