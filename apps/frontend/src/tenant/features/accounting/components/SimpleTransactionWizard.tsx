import React, { useState } from "react";
import { useAccountingCurrency } from "../hooks/useAccountingCurrency";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, ChevronUp,
  DollarSign, TrendingDown, RefreshCw, BookOpen,
  Building2, Zap, Package, Home, UserCheck, Heart, Plus, Upload
} from "lucide-react";
import { generateJERef, Account, JournalEntry, FiscalYear } from '@/lib/data/accountingData';
import { DatePicker } from "@/components/ui/DatePicker";
import { Modal } from "@/components/ui/Modal";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";
import { type AppTranslationKey } from "@mms/shared";

// ── Transaction Type Definitions ──────────────────────────────────────────────

interface QuickActionType {
  id: string;
  labelKey: AppTranslationKey;
  icon: React.ElementType;
  debitAcc: string;
  creditAcc: string;
  tag: string;
  descriptionKey: AppTranslationKey;
  groupKey: AppTranslationKey;
  color: string;
}

interface TransactionGroup {
  groupKey: AppTranslationKey;
  color: "emerald" | "red" | "blue";
  icon: React.ElementType;
  items: QuickActionType[];
}

const TRANSACTION_TYPES: TransactionGroup[] = [
  {
    groupKey: "accounting.journal.dashboard.group.moneyIn",
    color: "emerald",
    icon: DollarSign,
    items: [
      { id: "fee_collection",  labelKey: "accounting.journal.dashboard.label.feeCollection", icon: BookOpen,    debitAcc: "a1000", creditAcc: "a4000", tag: "Fees",     descriptionKey: "accounting.journal.dashboard.desc.feeCollection", groupKey: "accounting.journal.dashboard.group.moneyIn", color: "emerald" },
      { id: "donation",        labelKey: "accounting.journal.dashboard.label.donationReceived",       icon: Heart,       debitAcc: "a1000", creditAcc: "a4100", tag: "Donation", descriptionKey: "accounting.journal.dashboard.desc.donationReceived", groupKey: "accounting.journal.dashboard.group.moneyIn", color: "emerald" },
      { id: "rent_income",     labelKey: "accounting.journal.dashboard.label.rentIncome",             icon: Home,        debitAcc: "a1000", creditAcc: "a4300", tag: "Capital",  descriptionKey: "accounting.journal.dashboard.desc.rentIncome", groupKey: "accounting.journal.dashboard.group.moneyIn", color: "emerald" },
      { id: "other_income",    labelKey: "accounting.journal.dashboard.label.otherIncome",            icon: Plus,        debitAcc: "a1000", creditAcc: "a4400", tag: "Capital",  descriptionKey: "accounting.journal.dashboard.desc.otherIncome", groupKey: "accounting.journal.dashboard.group.moneyIn", color: "emerald" },
    ],
  },
  {
    groupKey: "accounting.journal.dashboard.group.moneyOut",
    color: "red",
    icon: TrendingDown,
    items: [
      { id: "salary",          labelKey: "accounting.journal.dashboard.label.salaryPayment",          icon: UserCheck,   debitAcc: "a5000", creditAcc: "a1010", tag: "Payroll",   descriptionKey: "accounting.journal.dashboard.desc.salaryPayment", groupKey: "accounting.journal.dashboard.group.moneyOut", color: "red" },
      { id: "utilities",       labelKey: "accounting.journal.dashboard.label.utilities",               icon: Zap,         debitAcc: "a5200", creditAcc: "a1000", tag: "Utilities", descriptionKey: "accounting.journal.dashboard.desc.utilities", groupKey: "accounting.journal.dashboard.group.moneyOut", color: "red" },
      { id: "supplies",        labelKey: "accounting.journal.dashboard.label.supplies",                icon: Package,     debitAcc: "a5300", creditAcc: "a1000", tag: "Capital",   descriptionKey: "accounting.journal.dashboard.desc.supplies", groupKey: "accounting.journal.dashboard.group.moneyOut", color: "red" },
      { id: "rent_payment",    labelKey: "accounting.journal.dashboard.label.rentPayment",            icon: Building2,   debitAcc: "a5100", creditAcc: "a1010", tag: "Rent",      descriptionKey: "accounting.journal.dashboard.desc.rentPayment", groupKey: "accounting.journal.dashboard.group.moneyOut", color: "red" },
      { id: "other_expense",   labelKey: "accounting.journal.dashboard.label.otherExpense",           icon: TrendingDown,debitAcc: "a5700", creditAcc: "a1000", tag: "Capital",   descriptionKey: "accounting.journal.dashboard.desc.otherExpense", groupKey: "accounting.journal.dashboard.group.moneyOut", color: "red" },
    ],
  },
  {
    groupKey: "accounting.journal.dashboard.group.transfers",
    color: "blue",
    icon: RefreshCw,
    items: [
      { id: "transfer",        labelKey: "accounting.journal.dashboard.label.transfer",               icon: RefreshCw,   debitAcc: "a1020", creditAcc: "a1010", tag: "Adjustment", descriptionKey: "accounting.journal.dashboard.desc.transfer", groupKey: "accounting.journal.dashboard.group.transfers", color: "blue" },
      { id: "adjustment",      labelKey: "accounting.journal.dashboard.label.adjustment",             icon: Plus,        debitAcc: "a1000", creditAcc: "a1000", tag: "Adjustment", descriptionKey: "accounting.journal.dashboard.desc.adjustment", groupKey: "accounting.journal.dashboard.group.transfers", color: "blue" },
    ],
  },
];

