import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormModal } from "@/components/ui/FormModal";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/hooks/useTranslation";
import { generateJERef, type Account, type FiscalYear, type JournalEntry } from "@/lib/data/accountingData";
import { todayISO } from "@mms/shared";
import { StepTransactionForm } from "./SimpleTransactionStepForm";
import { StepReview } from "./SimpleTransactionStepReview";
import { StepTypeSelection } from "./SimpleTransactionStepTypeSelection";
import type { QuickActionType, WizardFormState } from "./simpleTransactionWizardTypes";

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
  const [step, setStep] = useState(prefillType ? 2 : 1);
  const [selectedType, setSelectedType] = useState<QuickActionType | null>(prefillType || null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const activeFiscalYearLabel = (fiscalYears || []).find((fiscalYear) => fiscalYear.status === "active")?.label || "";

  const [form, setForm] = useState<WizardFormState>({
    date: todayISO(),
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

  const handleSave = async (status: "draft" | "posted") => {
    const validationError = validate();
    if (validationError) { alert(validationError); return; }
    const amount = parseFloat(form.amount);
    const generatedReference = generateJERef(entries);
    const description = form.description || t(selectedType!.labelKey);
    await onSave({
      id: `je${Date.now()}`,
      ref: form.ref ? `${form.ref}` : generatedReference,
      date: form.date,
      description,
      status,
      created_by: "system",
      tags: [selectedType!.tag],
      attachments: [],
      fiscal_year: form.fiscal_year,
      simple_mode: true,
      transaction_type: selectedType!.id,
      lines: [
        { id: `l${Date.now()}a`, account_id: form.debitAcc, debit: amount, credit: 0, description },
        { id: `l${Date.now()}b`, account_id: form.creditAcc, debit: 0, credit: amount, description },
      ],
    });
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
      panelClassName="max-h-[92vh]"
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
            {step === 2 && selectedType && <StepTransactionForm type={selectedType} form={form} setForm={setForm} accounts={accounts} currencySymbol={activeCurrency.symbol} />}
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
