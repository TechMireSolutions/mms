import { type AccountingSettings } from "@mms/shared";
import { useState, useMemo } from "react";
import {
  DEFAULT_CURRENCIES,
  ACCOUNTING_TAB_REGISTRY,
  ACCOUNTING_MODULE_MANIFEST,
} from "@mms/shared";
import {
  CheckCircle2, Save, BookOpen
} from "lucide-react";
import { Account, FiscalYear } from '@/lib/data/accountingData';
import { useAccountingConfig } from "@/hooks/useStandardModuleConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { Button } from "@/components/ui/button";
import { type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { notify } from "@/lib/notify";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { AccountingFiscalYearModal } from "./AccountingFiscalYearModal";
import { AccountingSettingsPreferences } from "./AccountingSettingsPreferences";

interface AccountingSettingsProps {
  accounts: Account[];
  fiscalYears: FiscalYear[];
  onSaveFiscalYears: (fiscalYears: FiscalYear[] | ((prev: FiscalYear[]) => FiscalYear[])) => void | Promise<void>;
}

export function AccountingSettings({
  accounts,
  fiscalYears,
  onSaveFiscalYears,
}: AccountingSettingsProps) {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(ACCOUNTING_MODULE_MANIFEST);
  const decimalSeparators = useMemo(() => [
    { label: t("accounting.settings.decimal.period"), value: "period" },
    { label: t("accounting.settings.decimal.comma"), value: "comma" },
  ], [t]);
  const fyStatusConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    active: { label: t("accounting.settings.fy.status.active"), cls: SEMANTIC_BADGE.successStrong },
    closed: { label: t("accounting.settings.fy.status.closed"), cls: SEMANTIC_BADGE.muted },
    upcoming: { label: t("accounting.settings.fy.status.upcoming"), cls: SEMANTIC_BADGE.infoStrong },
  }), [t]);
  const currencies = DEFAULT_CURRENCIES;
  const config = useAccountingConfig();
  const {
    settingsDraft,
    saved,
    upd,
    saveSettingsAsync,
  } = useModuleSettingsEditor<AccountingSettings>({
    config,
    tabRegistry: ACCOUNTING_TAB_REGISTRY,
  });

  const [fyModal, setFyModal] = useState<Partial<FiscalYear> | null>(null);

  const handleSave = async () => {
    try {
      await saveSettingsAsync();
      notify.success(t("accounting.settings.saved"));
    } catch (error: unknown) {
      notify.error(t("accounting.settings.saveFailed"), {
        description: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleSaveFY = async (fiscalYear: FiscalYear) => {
    await onSaveFiscalYears((prev) => {
      const updatedFiscalYears = prev.find((existingFiscalYear) => existingFiscalYear.id === fiscalYear.id)
        ? prev.map((existingFiscalYear) => existingFiscalYear.id === fiscalYear.id ? fiscalYear : existingFiscalYear)
        : [...prev, fiscalYear];
      return updatedFiscalYears;
    });
    setFyModal(null);
  };

  const handleDeleteFY = async (fiscalYearId: string) => {
    const fiscalYear = fiscalYears.find((existingFiscalYear) => existingFiscalYear.id === fiscalYearId);
    if (fiscalYear?.status === "active") { alert(t("accounting.settings.fy.deleteActiveAlert")); return; }
    if (!confirm(t("accounting.settings.fy.deleteConfirm"))) return;
    await onSaveFiscalYears((prev) => prev.filter((existingFiscalYear) => existingFiscalYear.id !== fiscalYearId));
  };

  const activeCurrency = currencies.find((currencyOption) => currencyOption.code === settingsDraft.currency);

  return (
    <div className="space-y-4">
      {!canEditSetup ? (
        <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6">
          {t("accounting.setup.readOnly")}
        </p>
      ) : (
        <section className={`${WORK_SURFACE} p-5 space-y-5`} aria-labelledby="accounting-settings-title">
          <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            </div>
            <h3 id="accounting-settings-title" className="text-sm font-bold text-foreground">
              {t("accounting.settings.titlePreferences")}
            </h3>
          </div>

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
            onDeleteFiscalYear={(fiscalYearId) => { void handleDeleteFY(fiscalYearId); }}
          />

          <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
            <Button
              type="button"
              onClick={() => { void handleSave(); }}
              className={saved ? "bg-success hover:bg-success/90 text-success-foreground ms-auto" : "ms-auto"}
            >
              {saved ? <><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.settings.btnSaved")}</> : <><Save className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.settings.btnSave")}</>}
            </Button>
          </footer>

          <AccountingFiscalYearModal open={!!fyModal && canEditSetup} initial={fyModal} onSave={handleSaveFY} onClose={() => setFyModal(null)} />
        </section>
      )}
    </div>
  );
}