const GROUP_COLORS: Record<string, Record<string, string>> = {
  emerald: {
    card: "border-success/30 bg-success/10/60 hover:bg-success/10",
    header: "bg-success/15 text-success border-success/30",
    badge: "bg-success/15 text-success",
    item: "border-success/30 hover:border-success hover:bg-success/10",
    selected: "border-success bg-success/10 ring-2 ring-success/30",
    icon: "text-success bg-success/15",
  },
  red: {
    card: "border-destructive/30 bg-destructive/10/60 hover:bg-destructive/10",
    header: "bg-destructive/15 text-destructive border-destructive/30",
    badge: "bg-destructive/15 text-destructive",
    item: "border-destructive/30 hover:border-destructive hover:bg-destructive/10",
    selected: "border-destructive bg-destructive/10 ring-2 ring-destructive/20",
    icon: "text-destructive bg-destructive/15",
  },
  blue: {
    card: "border-info/30 bg-info/10/60 hover:bg-info/10",
    header: "bg-info/15 text-info border-info/30",
    badge: "bg-info/15 text-info",
    item: "border-info/30 hover:border-info hover:bg-info/10",
    selected: "border-info bg-info/10 ring-2 ring-info/30",
    icon: "text-info bg-info/15",
  },
};


interface WizardFormState {
  date: string;
  amount: string;
  debitAcc: string;
  creditAcc: string;
  description: string;
  ref: string;
  receipt: string;
  fiscal_year: string;
}

