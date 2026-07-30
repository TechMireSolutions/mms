import type React from "react";
import { type AccountingSettings } from "@mms/shared";
import { formatDate } from "@mms/shared";
import { Calendar, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { FiscalYear } from "@/lib/data/accountingData";
import { AccountingSettingsField } from "./AccountingSettingsField";
import { AccountingSettingsSectionCard } from "./AccountingSettingsSectionCard";
import { localizedFiscalMonths } from "./accountingSettingsPreferencesShared";

interface AccountingSettingsFiscalYearsSectionProps {
  fiscalYears: FiscalYear[];
  settingsDraft: AccountingSettings;
  upd: <K extends keyof AccountingSettings>(field: K, value: AccountingSettings[K]) => void;
  fyStatusConfig: Record<string, StatusBadgeConfigItem>;
  canEditSetup: boolean;
  onEditFiscalYear: (fiscalYear: Partial<FiscalYear>) => void;
  onDeleteFiscalYear: (fiscalYearId: string) => void;
}

export function AccountingSettingsFiscalYearsSection({
  fiscalYears,
  settingsDraft,
  upd,
  fyStatusConfig,
  canEditSetup,
  onEditFiscalYear,
  onDeleteFiscalYear,
}: AccountingSettingsFiscalYearsSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const sortedYears = [...fiscalYears].sort((firstYear, secondYear) => secondYear.startDate.localeCompare(firstYear.startDate));

  return (
    <AccountingSettingsSectionCard title={t("accounting.settings.secFiscalYears")} icon={Calendar}>
      <AccountingSettingsField label={t("accounting.settings.fields.fyStartMonth")} hint={t("accounting.settings.fields.fyStartMonthHint")}>
        <FormSelect
          aria-label={t("accounting.settings.fields.fyStartMonth")}
          value={settingsDraft.fyStartMonth}
          onChange={(startMonthValue) => upd("fyStartMonth", startMonthValue)}
          options={localizedFiscalMonths(t)}
          className="w-full min-w-0 sm:w-48"
        />
      </AccountingSettingsField>

      <div className="mt-4">
        <header className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="min-w-0 text-xs font-semibold text-muted-foreground uppercase m-0">{t("accounting.settings.configuredFiscalYears")}</h4>
          {canEditSetup && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => onEditFiscalYear({ label: "", startDate: "", endDate: "", status: "upcoming" })}
              className="flex shrink-0 items-center gap-1 min-h-11 text-xs font-semibold text-primary hover:text-primary/80 transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.settings.addYear")}
            </Button>
          )}
        </header>
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="space-y-3 p-3 md:hidden">
            {sortedYears.map((fiscalYear) => (
              <article key={fiscalYear.id} className="space-y-2 rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-foreground m-0">{fiscalYear.label}</h4>
                    <p className="text-xs text-muted-foreground m-0 mt-0.5">
                      {formatDate(fiscalYear.startDate)} → {formatDate(fiscalYear.endDate)}
                    </p>
                  </div>
                  <StatusBadge status={fiscalYear.status} config={fyStatusConfig} size="sm" />
                </div>
                {canEditSetup && (
                  <div className="flex items-center justify-end gap-1 border-t border-border pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("fields.editNamedAria", { name: fiscalYear.label })}
                      onClick={() => onEditFiscalYear({ ...fiscalYear })}
                      className="text-muted-foreground hover:text-foreground shadow-none"
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                    {fiscalYear.status !== "active" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={t("fields.deleteNamedAria", { name: fiscalYear.label })}
                        onClick={() => onDeleteFiscalYear(fiscalYear.id)}
                        className="text-muted-foreground hover:text-destructive shadow-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto max-w-full md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("accounting.settings.fy.tableCaption")}</caption>
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th scope="col" className="px-4 py-2 text-start text-xs font-semibold text-muted-foreground uppercase">{t("accounting.settings.fy.label")}</th>
                  <th scope="col" className="px-4 py-2 text-start text-xs font-semibold text-muted-foreground uppercase">{t("accounting.settings.fy.period")}</th>
                  <th scope="col" className="px-4 py-2 text-start text-xs font-semibold text-muted-foreground uppercase">{t("accounting.settings.fy.status")}</th>
                  <th scope="col" className="px-4 py-2 text-end text-xs font-semibold text-muted-foreground uppercase">{t("accounting.settings.fy.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedYears.map((fiscalYear) => (
                  <tr key={fiscalYear.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-foreground">{fiscalYear.label}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(fiscalYear.startDate)} → {formatDate(fiscalYear.endDate)}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={fiscalYear.status} config={fyStatusConfig} size="sm" />
                    </td>
                    <td className="px-4 py-2.5 text-end">
                      <div className="flex items-center justify-end gap-1">
                        {canEditSetup && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t("fields.editNamedAria", { name: fiscalYear.label })}
                            onClick={() => onEditFiscalYear({ ...fiscalYear })}
                            className="text-muted-foreground hover:text-foreground shadow-none"
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          </Button>
                        )}
                        {canEditSetup && fiscalYear.status !== "active" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t("fields.deleteNamedAria", { name: fiscalYear.label })}
                            onClick={() => onDeleteFiscalYear(fiscalYear.id)}
                            className="text-muted-foreground hover:text-destructive shadow-none"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AccountingSettingsSectionCard>
  );
}
