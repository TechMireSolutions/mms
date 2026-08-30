import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AccountingSettings } from "./AccountingSettings";

vi.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockCanEdit = true;

vi.mock("@/tenant/hooks/usePermissions", () => ({
  useModulePermissions: () => ({
    canEditSetup: mockCanEdit,
  }),
}));

vi.mock("@/tenant/features/accounting/hooks/useAccountingSetupPanelState", () => ({
  useAccountingSetupPanelState: () => ({
    settingsDraft: {
      currency: "PKR",
      currencySymbol: "₨",
      dateFormat: "DD/MM/YYYY",
      decimalSeparator: "period",
      decimalPlaces: 2,
      fyStartMonth: "July",
      accountCodeLength: 4,
      requireNarration: true,
      allowEditPosted: false,
      autoPostDrafts: false,
      retainedEarningsAccount: "a3100",
      organizationName: "Al-Madrasa Al-Islamiyya",
      defaultViewLayout: "list",
    },
    upd: vi.fn(),
    saved: true,
    saving: false,
    isPrefsDirty: false,
    isDirty: false,
    handleSave: vi.fn(),
    decimalSeparators: [],
    fyStatusConfig: {},
    currencies: [],
    activeCurrency: undefined,
    fyModal: null,
    setFyModal: vi.fn(),
    deleteFyTarget: null,
    setDeleteFyTarget: vi.fn(),
    handleSaveFY: vi.fn(),
    handleRequestDeleteFY: vi.fn(),
    handleConfirmDeleteFY: vi.fn(),
  }),
}));

vi.mock("./AccountingSettingsPreferences", () => ({
  AccountingSettingsPreferences: () => (
    <div data-testid="preferences-section">Accounting Preferences Section</div>
  ),
}));

vi.mock("@/components/ui/ModuleSetupSaveFooter", () => ({
  ModuleSetupSaveFooter: () => <div data-testid="save-footer">Save Footer</div>,
}));

vi.mock("./AccountingFiscalYearModal", () => ({
  AccountingFiscalYearModal: () => null,
}));

vi.mock("@/components/ui/ConfirmAlertDialog", () => ({
  ConfirmAlertDialog: () => null,
}));

describe("AccountingSettings Component", () => {
  it("renders preferences, fiscal year modal, and save footer", () => {
    const html = renderToStaticMarkup(
      <AccountingSettings
        accounts={[]}
        fiscalYears={[]}
        onSaveFiscalYears={vi.fn()}
      />,
    );
    expect(html).toContain("Accounting Preferences Section");
    expect(html).toContain("Save Footer");
  });
});
