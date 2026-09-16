import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { journalEntryRecordSchema, type JournalEntry } from "@mms/shared";
import { SimpleTransactionWizard } from "./SimpleTransactionWizard";
import { StepReview } from "./SimpleTransactionStepReview";
import { TRANSACTION_GROUPS } from "./simpleTransactionWizardTypes";
import type { Account } from "@/lib/data/accountingData";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("framer-motion", () => ({
  motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div> },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/hooks/useCurrency", () => ({
  useAccountingCurrency: () => ({
    activeCurrency: { symbol: "$", code: "USD" },
    formatCurrency: (amount: number | string | null | undefined) => `$${amount ?? "—"}`,
  }),
}));

vi.mock("@/components/ui/DatePicker", () => ({
  DatePicker: ({ id, value, onChange }: any) => (
    <input data-testid={id || "datepicker"} value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));

/** The real modal keeps the wizard mounted between openings; only its portal unmounts. */
vi.mock("@/components/ui/FormModal", () => ({
  FormModal: ({ open, children }: any) => (open ? <div data-testid="wizard-modal">{children}</div> : null),
}));

import { notify } from "@/lib/notify";

vi.mock("@/lib/notify", () => ({
  notify: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

const group = (groupKey: string) => TRANSACTION_GROUPS.find((transactionGroup) => transactionGroup.groupKey === groupKey)!;
const feeCollection = group("accounting.journal.dashboard.group.moneyIn").items.find((item) => item.id === "fee_collection")!;
const adjustment = group("accounting.journal.dashboard.group.transfers").items.find((item) => item.id === "adjustment")!;

const seedAccounts: Account[] = [
  { id: "a1000", code: "1000", name: "Cash in Hand", type: "Asset", subtype: "Current Asset", description: "", isActive: true },
  { id: "a1010", code: "1010", name: "Bank Account – HBL", type: "Asset", subtype: "Current Asset", description: "", isActive: true },
  { id: "a4000", code: "4000", name: "Student Fee Income", type: "Revenue", subtype: "Operating Revenue", description: "", isActive: true },
];

const fiscalYears = [{ id: "fy-2026", label: "2026", startDate: "2026-01-01", endDate: "2026-12-31", status: "active" as const }];

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function selectOption(select: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
  setter?.call(select, value);
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function findButton(container: HTMLElement, textFragment: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find((candidate) => candidate.textContent?.includes(textFragment));
  if (!button) throw new Error(`No button containing "${textFragment}"`);
  return button as HTMLButtonElement;
}

describe("SimpleTransactionWizard", () => {
  let container: HTMLDivElement;
  let root: Root;
  let onSave: Mock<(entry: JournalEntry) => void | Promise<void>>;
  let onClose: Mock<() => void>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    onSave = vi.fn();
    onClose = vi.fn();
    (notify.error as Mock).mockClear();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  const renderWizard = async (open: boolean, prefillType: typeof feeCollection | typeof adjustment | null, accounts: Account[] = seedAccounts) => {
    await act(async () => {
      root.render(
        <SimpleTransactionWizard
          open={open}
          accounts={accounts}
          entries={[]}
          fiscalYears={fiscalYears}
          prefillType={prefillType}
          onSave={onSave}
          onClose={onClose}
        />,
      );
    });
  };

  const amountInput = () => container.querySelector("#wizard-amount") as HTMLInputElement;

  it("posts the parsed comma-decimal amount instead of the parseFloat truncation", async () => {
    await renderWizard(true, feeCollection);
    expect(amountInput()).not.toBeNull();

    await act(async () => {
      setInputValue(amountInput(), "12,50");
    });
    await act(async () => {
      findButton(container, "accounting.journal.dashboard.wizard.next").click();
    });
    expect(container.textContent).toContain("$12.5");
    expect(container.textContent).not.toContain("$12 ");

    await act(async () => {
      findButton(container, "accounting.journal.dashboard.wizard.postTransaction").click();
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    const posted = onSave.mock.calls[0]![0];
    expect(posted.lines.map((line) => [line.account_id, line.debit, line.credit])).toEqual([
      ["a1000", 12.5, 0],
      ["a4000", 0, 12.5],
    ]);
    expect(posted.status).toBe("posted");
    // Nothing the shared contract would reject may reach the append-only ledger.
    expect(journalEntryRecordSchema.safeParse(posted).success).toBe(true);
    expect(notify.error).not.toHaveBeenCalled();
  });

  it("blocked an unparseable amount instead of posting a truncated one", async () => {
    await renderWizard(true, feeCollection);
    await act(async () => {
      setInputValue(amountInput(), "12.345");
    });
    const nextButton = findButton(container, "accounting.journal.dashboard.wizard.next");
    expect(nextButton.disabled).toBe(true);
    expect(container.textContent).toContain("accounting.journal.dashboard.wizard.errorAmountInvalid");
  });

  it("starts every opening from a clean form so the previous transaction cannot be reposted", async () => {
    await renderWizard(true, feeCollection);
    await act(async () => {
      setInputValue(amountInput(), "99.99");
    });
    await act(async () => {
      findButton(container, "accounting.journal.dashboard.wizard.next").click();
    });
    await act(async () => {
      findButton(container, "accounting.journal.dashboard.wizard.postTransaction").click();
    });
    expect(onSave).toHaveBeenCalledTimes(1);

    // The dialog closes (its parent sets simpleModal to null) and reopens with
    // another quick action.
    await renderWizard(false, feeCollection);
    await renderWizard(true, feeCollection);

    expect(amountInput().value).toBe("");
    expect((container.querySelector("#wizard-description") as HTMLInputElement).value).toBe("accounting.journal.dashboard.desc.feeCollection");
    expect(container.textContent).not.toContain("accounting.journal.dashboard.wizard.postTransaction");
    expect((container.querySelector("#wizard-acc-in") as HTMLSelectElement).value).toBe("a1000");
  });

  it("refuses to post the same account on both legs", async () => {
    await renderWizard(true, adjustment);
    // The Adjustment action presets a source account and leaves the
    // counter-account for the user.
    expect((container.querySelector("#wizard-acc-to") as HTMLSelectElement).value).toBe("a1000");
    expect((container.querySelector("#wizard-acc-from") as HTMLSelectElement).value).toBe("");

    await act(async () => {
      setInputValue(amountInput(), "50");
    });
    await act(async () => {
      selectOption(container.querySelector("#wizard-acc-from") as HTMLSelectElement, "a1000");
    });
    await act(async () => {
      findButton(container, "accounting.journal.dashboard.wizard.next").click();
    });
    await act(async () => {
      findButton(container, "accounting.journal.dashboard.wizard.postTransaction").click();
    });

    expect(onSave).not.toHaveBeenCalled();
    expect(notify.error).toHaveBeenCalledWith("accounting.journal.dashboard.wizard.errorSameAccount");
  });

  it("posts an adjustment once a real counter-account is chosen", async () => {
    await renderWizard(true, adjustment);
    await act(async () => {
      setInputValue(amountInput(), "50.25");
    });
    await act(async () => {
      selectOption(container.querySelector("#wizard-acc-from") as HTMLSelectElement, "a1010");
    });
    await act(async () => {
      findButton(container, "accounting.journal.dashboard.wizard.next").click();
    });
    await act(async () => {
      findButton(container, "accounting.journal.dashboard.wizard.postTransaction").click();
    });

    expect(notify.error).not.toHaveBeenCalled();
    expect(onSave).toHaveBeenCalledTimes(1);
    const posted = onSave.mock.calls[0]![0];
    expect(posted.lines.map((line) => [line.account_id, line.debit, line.credit])).toEqual([
      ["a1000", 50.25, 0],
      ["a1010", 0, 50.25],
    ]);
    expect(journalEntryRecordSchema.safeParse(posted).success).toBe(true);
  });

  it("does not offer seed cash ids that the live chart does not have", async () => {
    const generatedAccounts: Account[] = [
      { id: "a11111111-1111-4111-8111-111111111111", code: "1000", name: "Main Cash Box", type: "Asset", subtype: "Current Asset", description: "", isActive: true },
      { id: "a22222222-2222-4222-8222-222222222222", code: "4000", name: "Tuition Income", type: "Revenue", subtype: "Operating Revenue", description: "", isActive: true },
    ];
    await renderWizard(true, feeCollection, generatedAccounts);

    const cashSelect = container.querySelector("#wizard-acc-in") as HTMLSelectElement;
    expect(cashSelect.value).toBe("a11111111-1111-4111-8111-111111111111");
    const optionValues = Array.from(cashSelect.options).map((option) => option.value);
    expect(optionValues).not.toContain("a1000");

    await act(async () => {
      setInputValue(amountInput(), "300");
    });
    await act(async () => {
      findButton(container, "accounting.journal.dashboard.wizard.next").click();
    });
    await act(async () => {
      findButton(container, "accounting.journal.dashboard.wizard.postTransaction").click();
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    const posted = onSave.mock.calls[0]![0];
    expect(posted.lines.map((line) => line.account_id)).toEqual([
      "a11111111-1111-4111-8111-111111111111",
      "a22222222-2222-4222-8222-222222222222",
    ]);
  });

  it("renders an invalid amount as an explicit invalid state on the review step", async () => {
    const formatCurrency = vi.fn((amount: number | string | null | undefined) => `$${amount}`);
    await act(async () => {
      root.render(
        <StepReview
          type={feeCollection}
          form={{ date: "2026-01-15", amount: "1,234", debitAcc: "a1000", creditAcc: "a4000", description: "Fee", ref: "", receipt: "", fiscal_year: "2026" }}
          accounts={seedAccounts}
          showAdvanced
          setShowAdvanced={vi.fn()}
          formatCurrency={formatCurrency}
        />,
      );
    });

    // "1,234" is the ambiguous single-separator form: it must read as an invalid
    // amount, never as a posted zero.
    expect(container.textContent).toContain("accounting.journal.dashboard.wizard.errorAmountInvalid");
    expect(container.textContent).not.toContain("accounting.journal.dashboard.wizard.postMessage");
    expect(formatCurrency).not.toHaveBeenCalled();
  });
});
