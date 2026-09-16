import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FormModal } from "@/components/ui/FormModal";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/hooks/useTranslation";
import { generateJERef, type Account, type FiscalYear, type JournalEntry } from "@/lib/data/accountingData";
import { isJournalEntryBalanced, journalEntryRecordSchema, todayISO, type AppTranslationKey } from "@mms/shared";
import { notify } from "@/lib/notify";
import { SimpleTransactionWizardFooter } from "./SimpleTransactionWizardFooter";
import { SimpleTransactionWizardSteps } from "./SimpleTransactionWizardSteps";
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
  onSave: (entry: JournalEntry, stayOpen?: boolean) => void | Promise<void>;
  onClose: () => void;
  prefillType?: QuickActionType | null;
  prefillAmount?: string;
  prefillDescription?: string;
}

export function SimpleTransactionWizard({
  open,
  accounts,
  entries,
  fiscalYears,
  onSave,
  onClose,
  prefillType,
  prefillAmount,
  prefillDescription,
}: SimpleTransactionWizardProps) {
  const { t } = useTranslation();
  const { formatCurrency, activeCurrency } = useAccountingCurrency();
  const activeFiscalYearLabel = (fiscalYears || []).find((fiscalYear) => fiscalYear.status === "active")?.label || "";
  const [step, setStep] = useState(() => (prefillType ? 2 : 1));
  const [selectedType, setSelectedType] = useState<QuickActionType | null>(prefillType || null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState<"draft" | "posted" | "posted_and_new" | null>(null);
  const isSubmitting = submittingStatus !== null;
  const [form, setForm] = useState<WizardFormState>(() =>
    buildWizardFormState(
      prefillType ?? null,
      accounts,
      { date: todayISO(), fiscalYearLabel: activeFiscalYearLabel },
      (key) => t(key),
      { amount: prefillAmount, description: prefillDescription },
    ),
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
   *
   * Guarded with `wasOpenRef` so the reset only runs when transitioning from
   * closed to open, never while the user is actively typing or editing.
   */
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const { accounts: liveAccounts, fiscalYearLabel, translate } = resetContextRef.current;
      setStep(prefillType ? 2 : 1);
      setSelectedType(prefillType ?? null);
      setShowAdvanced(false);
      setForm(
        buildWizardFormState(
          prefillType ?? null,
          liveAccounts,
          { date: todayISO(), fiscalYearLabel },
          translate,
          { amount: prefillAmount, description: prefillDescription },
        ),
      );
    }
    wasOpenRef.current = open;
  }, [open, prefillType, prefillAmount, prefillDescription]);

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

  const handleSave = async (status: "draft" | "posted", recordAnother = false) => {
    if (isSubmitting) return;
    const validation = validateWizardForm(form, accounts);
    if (!validation.ok) { notify.error(t(validation.errorKey)); return; }
    if (!selectedType) { notify.error(t("accounting.journal.dashboard.wizard.errorSource")); return; }
    setSubmittingStatus(recordAnother ? "posted_and_new" : status);
    try {
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
      await onSave(parsedEntry.data, recordAnother);
      if (recordAnother) {
        notify.success(`${candidate.ref}: ${t("accounting.journal.dashboard.wizard.postMessage")}`);
        setForm((prev) => ({
          ...prev,
          amount: "",
          ref: "",
          description: t(selectedType.descriptionKey),
        }));
        setStep(2);
      }
    } catch (error) {
      notify.error(error instanceof Error ? error.message : t("accounting.settings.saveEntriesFailed"));
    } finally {
      setSubmittingStatus(null);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={t("accounting.journal.dashboard.recordTransaction")}
      subtitle={t("accounting.journal.dashboard.subtitleSimple")}
      size="lg"
      panelClassName="max-h-modal-xl"
      hideFooter
      headerExtra={<SimpleTransactionWizardSteps currentStep={step} onSelectStep={setStep} />}
    >
      <div
        className="space-y-4"
        onKeyDown={(event) => {
          if (step === 3 && event.key === "Enter" && !isSubmitting && canProceed()) {
            event.preventDefault();
            void handleSave("posted");
          }
        }}
      >
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
                entries={entries}
                formatCurrency={formatCurrency}
                onChangeType={() => setStep(1)}
                onProceed={() => {
                  if (canProceed()) setStep(3);
                }}
              />
            )}
            {step === 3 && selectedType && <StepReview type={selectedType} form={form} accounts={accounts} showAdvanced={showAdvanced} setShowAdvanced={setShowAdvanced} formatCurrency={formatCurrency} />}
          </motion.div>
        </AnimatePresence>
        <SimpleTransactionWizardFooter
          step={step}
          canProceed={canProceed()}
          hasSelectedType={Boolean(selectedType)}
          isSubmitting={isSubmitting}
          submittingStatus={submittingStatus}
          onStepChange={setStep}
          onClose={onClose}
          onSave={handleSave}
        />
      </div>
    </FormModal>
  );
}