// ── Step 1: Type Selection ──────────────────────────────────────────────────
function StepTypeSelection({ selected, onSelect }: { selected: QuickActionType | null, onSelect: (type: QuickActionType) => void }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <header className="text-center space-y-1 pb-2">
        <h3 className="text-lg font-bold text-foreground m-0">{t("accounting.journal.dashboard.whatHappened")}</h3>
        <p className="text-sm text-muted-foreground m-0">{t("accounting.journal.dashboard.subtitleSimple")}</p>
      </header>
      {TRANSACTION_TYPES.map((group) => {
        const colors = GROUP_COLORS[group.color];
        const GroupIcon = group.icon;
        const translatedGroupName = t(group.groupKey);
        return (
          <article key={group.groupKey} className={`rounded-2xl border p-4 ${colors.card}`}>
            <header className={`flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg border w-fit ${colors.header}`}>
              <GroupIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <h4 className="text-xs font-bold uppercase tracking-wide m-0">{translatedGroupName}</h4>
            </header>
            <nav aria-label={`Select ${translatedGroupName} transaction type`} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isSelected = selected?.id === item.id;
                return (
                  <Button key={item.id} type="button" variant="ghost" aria-pressed={isSelected} onClick={() => onSelect({ ...item, groupKey: group.groupKey, color: group.color })}
                    className={`h-auto flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center ${isSelected ? colors.selected : `border-border bg-card hover:bg-muted/50 ${colors.item}`}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? colors.icon : "bg-muted text-muted-foreground"}`} aria-hidden="true">
                      <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                    </div>
                    <span className={`text-[11px] font-semibold leading-tight ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>{t(item.labelKey)}</span>
                  </Button>
                );
              })}
            </nav>
          </article>
        );
      })}
    </div>
  );
}

// ── Step 2: Transaction Form ────────────────────────────────────────────────
function StepTransactionForm({ type, form, setForm, accounts, currencySymbol }: { type: QuickActionType, form: WizardFormState, setForm: React.Dispatch<React.SetStateAction<WizardFormState>>, accounts: Account[], currencySymbol: string }) {
  const { t } = useTranslation();
  const isMoneyIn = type.groupKey === "accounting.journal.dashboard.group.moneyIn";
  const isTransfer = type.groupKey === "accounting.journal.dashboard.group.transfers";
  const cashAccounts = accounts.filter((account) => ["a1000","a1010","a1020"].includes(account.id));
  const cashAccountOptions = cashAccounts.map((account) => ({ value: account.id, label: account.name }));

  return (
    <fieldset className="space-y-4 border-0 p-0 m-0">
      <legend className="sr-only">{t("accounting.journal.dashboard.wizard.reviewTitle")}</legend>
      <header className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${GROUP_COLORS[type.color || "blue"].icon}`} aria-hidden="true">
          {React.createElement(type.icon, { className: "w-5 h-5" })}
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground m-0">{t(type.labelKey)}</h3>
          <p className="text-xs text-muted-foreground m-0">{t(type.groupKey)}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {/* Date */}
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="wizard-date" className={FORM_LABEL}>{t("accounting.columns.journal.date")}</label>
          <DatePicker
            id="wizard-date"
            value={form.date}
            onChange={(dateValue) => setForm({ ...form, date: dateValue })}
          />
        </div>

        {/* Amount */}
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="wizard-amount" className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.amount")}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground" aria-hidden="true">{currencySymbol}</span>
            <Input id="wizard-amount" type="number" min="0" step="0.01" value={form.amount} placeholder="0.00"
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
              className="pl-8 text-lg font-bold" aria-invalid={!form.amount} />
          </div>
          {!form.amount && <p className="text-[11px] text-warning mt-1" role="alert">{t("accounting.journal.dashboard.wizard.errorAmount")}</p>}
        </div>

        {/* Source / Destination account */}
        {isMoneyIn ? (
          <div className="col-span-2">
            <label htmlFor="wizard-acc-in" className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.receivedInto")}</label>
            <FormSelect
              id="wizard-acc-in"
              value={form.debitAcc}
              onChange={(accountId) => setForm({ ...form, debitAcc: accountId })}
              options={cashAccountOptions}
            />
          </div>
        ) : isTransfer ? (
          <>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="wizard-acc-to" className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.transferTo")}</label>
              <FormSelect
                id="wizard-acc-to"
                value={form.debitAcc}
                onChange={(accountId) => setForm({ ...form, debitAcc: accountId })}
                options={cashAccountOptions}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="wizard-acc-from" className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.transferFrom")}</label>
              <FormSelect
                id="wizard-acc-from"
                value={form.creditAcc}
                onChange={(accountId) => setForm({ ...form, creditAcc: accountId })}
                options={cashAccountOptions}
              />
            </div>
          </>
        ) : (
          <div className="col-span-2">
            <label htmlFor="wizard-acc-out" className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.paidFrom")}</label>
            <FormSelect
              id="wizard-acc-out"
              value={form.creditAcc}
              onChange={(accountId) => setForm({ ...form, creditAcc: accountId })}
              options={cashAccountOptions}
            />
          </div>
        )}

        {/* Description */}
        <div className="col-span-2">
          <label htmlFor="wizard-description" className={FORM_LABEL}>{t("accounting.columns.journal.description")}</label>
          <Input id="wizard-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder={t(type.descriptionKey)} />
        </div>

        {/* Reference */}
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="wizard-ref" className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.refNo")} <span className="normal-case font-normal text-muted-foreground">{t("accounting.journal.dashboard.wizard.optional")}</span></label>
          <Input id="wizard-ref" value={form.ref} onChange={(event) => setForm({ ...form, ref: event.target.value })}
            placeholder={t("accounting.journal.dashboard.wizard.refPlaceholder")} />
        </div>

        {/* Receipt upload */}
        <div className="col-span-2 sm:col-span-1">
          <label className={FORM_LABEL}>{t("accounting.journal.dashboard.wizard.receipt")} <span className="normal-case font-normal text-muted-foreground">{t("accounting.journal.dashboard.wizard.optional")}</span></label>
          <label className={`${FORM_INPUT} flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground`}>
            <Upload className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span className="text-xs">{form.receipt ? form.receipt : t("accounting.journal.dashboard.wizard.uploadReceipt")}</span>
            <Input type="file" accept="image/*,application/pdf" className="hidden"
              onChange={(event) => setForm({ ...form, receipt: event.target.files?.[0]?.name || "" })} />
          </label>
        </div>
      </div>
    </fieldset>
  );
}

// ── Step 3: Review ──────────────────────────────────────────────────────────
function StepReview({
  type,
  form,
  accounts,
  showAdvanced,
  setShowAdvanced,
  formatCurrency,
}: {
  type: QuickActionType;
  form: WizardFormState;
  accounts: Account[];
  showAdvanced: boolean;
  setShowAdvanced: React.Dispatch<React.SetStateAction<boolean>>;
  formatCurrency: (amount: number | string | null | undefined) => string;
}) {
  const { t } = useTranslation();
  const amount = parseFloat(form.amount) || 0;
  const debitAccount  = accounts.find((account) => account.id === form.debitAcc);
  const creditAccount = accounts.find((account) => account.id === form.creditAcc);

  const rows = [
    { label: t("accounting.journal.dashboard.wizard.transactionType"), value: t(type.labelKey) },
    { label: t("accounting.columns.journal.date"),             value: form.date },
    { label: t("accounting.journal.dashboard.wizard.amountLabel"),           value: formatCurrency(amount) },
    type.groupKey === "accounting.journal.dashboard.group.moneyIn"
      ? { label: t("accounting.journal.dashboard.wizard.receivedIntoLabel"), value: debitAccount?.name || "—" }
      : type.groupKey === "accounting.journal.dashboard.group.transfers"
      ? { label: t("accounting.journal.dashboard.wizard.transferLabel"),      value: `${creditAccount?.name || "—"} → ${debitAccount?.name || "—"}` }
      : { label: t("accounting.journal.dashboard.wizard.paidFromLabel"),     value: creditAccount?.name || "—" },
    { label: t("accounting.columns.journal.description"),      value: form.description || "—" },
    form.ref ? { label: t("accounting.journal.dashboard.wizard.referenceLabel"), value: form.ref } : null,
  ].filter(Boolean) as { label: string, value: string }[];

  return (
    <section aria-label="Review Transaction details" className="space-y-4">
      <header className="text-center space-y-1 pb-1">
        <h3 className="text-lg font-bold text-foreground m-0">{t("accounting.journal.dashboard.wizard.reviewTitle")}</h3>
        <p className="text-sm text-muted-foreground m-0">{t("accounting.journal.dashboard.wizard.reviewSubtitle")}</p>
      </header>

      <div className="rounded-2xl border border-border overflow-hidden">
        {rows.map((row, index) => (
          <div key={index} className={`flex items-start gap-4 px-4 py-3 ${index % 2 === 0 ? "bg-muted/20" : "bg-background"}`}>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-32 flex-shrink-0 pt-0.5">{row.label}</span>
            <span className="text-sm font-semibold text-foreground">{row.value}</span>
          </div>
        ))}
        <div className="px-4 py-3 bg-success/10 border-t border-success/20 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-success">{t("accounting.journal.dashboard.wizard.postMessage")}</span>
        </div>
      </div>

      {/* Advanced accounting accordion */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Button type="button" variant="ghost" onClick={() => setShowAdvanced((previousValue) => !previousValue)}
          aria-expanded={showAdvanced}
          className="w-full h-auto flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{t("accounting.journal.dashboard.wizard.showAdvanced")}</span>
          {showAdvanced ? <ChevronUp className="w-4 h-4 text-muted-foreground" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />}
        </Button>
        {showAdvanced && (
          <div className="p-4 space-y-2">
            <div className="rounded-lg overflow-hidden border border-border text-xs">
              <div className="grid grid-cols-3 gap-0 bg-muted/60 border-b border-border">
                <div className="px-3 py-2 font-bold text-muted-foreground uppercase">{t("accounting.journal.detail.account")}</div>
                <div className="px-3 py-2 font-bold text-muted-foreground uppercase text-right">{t("accounting.columns.journal.debit")}</div>
                <div className="px-3 py-2 font-bold text-muted-foreground uppercase text-right">{t("accounting.columns.journal.credit")}</div>
              </div>
              <div className="grid grid-cols-3 bg-info/10/50 border-b border-border">
                <div className="px-3 py-2 font-semibold text-foreground">{debitAccount?.name || "—"}</div>
                <div className="px-3 py-2 text-right font-mono text-info font-bold">{formatCurrency(amount)}</div>
                <div className="px-3 py-2 text-right text-muted-foreground">—</div>
              </div>
              <div className="grid grid-cols-3 bg-success/10/50">
                <div className="px-3 py-2 font-semibold text-foreground">{creditAccount?.name || "—"}</div>
                <div className="px-3 py-2 text-right text-muted-foreground">—</div>
                <div className="px-3 py-2 text-right font-mono text-success font-bold">{formatCurrency(amount)}</div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground m-0">{t("accounting.journal.dashboard.wizard.linesAutoGenerated")}</p>
          </div>
        )}
      </div>
    </section>
  );
}


interface SimpleTransactionWizardProps {
  open: boolean;
  accounts: Account[];
  entries: JournalEntry[];
  fiscalYears: FiscalYear[];
  onSave: (entry: JournalEntry) => void;
  onClose: () => void;
  prefillType?: QuickActionType | null;
}

// ── Main Wizard ─────────────────────────────────────────────────────────────
/**
 * SimpleTransactionWizard component.
 *
 * Renders a step-by-step modal wizard that assists users (such as administrators or accountants)
 * in recording standard business transactions using predefined templates (e.g., student fee collections,
 * utility payments, salary payments, donations) without needing deep double-entry bookkeeping knowledge.
 *
 * @param props - The properties for the component.
 * @returns React element representing the transaction wizard modal.
 */
export function SimpleTransactionWizard({ open, accounts, entries, fiscalYears, onSave, onClose, prefillType }: SimpleTransactionWizardProps) {
  const { t } = useTranslation();
  const { formatCurrency, activeCurrency } = useAccountingCurrency();
  const [step, setStep] = useState(prefillType ? 2 : 1);
  const [selectedType, setSelectedType] = useState<QuickActionType | null>(prefillType || null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const activeFiscalYearLabel = (fiscalYears || []).find((fiscalYear) => fiscalYear.status === "active")?.label || "";

  const [form, setForm] = useState<WizardFormState>({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    debitAcc: prefillType?.debitAcc || "a1000",
    creditAcc: prefillType?.creditAcc || "a1010",
    description: prefillType?.descriptionKey ? t(prefillType.descriptionKey) : "",
    ref: "",
    receipt: "",
    fiscal_year: activeFiscalYearLabel,
  });

  const handleTypeSelect = (type: QuickActionType) => {
    setSelectedType(type);
    setForm((previousForm) => ({
      ...previousForm,
      debitAcc: type.debitAcc,
      creditAcc: type.creditAcc,
      description: t(type.descriptionKey),
    }));
    setStep(2);
  };

  const canProceed = () => {
    if (step === 2) return !!form.amount && parseFloat(form.amount) > 0;
    return true;
  };

  const validate = () => {
    if (!form.amount || parseFloat(form.amount) <= 0) return t("accounting.journal.dashboard.wizard.errorAmount");
    if (!form.debitAcc || !form.creditAcc) return t("accounting.journal.dashboard.wizard.errorSource");
    if (!form.date) return t("accounting.journal.dashboard.wizard.errorDate");
    return null;
  };

  const handleSave = (status: "draft" | "posted") => {
    const validationError = validate();
    if (validationError) { alert(validationError); return; }
    const amount = parseFloat(form.amount);
    const generatedReference = generateJERef(entries);
    const description = form.description || t(selectedType!.labelKey);
    onSave({
      id: `je${Date.now()}`,
      ref: form.ref ? `${form.ref}` : generatedReference,
      date: form.date,
      description,
      status,
      created_by: "Admin",
      tags: [selectedType!.tag],
      attachments: [],
      fiscal_year: form.fiscal_year,
      simple_mode: true,
      transaction_type: selectedType!.id,
      lines: [
        { id: `l${Date.now()}a`, account_id: form.debitAcc,  debit: amount, credit: 0,   description },
        { id: `l${Date.now()}b`, account_id: form.creditAcc, debit: 0,   credit: amount, description },
      ],
    });
  };

  const steps = [
    { stepNumber: 1, label: t("accounting.journal.dashboard.wizard.stepSelect") },
    { stepNumber: 2, label: t("accounting.journal.dashboard.wizard.stepDetails") },
    { stepNumber: 3, label: t("accounting.journal.dashboard.wizard.stepReview") },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("accounting.journal.dashboard.recordTransaction")}
      subtitle={t("accounting.journal.dashboard.subtitleSimple")}
      size="lg"
      panelClassName="max-h-[92vh]"
      headerExtra={
        <nav aria-label="Wizard Steps" className="flex items-center gap-2">
          {steps.map((stepDefinition, index) => (
            <React.Fragment key={stepDefinition.stepNumber}>
              <div className="flex items-center gap-1.5">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                  step > stepDefinition.stepNumber ? "bg-success text-white" : step === stepDefinition.stepNumber ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`} aria-current={step === stepDefinition.stepNumber ? "step" : undefined}>
                  {step > stepDefinition.stepNumber ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : stepDefinition.stepNumber}
                </div>
                <span className={`hidden text-[11px] font-semibold sm:block ${step === stepDefinition.stepNumber ? "text-foreground" : "text-muted-foreground"}`}>{stepDefinition.label}</span>
              </div>
              {index < steps.length - 1 && <div className={`h-0.5 flex-1 rounded-full transition-all ${step > stepDefinition.stepNumber ? "bg-success" : "bg-border"}`} aria-hidden="true" />}
            </React.Fragment>
          ))}
        </nav>
      }
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => step > 1 ? setStep(step - 1) : onClose()}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {step === 1 ? t("accounting.journal.dashboard.wizard.cancel") : t("accounting.journal.dashboard.wizard.back")}
          </Button>
          <div className="flex items-center gap-2">
            {step < 3 && (
              <Button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed() || !selectedType}>
                {t("accounting.journal.dashboard.wizard.next")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            {step === 3 && (
              <>
                <Button type="button" variant="outline" onClick={() => handleSave("draft")}>
                  {t("accounting.journal.dashboard.wizard.saveDraft")}
                </Button>
                <Button type="button" onClick={() => handleSave("posted")}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {t("accounting.journal.dashboard.wizard.postTransaction")}
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }}>
          {step === 1 && <StepTypeSelection selected={selectedType} onSelect={handleTypeSelect} />}
          {step === 2 && selectedType && <StepTransactionForm type={selectedType} form={form} setForm={setForm} accounts={accounts} currencySymbol={activeCurrency.symbol} />}
          {step === 3 && selectedType && <StepReview type={selectedType} form={form} accounts={accounts} showAdvanced={showAdvanced} setShowAdvanced={setShowAdvanced} formatCurrency={formatCurrency} />}
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
}
