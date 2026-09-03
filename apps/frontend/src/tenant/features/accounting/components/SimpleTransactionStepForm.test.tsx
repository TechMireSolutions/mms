import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StepTransactionForm } from "./SimpleTransactionStepForm";
import type { WizardFormState } from "./simpleTransactionWizardTypes";
import type { Account } from "@/lib/data/accountingData";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/components/ui/DatePicker", () => ({
  DatePicker: ({
    id,
    value,
    onChange,
  }: {
    id?: string;
    value: string;
    onChange: (val: string) => void;
  }) => (
    <input
      data-testid={id || "datepicker"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock("@/components/ui/FormSelect", () => ({
  FormSelect: ({
    id,
    value,
    onChange,
  }: {
    id: string;
    value: string;
    onChange: (val: string) => void;
  }) => (
    <input
      data-testid={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

import { QUICK_ACTIONS } from "./journalEntriesQuickActions";

const mockActionType = QUICK_ACTIONS[0]!.type;

const mockAccounts: Account[] = [
  { id: "a1000", code: "1000", name: "Cash on Hand", type: "Asset", subtype: "Current Asset", description: "", isActive: true },
  { id: "a4000", code: "4000", name: "Fee Income", type: "Revenue", subtype: "Operating Revenue", description: "", isActive: true },
];

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("StepTransactionForm", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders wizard amount input with inputMode=decimal and displays currency symbol", async () => {
    const formState: WizardFormState = {
      date: "2026-09-01",
      amount: "250.00",
      description: "Tuition fee payment",
      debitAcc: "a1000",
      creditAcc: "a4000",
      ref: "REF-001",
      receipt: "",
      fiscal_year: "2026",
    };

    await act(async () => {
      root.render(
        <StepTransactionForm
          type={mockActionType}
          form={formState}
          setForm={vi.fn()}
          accounts={mockAccounts}
          currencySymbol="$"
        />,
      );
    });

    const amountInput = container.querySelector("#wizard-amount") as HTMLInputElement;
    expect(amountInput).not.toBeNull();
    expect(amountInput.getAttribute("inputmode")).toBe("decimal");
    expect(amountInput.value).toBe("250.00");
    expect(container.textContent).toContain("$");
  });

  it("triggers setForm callback when amount is updated", async () => {
    const setForm = vi.fn();
    const formState: WizardFormState = {
      date: "2026-09-01",
      amount: "",
      description: "",
      debitAcc: "a1000",
      creditAcc: "a4000",
      ref: "",
      receipt: "",
      fiscal_year: "2026",
    };

    await act(async () => {
      root.render(
        <StepTransactionForm
          type={mockActionType}
          form={formState}
          setForm={setForm}
          accounts={mockAccounts}
          currencySymbol="$"
        />,
      );
    });

    const amountInput = container.querySelector("#wizard-amount") as HTMLInputElement;
    expect(container.textContent).toContain("accounting.journal.dashboard.wizard.errorAmount");

    await act(async () => {
      setInputValue(amountInput, "300.50");
    });

    expect(setForm).toHaveBeenCalled();
  });
});
