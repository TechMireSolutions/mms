import { useMemo, useState, useCallback } from "react";
import {
  DEFAULT_CURRENCIES,
  type AccountingSettings,
} from "@mms/shared";
import { useAccountingConfig } from "@/hooks/useStandardModuleConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { useTranslation } from "@/hooks/useTranslation";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { notify } from "@/lib/notify";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import type { FiscalYear } from "@/lib/data/accountingData";
import { useAccountingSetupSaveActions } from "@/tenant/features/accounting/hooks/useAccountingSetupSaveActions";

export interface UseAccountingSetupPanelStateOptions {
  fiscalYears: FiscalYear[];
  onSaveFiscalYears: (
    fiscalYears: FiscalYear[] | ((prev: FiscalYear[]) => FiscalYear[]),
  ) => void | Promise<void>;
}

export interface UseAccountingSetupPanelStateReturn {
  settingsDraft: AccountingSettings;
  upd: <K extends keyof AccountingSettings>(field: K, value: AccountingSettings[K]) => void;
  saved: boolean;
  setSaved: (value: boolean | ((curr: boolean) => boolean)) => void;
  saving: boolean;
  isPrefsDirty: boolean;
  isDirty: boolean;
  handleSave: () => Promise<void>;
  decimalSeparators: { label: string; value: string }[];
  fyStatusConfig: Record<string, StatusBadgeConfigItem>;
  currencies: typeof DEFAULT_CURRENCIES;
  activeCurrency: (typeof DEFAULT_CURRENCIES)[number] | undefined;
  fyModal: Partial<FiscalYear> | null;
  setFyModal: (fy: Partial<FiscalYear> | null) => void;
  deleteFyTarget: FiscalYear | null;
  setDeleteFyTarget: (fy: FiscalYear | null) => void;
  handleSaveFY: (fiscalYear: FiscalYear) => Promise<void>;
  handleRequestDeleteFY: (fiscalYearId: string) => void;
  handleConfirmDeleteFY: () => Promise<void>;
}

export function useAccountingSetupPanelState({
  fiscalYears,
  onSaveFiscalYears,
}: UseAccountingSetupPanelStateOptions): UseAccountingSetupPanelStateReturn {
  const { t } = useTranslation();
  const config = useAccountingConfig();
  const {
    settings,
    settingsDraft,
    saved,
    setSaved,
    upd,
    saveSettingsAsync,
  } = useModuleSettingsEditor<AccountingSettings>({
    config,
  });

  const decimalSeparators = useMemo(
    () => [
      { label: t("accounting.settings.decimal.period"), value: "period" },
      { label: t("accounting.settings.decimal.comma"), value: "comma" },
    ],
    [t],
  );

  const fyStatusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(
    () => ({
      active: { label: t("accounting.settings.fy.status.active"), cls: SEMANTIC_BADGE.successStrong },
      closed: { label: t("accounting.settings.fy.status.closed"), cls: SEMANTIC_BADGE.muted },
      upcoming: { label: t("accounting.settings.fy.status.upcoming"), cls: SEMANTIC_BADGE.infoStrong },
    }),
    [t],
  );

  const currencies = DEFAULT_CURRENCIES;
  const activeCurrency = currencies.find(
    (currencyOption) => currencyOption.code === settingsDraft.currency,
  );

  const [fyModal, setFyModal] = useState<Partial<FiscalYear> | null>(null);
  const [deleteFyTarget, setDeleteFyTarget] = useState<FiscalYear | null>(null);

  const { saving, isPrefsDirty, handleSave } = useAccountingSetupSaveActions({
    settings,
    settingsDraft,
    setSaved,
    saveSettingsAsync,
  });

  const handleSaveFY = useCallback(
    async (fiscalYear: FiscalYear) => {
      await onSaveFiscalYears((prev) => {
        const updatedFiscalYears = prev.find(
          (existingFiscalYear) => existingFiscalYear.id === fiscalYear.id,
        )
          ? prev.map((existingFiscalYear) =>
              existingFiscalYear.id === fiscalYear.id ? fiscalYear : existingFiscalYear,
            )
          : [...prev, fiscalYear];
        return updatedFiscalYears;
      });
      setFyModal(null);
    },
    [onSaveFiscalYears],
  );

  const handleRequestDeleteFY = useCallback(
    (fiscalYearId: string) => {
      const fiscalYear = fiscalYears.find(
        (existingFiscalYear) => existingFiscalYear.id === fiscalYearId,
      );
      if (!fiscalYear) return;
      if (fiscalYear.status === "active") {
        notify.error(t("accounting.settings.fy.deleteActiveAlert"));
        return;
      }
      setDeleteFyTarget(fiscalYear);
    },
    [fiscalYears, t],
  );

  const handleConfirmDeleteFY = useCallback(async () => {
    if (!deleteFyTarget) return;
    const targetId = deleteFyTarget.id;
    await onSaveFiscalYears((prev) =>
      prev.filter((existingFiscalYear) => existingFiscalYear.id !== targetId),
    );
    setDeleteFyTarget(null);
  }, [deleteFyTarget, onSaveFiscalYears]);

  return {
    settingsDraft,
    upd,
    saved,
    setSaved,
    saving,
    isPrefsDirty,
    isDirty: isPrefsDirty,
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
  };
}
