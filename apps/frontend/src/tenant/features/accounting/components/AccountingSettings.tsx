import React, { useState, useMemo } from "react";
import {
  DEFAULT_CURRENCIES,
  ACCOUNTING_TAB_REGISTRY,
  INITIAL_ACCOUNTING_FIELD_SEED,
  ACCOUNTING_MODULE_MANIFEST,
  type AppTranslationKey,
  formatDate
} from "@mms/shared";
import {
  DollarSign, Calendar, Plus, Pencil, Trash2,
  CheckCircle2, Save, BookOpen
} from "lucide-react";
import { Account, FiscalYear } from '@/lib/data/accountingData';
import { useAccountingConfig } from "@/hooks/useStandardModuleConfig";
import { useModuleSettingsEditor } from "@/tenant/hooks/useModuleSettingsEditor";
import { DatePicker } from "@/components/ui/DatePicker";
import { FormModal } from "@/components/ui/FormModal";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Switch } from "@/components/ui/switch";
import { ModuleFieldsSetup } from "@/components/ui/ModuleFieldsSetup";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { notify } from "@/lib/notify";

const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD", "DD-MM-YYYY"];const FY_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface SectionCardProps {
  title: string;
  icon?: React.ElementType | null;
  children: React.ReactNode;
}

function SectionCard({ title, icon: Icon, children }: SectionCardProps) {
  return (
    <section aria-label={title} className="rounded-xl border border-border bg-card overflow-hidden">
      <header className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-muted/30">
        {Icon && <Icon className="w-4 h-4 text-primary" aria-hidden="true" />}
        <h3 className="text-sm font-bold text-foreground m-0">{title}</h3>
      </header>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, hint = undefined, children }: FieldProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-semibold text-foreground m-0">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5 m-0">{hint}</p>}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

interface FYModalProps {
  open: boolean;
  initial: Partial<FiscalYear> | null;
  onSave: (fiscalYear: FiscalYear) => void | Promise<void>;
  onClose: () => void;
}

