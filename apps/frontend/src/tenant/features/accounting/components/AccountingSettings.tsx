import React, { useEffect, useMemo, useState } from "react";
import type { Account, FiscalYear } from "@mms/shared";
import { Lock } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { FormModal } from "@/components/ui/FormModal";
import { FormSelect } from "@/components/ui/FormSelect";
import { Field } from "@/components/ui/FormPrimitives";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { ModuleSetupSaveFooter } from "@/components/ui/ModuleSetupSaveFooter";
import { AccountingFiscalYearModal } from "./AccountingFiscalYearModal";
import { AccountingSettingsPreferences } from "./AccountingSettingsPreferences";
import { useAccountingSetupPanelState } from "@/tenant/features/accounting/hooks/useAccountingSetupPanelState";
import { useCloseFiscalYear } from "@/tenant/features/accounting/hooks/useAccountingLedgerOps";
import { accountingErrorMessage } from "@/tenant/features/accounting/hooks/useAccountingSetupSaveActions";
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
    isPrefsReady,
    isPrefsLoadFailed,
    handleSave,
    decimalSeparators,
    fyStatusConfig,
    currencies,
    activeCurrency,
    fyModal,
    setFyModal,
    handleSaveFY,
  } = useAccountingSetupPanelState({
    onSaveFiscalYears,
  });
  const closeFiscalYear = useCloseFiscalYear();

  /**
   * Closing a year is irreversible — the server refuses to reopen one and
   * refuses to change its date range — so it is never fired from a bare click
   * on the year row: the button opens this confirmation, which also carries the
   * retained-earnings account the server needs.
   */
  const [closeTarget, setCloseTarget] = useState<FiscalYear | null>(null);
  const [closeAccountId, setCloseAccountId] = useState("");
  const [closeError, setCloseError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  const equityAccountOptions = useMemo(
    () =>
      accounts
        .filter((account) => account.type === "Equity" && account.isActive !== false)
        .sort((firstAccount, secondAccount) => firstAccount.code.localeCompare(secondAccount.code))
        .map((account) => ({ value: account.id, label: `${account.code} – ${account.name}` })),
    [accounts],
  );

  const handleRequestCloseFiscalYear = (fiscalYearId: string): void => {
    const target = fiscalYears.find((year) => year.id === fiscalYearId);
    if (!target || target.status === "closed") return;
    const preferred = settingsDraft.retainedEarningsAccount;
    setCloseAccountId(
      equityAccountOptions.some((option) => option.value === preferred) ? preferred : "",
    );
    setCloseError(null);
    setCloseTarget(target);
  };

  const handleConfirmCloseFiscalYear = async (): Promise<void> => {
    if (!closeTarget) return;
    if (!closeAccountId) {
      setCloseError(t("accounting.settings.fy.closeAccountRequired"));
      return;
    }
    setClosing(true);
    setCloseError(null);
    try {
      const result = await closeFiscalYear.mutateAsync({
        id: closeTarget.id,
        retainedEarningsAccountId: closeAccountId,
      });
      setCloseTarget(null);
      notify.success(t("accounting.settings.fy.closed"));
      try {
        await onSaveFiscalYears((prev) =>
          prev.map((year) => (year.id === result.fiscalYear.id ? result.fiscalYear : year)),
        );
      } catch {
        // The close itself is persisted and the fiscal-year query was already
        // invalidated by the mutation, so a failed local mirror must not be
        // reported as a failed close.
      }
    } catch (error) {
      setCloseError(
        accountingErrorMessage(error) ?? t("accounting.settings.fy.closeFailed"),
      );
    } finally {
      setClosing(false);
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
      {!isPrefsReady && (
        <WarningCallout
          role="alert"
          tone={isPrefsLoadFailed ? "destructive" : "info"}
          description={
            isPrefsLoadFailed
              ? t("accounting.settings.prefsLoadFailed")
              : t("accounting.settings.prefsLoading")
          }
        />
      )}

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
        onRequestCloseFiscalYear={handleRequestCloseFiscalYear}
      />

      <ModuleSetupSaveFooter
        dirty={isPrefsDirty && isPrefsReady}
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

      {/* Mounted only while a close is being confirmed: `Modal` portals
          unconditionally, so an always-mounted dialog cannot be server-rendered. */}
      {closeTarget && (
        <FormModal
          open
          onClose={() => {
            setCloseTarget(null);
            setCloseError(null);
          }}
          title={t("accounting.settings.fy.closeConfirmTitle")}
          subtitle={closeTarget.label}
          icon={Lock}
          size="sm"
          error={closeError ?? undefined}
          cancelLabel={t("common.cancel")}
          saveLabel={t("accounting.settings.fy.close")}
          onSave={handleConfirmCloseFiscalYear}
          saving={closing}
          saveDisabled={!closeAccountId}
        >
          <div className="space-y-4">
            <WarningCallout
              role="alert"
              tone="destructive"
              description={t("accounting.settings.fy.closeIrreversible")}
            />
            <Field
              id="fy-close-retained-earnings"
              label={t("accounting.settings.fields.retainedEarningsAccount")}
              hint={t("accounting.settings.fy.closeAccountHint")}
              error={
                closeAccountId ? undefined : t("accounting.settings.fy.closeAccountRequired")
              }
            >
              <FormSelect
                id="fy-close-retained-earnings"
                name="retainedEarningsAccountId"
                value={closeAccountId}
                onChange={setCloseAccountId}
                placeholder={t("accounting.journal.form.none")}
                options={equityAccountOptions}
              />
            </Field>
          </div>
        </FormModal>
      )}
    </div>
  );
});

export default AccountingSettings;
