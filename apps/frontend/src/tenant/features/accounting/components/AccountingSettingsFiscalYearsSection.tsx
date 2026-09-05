import { type AccountingSettings, type FiscalYear, formatDate } from "@mms/shared";
import { Calendar, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { WORK_SURFACE, WORK_SURFACE_INNER, SETUP_SECTION_CARD_CLASS } from "@/components/ui/formStyles";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/hooks/useTranslation";
import { Field } from "@/components/ui/FormPrimitives";
import { SectionCard } from "@/components/ui/SectionCard";
import { localizedFiscalMonths } from "./accountingSettingsPreferencesShared";

interface AccountingSettingsFiscalYearsSectionProps {
  fiscalYears: FiscalYear[];
  settingsDraft: AccountingSettings;
  upd: <K extends keyof AccountingSettings>(field: K, value: AccountingSettings[K]) => void;
  fyStatusConfig: Record<string, StatusBadgeConfigItem>;
  canEditSetup: boolean;
  onEditFiscalYear: (fiscalYear: Partial<FiscalYear>) => void;
  onDeleteFiscalYear: (fiscalYearId: string) => void;
  onCloseFiscalYear?: (fiscalYearId: string) => void;
}

export function AccountingSettingsFiscalYearsSection({
  fiscalYears,
  settingsDraft,
  upd,
  fyStatusConfig,
  canEditSetup,
  onEditFiscalYear,
  onDeleteFiscalYear,
  onCloseFiscalYear,
}: AccountingSettingsFiscalYearsSectionProps): React.JSX.Element {
  const { t } = useTranslation();
  const sortedYears = [...fiscalYears].sort((firstYear, secondYear) => secondYear.startDate.localeCompare(firstYear.startDate));

  return (
    <SectionCard
      title={t("accounting.settings.secFiscalYears")}
      icon={Calendar}
      className={SETUP_SECTION_CARD_CLASS}
    >
      <Field
        label={t("accounting.settings.fields.fyStartMonth")}
        hint={t("accounting.settings.fields.fyStartMonthHint")}
      >
        <FormSelect
          id="accounting-fy-start-month"
          value={settingsDraft.fyStartMonth}
          onChange={(startMonthValue) => upd("fyStartMonth", startMonthValue)}
          options={localizedFiscalMonths(t)}
          className="w-full min-w-0 sm:w-48"
        />
      </Field>

      <div className="mt-4">
        <SectionHeader
          title={<span className="min-w-0 text-xs font-semibold text-muted-foreground uppercase m-0">{t("accounting.settings.secFiscalYears")}</span>}
          actions={
            canEditSetup && (
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => onEditFiscalYear({ label: "", startDate: "", endDate: "", status: "upcoming" })}
                className="flex shrink-0 items-center gap-1 min-h-11 text-xs font-semibold text-primary hover:text-primary/80 transition-colors self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.settings.fy.newTitle")}
              </Button>
            )
          }
        />
        <div className={WORK_SURFACE}>
          <div className="space-y-3 p-3 md:hidden">
            {sortedYears.map((fiscalYear) => (
              <article key={fiscalYear.id} className={`${WORK_SURFACE_INNER} space-y-2 p-3`}>
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
                    {onCloseFiscalYear && fiscalYear.status !== "closed" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onCloseFiscalYear(fiscalYear.id)}
                        className="min-h-11 min-w-11 text-xs"
                        aria-label={`${t("accounting.settings.fy.close")} ${fiscalYear.label}`}
                      >
                        <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditFiscalYear(fiscalYear)}
                      className="min-h-11 min-w-11 text-xs"
                      aria-label={`${t("common.edit")} ${fiscalYear.label}`}
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteFiscalYear(fiscalYear.id)}
                      className="min-h-11 min-w-11 text-xs text-destructive hover:text-destructive/80"
                      aria-label={`${t("common.delete")} ${fiscalYear.label}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </article>
            ))}
            {sortedYears.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground m-0">{t("accounting.settings.noFiscalYears")}</p>
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("accounting.settings.fy.label")}</TableHead>
                  <TableHead>{t("accounting.settings.fy.startDateField")}</TableHead>
                  <TableHead>{t("accounting.settings.fy.endDateField")}</TableHead>
                  <TableHead>{t("accounting.settings.fy.status")}</TableHead>
                  {canEditSetup && <TableHead className="text-end">{t("accounting.settings.fy.actions")}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedYears.map((fiscalYear) => (
                  <TableRow key={fiscalYear.id}>
                    <TableCell className="font-semibold text-foreground">{fiscalYear.label}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(fiscalYear.startDate)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(fiscalYear.endDate)}</TableCell>
                    <TableCell>
                      <StatusBadge status={fiscalYear.status} config={fyStatusConfig} size="sm" />
                    </TableCell>
                    {canEditSetup && (
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-1">
                          {onCloseFiscalYear && fiscalYear.status !== "closed" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => onCloseFiscalYear(fiscalYear.id)}
                              className="min-h-11 min-w-11"
                              aria-label={`${t("accounting.settings.fy.close")} ${fiscalYear.label}`}
                            >
                              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditFiscalYear(fiscalYear)}
                            className="min-h-11 min-w-11"
                            aria-label={`${t("common.edit")} ${fiscalYear.label}`}
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteFiscalYear(fiscalYear.id)}
                            className="min-h-11 min-w-11 text-destructive hover:text-destructive/80"
                            aria-label={`${t("common.delete")} ${fiscalYear.label}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {sortedYears.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canEditSetup ? 5 : 4} className="py-6 text-center text-xs text-muted-foreground">
                      {t("accounting.settings.noFiscalYears")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
