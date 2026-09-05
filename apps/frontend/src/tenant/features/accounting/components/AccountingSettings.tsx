import React, { useEffect } from "react";
import type { Account, FiscalYear } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { AccountingFiscalYearModal } from "./AccountingFiscalYearModal";
import { AccountingSettingsPreferences } from "./AccountingSettingsPreferences";
import { useAccountingSetupPanelState } from "@/tenant/features/accounting/hooks/useAccountingSetupPanelState";
import { useCloseFiscalYear } from "@/tenant/features/accounting/hooks/useAccountingLedgerOps";
import { notify } from "@/lib/notify";

export interface AccountingSettingsProps {
  accounts: Account[];
  fiscalYears: FiscalYear[];
  onSaveFiscalYears: (
    fiscalYears: FiscalYear[] | ((prev: FiscalYear[]) => FiscalYear[]),
  ) => void | Promise<void>;
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const AccountingSettings = (function AccountingSettings({
  accounts,
  fiscalYears,
  onSaveFiscalYears,
  onPrefsDirtyChange,
}: AccountingSettingsProps) {
  const { t } = useTranslation();

  const {
    settingsDraft,
    upd,
    saved,
    saving,
    isPrefsDirty,
    handleSave,
    decimalSeparators,
    fyStatusConfig,
    currencies,
    activeCurrency,
    fyModal,
    setFyModal,
    deleteFyTarget,
    setDeleteFyTarget,
    handleSaveFY,
    handleRequestDeleteFY,
    handleConfirmDeleteFY,
  } = useAccountingSetupPanelState({
    fiscalYears,
    onSaveFiscalYears,
  });
  const closeFiscalYear = useCloseFiscalYear();

  const handleCloseFiscalYear = async (fiscalYearId: string): Promise<void> => {
    try {
      const result = await closeFiscalYear.mutateAsync(fiscalYearId);
      await onSaveFiscalYears((prev) =>
        prev.map((year) => (year.id === result.fiscalYear.id ? result.fiscalYear : year)),
      );
      notify.success(t("accounting.settings.fy.closed"));
    } catch (error) {
      notify.error(t("accounting.settings.fy.closeFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  useEffect(() => {
    onPrefsDirtyChange?.(isPrefsDirty);
  }, [isPrefsDirty, onPrefsDirtyChange]);

  const unsavedWarning = isPrefsDirty
    ? t("accounting.setup.unsavedPreferencesWarning")
    : undefined;

  return (
    <div className="space-y-6 max-w-3xl text-start">
      <AccountingSettingsPreferences
        accounts={accounts}
        fiscalYears={fiscalYears}
        settingsDraft={settingsDraft}
        upd={upd}
        currencies={currencies}
        activeCurrency={activeCurrency}
        decimalSeparators={decimalSeparators}
        fyStatusConfig={fyStatusConfig}
        canEditSetup={true}
        onEditFiscalYear={setFyModal}
        onDeleteFiscalYear={handleRequestDeleteFY}
        onCloseFiscalYear={handleCloseFiscalYear}
      />

      <ModuleSetupSaveFooter
        dirty={isPrefsDirty}
        saving={saving}
        saved={saved}
        unsavedWarning={unsavedWarning}
        saveLabel={t("common.save")}
        savedLabel={t("settings.savedBadge")}
        onSave={handleSave}
      />

      <AccountingFiscalYearModal
        open={Boolean(fyModal)}
        initial={fyModal}
        onSave={handleSaveFY}
        onClose={() => setFyModal(null)}
      />

      <ConfirmAlertDialog
        open={Boolean(deleteFyTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteFyTarget(null);
        }}
        title={t("accounting.settings.fy.deleteConfirm")}
        description={
          deleteFyTarget?.label
            ? `${t("accounting.settings.fy.deleteConfirm")} (${deleteFyTarget.label})`
            : t("accounting.settings.fy.deleteConfirm")
        }
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={handleConfirmDeleteFY}
      />
    </div>
  );
});

export default AccountingSettings;
