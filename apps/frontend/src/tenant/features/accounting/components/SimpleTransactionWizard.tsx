import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/FormModal";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/hooks/useTranslation";
import { generateJERef, type Account, type FiscalYear, type JournalEntry } from "@/lib/data/accountingData";
import { isJournalEntryBalanced, journalEntryRecordSchema, todayISO, type AppTranslationKey } from "@mms/shared";
import { notify } from "@/lib/notify";
import { StepTransactionForm } from "./SimpleTransactionStepForm";
import { StepReview } from "./SimpleTransactionStepReview";
import { StepTypeSelection } from "./SimpleTransactionStepTypeSelection";
import {
  buildWizardFormState,
  resolveSimpleTransactionAccounts,
  validateWizardForm,
  type QuickActionType,
  type WizardFormState,
} from "./simpleTransactionWizardTypes";
import { parseMoneyInput } from "./simpleTransactionMoney";

interface SimpleTransactionWizardProps {
  open: boolean;
  accounts: Account[];
  entries: JournalEntry[];
  fiscalYears: FiscalYear[];
  onSave: (entry: JournalEntry) => void | Promise<void>;
  onClose: () => void;
  prefillType?: QuickActionType | null;
}

export function SimpleTransactionWizard({ open, accounts, entries, fiscalYears, onSave, onClose, prefillType }: SimpleTransactionWizardProps) {
  const { t } = useTranslation();
  const { formatCurrency, activeCurrency } = useAccountingCurrency();
  const activeFiscalYearLabel = (fiscalYears || []).find((fiscalYear) => fiscalYear.status === "active")?.label || "";
  const [step, setStep] = useState(() => (prefillType ? 2 : 1));
  const [selectedType, setSelectedType] = useState<QuickActionType | null>(prefillType || null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<WizardFormState>(() =>
    buildWizardFormState(prefillType ?? null, accounts, { date: todayISO(), fiscalYearLabel: activeFiscalYearLabel }, (key) => t(key)),
  );

  /**
   * Latest chart/labels for the reset effect below. They are read through a ref
   * on purpose: a background refetch of the accounts (or a language switch) must
   * not wipe what the user is typing, only an actual opening of the dialog may.
   */
  const resetContextRef = useRef({ accounts, fiscalYearLabel: activeFiscalYearLabel, translate: (key: AppTranslationKey) => t(key) as string });
  useEffect(() => {
    resetContextRef.current = { accounts, fiscalYearLabel: activeFiscalYearLabel, translate: (key: AppTranslationKey) => t(key) as string };
  });

  /**
   * The dialog stays mounted between openings (the modal only unmounts its
   * portal), so without this every open after the first reused the previous
   * transaction: the wizard reopened on the review step with the old figures and
   * its Post button wrote a duplicate, permanently posted entry.
   */
  useEffect(() => {
    if (!open) return;
    const { accounts: liveAccounts, fiscalYearLabel, translate } = resetContextRef.current;
    setStep(prefillType ? 2 : 1);
    setSelectedType(prefillType ?? null);
    setShowAdvanced(false);
    setForm(buildWizardFormState(prefillType ?? null, liveAccounts, { date: todayISO(), fiscalYearLabel }, translate));
  }, [open, prefillType]);

  const parsedAmount = useMemo(() => parseMoneyInput(form.amount), [form.amount]);

  const handleTypeSelect = (type: QuickActionType) => {
    setSelectedType(type);
    setForm((previousForm) => ({
      ...previousForm,
      ...resolveSimpleTransactionAccounts(type, accounts),
      description: t(type.descriptionKey),
      tags: type.tag ? [type.tag] : [],
    }));
    setStep(2);
  };

  const canProceed = () => {
    if (step === 2) return parsedAmount !== null && parsedAmount > 0;
    return true;
  };

  const handleSave = async (status: "draft" | "posted") => {
    const validation = validateWizardForm(form, accounts);
    if (!validation.ok) { notify.error(t(validation.errorKey)); return; }
    if (!selectedType) { notify.error(t("accounting.journal.dashboard.wizard.errorSource")); return; }
    const generatedReference = generateJERef(entries);
    const description = form.description.trim() || t(selectedType.labelKey);
    const candidateTags = form.tags && form.tags.length > 0 ? form.tags : (selectedType.tag ? [selectedType.tag] : []);
    const candidate: JournalEntry = {
      id: `je${crypto.randomUUID()}`,
      ref: form.ref ? `${form.ref}` : generatedReference,
      date: form.date,
      description,
      status,
      created_by: "system",
      tags: candidateTags,
      attachments: [],
      fiscal_year: form.fiscal_year,
      fiscal_year_id: (fiscalYears || []).find((year) => year.label === form.fiscal_year || year.id === form.fiscal_year)?.id,
      simple_mode: true,
      transaction_type: selectedType.id,
      lines: [
        { id: `l-${crypto.randomUUID()}`, account_id: validation.debitAccount.id, debit: validation.amount, credit: 0, description },
        { id: `l-${crypto.randomUUID()}`, account_id: validation.creditAccount.id, debit: 0, credit: validation.amount, description },
      ],
    };
    /**
     * The same contract the API enforces, checked before anything is sent: a
     * rejected entry must never reach the append-only ledger. Balance is the
     * other half of that contract — `isJournalEntryBalanced` is the exact
     * function the server decides with.
     */
    const parsedEntry = journalEntryRecordSchema.safeParse(candidate);
    if (!parsedEntry.success || !isJournalEntryBalanced(parsedEntry.data.lines)) { notify.error(t("common.formPleaseFixErrors")); return; }
    await onSave(parsedEntry.data);
  };

  const steps = [
    { stepNumber: 1, label: t("accounting.journal.dashboard.wizard.stepSelect") },
    { stepNumber: 2, label: t("accounting.journal.dashboard.wizard.stepDetails") },
    { stepNumber: 3, label: t("accounting.journal.dashboard.wizard.stepReview") },
  ];

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={t("accounting.journal.dashboard.recordTransaction")}
      subtitle={t("accounting.journal.dashboard.subtitleSimple")}
      size="lg"
      panelClassName="max-h-modal-xl"
      hideFooter
      headerExtra={
        <nav aria-label={t("accounting.journal.dashboard.wizard.stepsAria")} className="flex items-center gap-2">
          {steps.map((stepDefinition, index) => (
            <React.Fragment key={stepDefinition.stepNumber}>
              <div className="flex items-center gap-1.5">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  step > stepDefinition.stepNumber ? "bg-success text-white" : step === stepDefinition.stepNumber ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`} aria-current={step === stepDefinition.stepNumber ? "step" : undefined}>
                  {step > stepDefinition.stepNumber ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : stepDefinition.stepNumber}
                </div>
                <span className={`hidden text-xs font-semibold sm:block ${step === stepDefinition.stepNumber ? "text-foreground" : "text-muted-foreground"}`}>{stepDefinition.label}</span>
              </div>
              {index < steps.length - 1 && <div className={`h-0.5 flex-1 rounded-full transition-all ${step > stepDefinition.stepNumber ? "bg-success" : "bg-border"}`} aria-hidden="true" />}
            </React.Fragment>
          ))}
        </nav>
      }
    >
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }}>
            {step === 1 && <StepTypeSelection selected={selectedType} onSelect={handleTypeSelect} />}
            {step === 2 && selectedType && (
              <StepTransactionForm
                type={selectedType}
                form={form}
                setForm={setForm}
                accounts={accounts}
                currencySymbol={activeCurrency.symbol}
                fiscalYears={fiscalYears}
              />
            )}
            {step === 3 && selectedType && <StepReview type={selectedType} form={form} accounts={accounts} showAdvanced={showAdvanced} setShowAdvanced={setShowAdvanced} formatCurrency={formatCurrency} />}
          </motion.div>
        </AnimatePresence>
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="outline" onClick={() => step > 1 ? setStep(step - 1) : onClose()}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {step === 1 ? t("accounting.journal.dashboard.wizard.cancel") : t("accounting.journal.dashboard.wizard.back")}
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {step < 3 && (
              <Button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed() || !selectedType}>
                {t("accounting.journal.dashboard.wizard.next")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
            {step === 3 && (
              <>
                <Button type="button" variant="outline" onClick={() => { void handleSave("draft"); }}>
                  {t("accounting.journal.dashboard.wizard.saveDraft")}
                </Button>
                <Button type="button" onClick={() => { void handleSave("posted"); }}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {t("accounting.journal.dashboard.wizard.postTransaction")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </FormModal>
  );
}