function FYModal({ open, initial, onSave, onClose }: FYModalProps) {
  const { t } = useTranslation();
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<Partial<FiscalYear>>(initial || { label: "", startDate: "", endDate: "", status: "upcoming" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (open) {
      setForm(initial || { label: "", startDate: "", endDate: "", status: "upcoming" });
      setErrors({});
    }
  }, [open, initial]);

  const validate = () => {
    const validationErrors: Record<string, string> = {};
    if (!form.label?.trim()) validationErrors.label = t("accounting.settings.fy.validation.label");
    if (!form.startDate) validationErrors.startDate = t("accounting.settings.fy.validation.startDate");
    if (!form.endDate) validationErrors.endDate = t("accounting.settings.fy.validation.endDate");
    if (form.startDate && form.endDate && form.startDate >= form.endDate) validationErrors.endDate = t("accounting.settings.fy.validation.endAfterStart");
    return validationErrors;
  };

  const handleSave = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      await onSave({
        ...form,
        id: isEdit ? form.id : `fy${Date.now()}`,
      } as FiscalYear);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={isEdit ? t("accounting.settings.fy.editTitle") : t("accounting.settings.fy.newTitle")}
      icon={Calendar}
      error={Object.values(errors)}
      cancelLabel={t("common.cancel")}
      saveLabel={t("common.save")}
      onSave={() => { void handleSave(); }}
      saving={submitting}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="financial-year-label" className={FORM_LABEL}>{t("accounting.settings.fy.labelField")}</label>
          <Input
            id="financial-year-label"
            value={form.label || ""}
            onChange={(event) => setForm({ ...form, label: event.target.value })}
            placeholder={t("accounting.settings.fy.labelPlaceholder")}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="financial-year-start" className={FORM_LABEL}>{t("accounting.settings.fy.startDateField")}</label>
            <DatePicker
              id="financial-year-start"
              value={form.startDate || ""}
              onChange={(startDateValue) => setForm({ ...form, startDate: startDateValue })}
              required
            />
          </div>
          <div>
            <label htmlFor="financial-year-end" className={FORM_LABEL}>{t("accounting.settings.fy.endDateField")}</label>
            <DatePicker
              id="financial-year-end"
              value={form.endDate || ""}
              onChange={(endDateValue) => setForm({ ...form, endDate: endDateValue })}
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="financial-year-status" className={FORM_LABEL}>{t("accounting.settings.fy.status")}</label>
          <FormSelect
            id="financial-year-status"
            value={form.status || "upcoming"}
            onChange={(statusValue) => setForm({ ...form, status: statusValue as FiscalYear["status"] | "upcoming" })}
            options={[
              { value: "upcoming", label: t("accounting.settings.fy.status.upcoming") },
              { value: "active", label: t("accounting.settings.fy.status.active") },
              { value: "closed", label: t("accounting.settings.fy.status.closed") }
            ]}
          />
        </div>
      </div>
    </FormModal>
  );
}

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
    fieldsEditor,
    saved,
    setSaved,
    upd,
    saveSettingsAsync,
  } = useModuleSettingsEditor({
    config,
    tabRegistry: ACCOUNTING_TAB_REGISTRY,
  });
  const [fyModal, setFyModal] = useState<Partial<FiscalYear> | null>(null);
  const settingsSubTabs = useMemo(
    () => ACCOUNTING_MODULE_MANIFEST.setupSubTabs.map((key) => ({
      key,
      label: t(key === "fields" ? "accounting.setup.fields" : "accounting.setup.preferences"),
    })),
    [t],
  );
  const [sub, setSub] = useState<string>("fields");
  const showPrefs = sub === "preferences";
  const showFields = sub === "fields";

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

  const localizedMonths = FY_MONTHS.map((monthName) => ({
    value: monthName,
    label: t(`accounting.settings.months.${monthName.toLowerCase()}` as AppTranslationKey) || monthName
  }));

  return (
    <div className="space-y-4">
      <SubTabBar tabs={settingsSubTabs} value={sub} onChange={setSub} />
      {!canEditSetup ? (
        <p className="text-sm text-muted-foreground rounded-xl border border-border bg-muted/20 px-4 py-6">
          {t("accounting.setup.readOnly")}
        </p>
      ) : (
    <section className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 space-y-5 shadow-sm" aria-labelledby="accounting-settings-title">
      <div className="flex items-center gap-2.5 pb-1 border-b border-border/60">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <BookOpen className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        </div>
        <h3 id="accounting-settings-title" className="text-sm font-bold text-foreground">
          {showFields ? t("accounting.settings.titleFields") : t("accounting.settings.titlePreferences")}
        </h3>
      </div>

      {showPrefs && (
        <div className="space-y-6">
          {/* Organisation */}
          <SectionCard title={t("accounting.settings.secOrganisation")} icon={null}>
            <Field label={t("accounting.settings.fields.organisationName")} hint={t("accounting.settings.fields.organisationNameHint")}>
              <Input value={settingsDraft.organizationName || ""} aria-label={t("accounting.settings.fields.organisationName")} onChange={(event) => upd("organizationName", event.target.value)} />
            </Field>
          </SectionCard>

          {/* Currency & Display */}
          <SectionCard title={t("accounting.settings.secCurrency")} icon={DollarSign}>
            <Field label={t("accounting.settings.fields.baseCurrency")} hint={t("accounting.settings.fields.baseCurrencyHint")}>
              <FormSelect
                aria-label={t("accounting.settings.fields.baseCurrency")}
                value={settingsDraft.currency}
                onChange={(currencyValue) => {
                  const selectedCurrency = currencies.find((currencyOption) => currencyOption.code === currencyValue);
                  upd("currency", currencyValue);
                  if (selectedCurrency) upd("currencySymbol", selectedCurrency.symbol);
                }}
                options={currencies.map((currencyOption) => ({
                  value: currencyOption.code,
                  label: `${currencyOption.symbol} ${currencyOption.code} – ${currencyOption.name}`
                }))}
              />
              {activeCurrency && (
                <p className="text-xs text-muted-foreground mt-1 m-0">
                  {t("accounting.settings.fields.symbol")}: <span className="font-bold">{activeCurrency.symbol}</span> · {t("accounting.settings.fields.code")}: <span className="font-mono font-bold">{activeCurrency.code}</span>
                </p>
              )}
            </Field>
            <Field label={t("accounting.settings.fields.dateFormat")}>
              <FormSelect
                aria-label={t("accounting.settings.fields.dateFormat")}
                value={settingsDraft.dateFormat}
                onChange={(dateFormatValue) => upd("dateFormat", dateFormatValue)}
                options={DATE_FORMATS}
              />
            </Field>
            <Field label={t("accounting.settings.fields.numberFormat")}>
              <FormSelect
                aria-label={t("accounting.settings.fields.numberFormat")}
                value={settingsDraft.decimalSeparator}
                onChange={(separatorValue) => upd("decimalSeparator", separatorValue as "period" | "comma")}
                options={decimalSeparators}
              />
            </Field>
            <Field label={t("accounting.settings.fields.decimalPlaces")}>
              <FormSelect
                aria-label={t("accounting.settings.fields.decimalPlaces")}
                value={String(settingsDraft.decimalPlaces ?? 2)}
                onChange={(decimalPlacesValue) => upd("decimalPlaces", parseInt(decimalPlacesValue))}
                options={[0, 1, 2, 3].map((placeCount) => String(placeCount))}
                className="w-32"
              />
            </Field>
          </SectionCard>

          {/* Financial Years */}
          <SectionCard title={t("accounting.settings.secFiscalYears")} icon={Calendar}>
            <Field label={t("accounting.settings.fields.fyStartMonth")} hint={t("accounting.settings.fields.fyStartMonthHint")}>
              <FormSelect
                aria-label={t("accounting.settings.fields.fyStartMonth")}
                value={settingsDraft.fyStartMonth}
                onChange={(startMonthValue) => upd("fyStartMonth", startMonthValue)}
                options={localizedMonths}
                className="w-full min-w-0 sm:w-48"
              />
            </Field>

            <div className="mt-4">
              <header className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="min-w-0 text-xs font-semibold text-muted-foreground uppercase m-0">{t("accounting.settings.configuredFiscalYears")}</h4>
                {canEditSetup && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setFyModal({ label: "", startDate: "", endDate: "", status: "upcoming" })}
                    className="flex shrink-0 items-center gap-1 min-h-11 text-xs font-semibold text-primary hover:text-primary/80 transition-colors self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.settings.addYear")}
                  </Button>
                )}
              </header>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="space-y-3 p-3 md:hidden">
                  {[...fiscalYears].sort((firstYear, secondYear) => secondYear.startDate.localeCompare(firstYear.startDate)).map((fiscalYear) => (
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
                            onClick={() => setFyModal({ ...fiscalYear })}
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
                              onClick={() => { void handleDeleteFY(fiscalYear.id); }}
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
                    {[...fiscalYears].sort((firstYear, secondYear) => secondYear.startDate.localeCompare(firstYear.startDate)).map((fiscalYear) => {
                      return (
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
                                  onClick={() => setFyModal({ ...fiscalYear })}
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
                                  onClick={() => { void handleDeleteFY(fiscalYear.id); }}
                                  className="text-muted-foreground hover:text-destructive shadow-none"
                                >
                                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Journal Entry Rules */}
          <SectionCard title={t("accounting.settings.secRules")} icon={null}>
            <Field label={t("accounting.settings.fields.requireNarration")} hint={t("accounting.settings.fields.requireNarrationHint")}>
              <Switch aria-label={t("accounting.settings.fields.requireNarration")} checked={settingsDraft.requireNarration} onCheckedChange={(checked) => upd("requireNarration", checked)} />
            </Field>
            <Field label={t("accounting.settings.fields.allowEditPosted")} hint={t("accounting.settings.fields.allowEditPostedHint")}>
              <Switch aria-label={t("accounting.settings.fields.allowEditPosted")} checked={settingsDraft.allowEditPosted} onCheckedChange={(checked) => upd("allowEditPosted", checked)} />
              {settingsDraft.allowEditPosted && (
                <p className="text-xs text-warning mt-1 font-semibold m-0" role="alert">{t("accounting.settings.fields.allowEditPostedWarning")}</p>
              )}
            </Field>
            <Field label={t("accounting.settings.fields.autoPostDrafts")} hint={t("accounting.settings.fields.autoPostDraftsHint")}>
              <Switch aria-label={t("accounting.settings.fields.autoPostDrafts")} checked={settingsDraft.autoPostDrafts} onCheckedChange={(checked) => upd("autoPostDrafts", checked)} />
            </Field>
          </SectionCard>

          {/* Account Numbering */}
          <SectionCard title={t("accounting.settings.secNumbering")} icon={null}>
            <Field label={t("accounting.settings.fields.defaultCodeLength")} hint={t("accounting.settings.fields.defaultCodeLengthHint")}>
              <FormSelect
                aria-label={t("accounting.settings.fields.defaultCodeLength")}
                value={String(settingsDraft.accountCodeLength ?? 4)}
                onChange={(codeLengthValue) => upd("accountCodeLength", parseInt(codeLengthValue))}
                options={[3, 4, 5, 6].map((digitCount) => String(digitCount))}
                className="w-32"
              />
            </Field>
            <Field label={t("accounting.settings.fields.retainedEarningsAccount")} hint={t("accounting.settings.fields.retainedEarningsAccountHint")}>
              <FormSelect
                aria-label={t("accounting.settings.fields.retainedEarningsAccount")}
                value={settingsDraft.retainedEarningsAccount || ""}
                onChange={(accountId) => upd("retainedEarningsAccount", accountId)}
                placeholder={t("accounting.journal.form.none")}
                options={accounts
                  .filter((account) => account.type === "Equity" && account.isActive !== false)
                  .sort((firstAccount, secondAccount) => firstAccount.code.localeCompare(secondAccount.code))
                  .map((account) => ({ value: account.id, label: `${account.code} – ${account.name}` }))}
              />
            </Field>
          </SectionCard>
        </div>
      )}

      {showFields && (
        <ModuleFieldsSetup
          editor={fieldsEditor}
          isCoreField={(tabId, key) => INITIAL_ACCOUNTING_FIELD_SEED[tabId]?.some((field) => field.key === key) ?? false}
          onStateChange={() => setSaved(false)}
        />
      )}

      <footer className="flex w-full items-center justify-end gap-3 border-t border-border/40 mt-6 pt-4">
        <Button
          type="button"
          onClick={() => { void handleSave(); }}
          className={saved ? "bg-success hover:bg-success/90 text-success-foreground ms-auto" : "ms-auto"}
        >
          {saved ? <><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.settings.btnSaved")}</> : <><Save className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.settings.btnSave")}</>}
        </Button>
      </footer>

      <FYModal open={!!fyModal && canEditSetup} initial={fyModal} onSave={handleSaveFY} onClose={() => setFyModal(null)} />
    </section>
      )}
    </div>
  );
}
