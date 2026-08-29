import React, { useEffect } from "react";
import { ACCOUNTING_MODULE_MANIFEST } from "@mms/shared";
import { Account, FiscalYear } from "@/lib/data/accountingData";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { AccountingFiscalYearModal } from "./AccountingFiscalYearModal";
import { AccountingSettingsPreferences } from "./AccountingSettingsPreferences";
import { useAccountingSetupPanelState } from "@/tenant/features/accounting/hooks/useAccountingSetupPanelState";

export interface AccountingSettingsProps {
  accounts: Account[];
  fiscalYears: FiscalYear[];
  onSaveFiscalYears: (
    fiscalYears: FiscalYear[] | ((prev: FiscalYear[]) => FiscalYear[]),
  ) => void | Promise<void>;
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const AccountingSettings = React.memo(function AccountingSettings({
  accounts,
  fiscalYears,
  onSaveFiscalYears,
  onPrefsDirtyChange,
}: AccountingSettingsProps) {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(ACCOUNTING_MODULE_MANIFEST);

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

  useEffect(() => {
    onPrefsDirtyChange?.(isPrefsDirty);
  }, [isPrefsDirty, onPrefsDirtyChange]);

  const unsavedWarning = isPrefsDirty
    ? t("accounting.setup.unsavedPreferencesWarning")
    : undefined;

  return (
    <div className="space-y-6 max-w-3xl text-start">
      {!canEditSetup ? (
        <SetupReadOnlyMessage title={t("accounting.setup.readOnly")} />
      ) : (
        <>
          <AccountingSettingsPreferences
            accounts={accounts}
            fiscalYears={fiscalYears}
            settingsDraft={settingsDraft}
            upd={upd}
            currencies={currencies}
            activeCurrency={activeCurrency}
            decimalSeparators={decimalSeparators}
            fyStatusConfig={fyStatusConfig}
            canEditSetup={canEditSetup}
            onEditFiscalYear={setFyModal}
            onDeleteFiscalYear={handleRequestDeleteFY}
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
            open={Boolean(fyModal) && canEditSetup}
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
        </>
      )}
    </div>
  );
});

export default AccountingSettings;
