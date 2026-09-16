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
  TRANSACTION_GROUPS,
  type QuickActionType,
  type WizardFormState,
} from "./simpleTransactionWizardTypes";
import { parseMoneyInput } from "./simpleTransactionMoney";

const LAST_TYPE_SESSION_KEY = "mms-wizard-last-type-id";

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
  const [amountTouched, setAmountTouched] = useState(false);
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
  /** W3: stash an in-progress draft when the dialog is dismissed mid-entry */
  const draftRef = useRef<{ form: WizardFormState; type: QuickActionType | null; closedAt: number } | null>(null);
  /** W3/S4: stable snapshot of live state for reading inside close-transition effect */
  const formRef = useRef(form);
  const selectedTypeRef = useRef(selectedType);
  useEffect(() => { formRef.current = form; });
  useEffect(() => { selectedTypeRef.current = selectedType; });
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const { accounts: liveAccounts, fiscalYearLabel, translate } = resetContextRef.current;

      // W3: offer draft restoration if the user closed mid-entry within 30 s
      const draft = draftRef.current;
      if (!prefillType && draft && draft.form.amount.trim() !== "" && Date.now() - draft.closedAt < 30_000) {
        const snapForm = draft.form;
        const snapType = draft.type;
        notify.archivedWithUndo(
          t("accounting.journal.dashboard.wizard.restoreDraft"),
          () => {
            if (snapType) {
              setSelectedType(snapType);
              setStep(2);
            }
            setForm(snapForm);
          },
          { undoLabel: t("accounting.journal.dashboard.wizard.restoreAction"), duration: 8000 },
        );
      }
      draftRef.current = null;

      setStep(prefillType ? 2 : 1);
      setSelectedType(prefillType ?? null);
      setShowAdvanced(false);
      setAmountTouched(false);

      // S4: pre-select last used type (keyboard users see it highlighted on step 1)
      let lastType: QuickActionType | null = null;
      if (!prefillType) {
        try {
          const lastId = sessionStorage.getItem(LAST_TYPE_SESSION_KEY);
          if (lastId) {
            for (const group of TRANSACTION_GROUPS) {
              const item = group.items.find((i) => i.id === lastId);
              if (item) { lastType = { ...item, groupKey: group.groupKey, color: group.color }; break; }
            }
          }
        } catch { /* sessionStorage unavailable */ }
      }

      setForm(
        buildWizardFormState(
          prefillType ?? lastType,
          liveAccounts,
          { date: todayISO(), fiscalYearLabel },
          translate,
          { amount: prefillAmount, description: prefillDescription },
        ),
      );
      if (lastType && !prefillType) {
        setSelectedType(lastType);
        // Stay on step 1 — user must press Next to confirm
      }
    } else if (!open && wasOpenRef.current) {
      // W3: capture draft when closing with unsaved data
      if (formRef.current.amount.trim() !== "") {
        draftRef.current = { form: formRef.current, type: selectedTypeRef.current, closedAt: Date.now() };
      }
    }
    wasOpenRef.current = open;
  }, [open, prefillType, prefillAmount, prefillDescription]);

  const parsedAmount = useMemo(() => parseMoneyInput(form.amount), [form.amount]);

  // S3: dynamic subtitle eliminates the redundant inner heading in StepTypeSelection
  const stepSubtitle = useMemo(() => {
    if (step === 2 && selectedType) return t(selectedType.labelKey);
    if (step === 3) return t("accounting.journal.dashboard.wizard.reviewTitle");
    return t("accounting.journal.dashboard.subtitleSimple");
  }, [step, selectedType, t]);

  const handleTypeSelect = (type: QuickActionType, advance: boolean) => {
    setSelectedType(type);
    setForm((previousForm) => ({
      ...previousForm,
      ...resolveSimpleTransactionAccounts(type, accounts),
      description: t(type.descriptionKey),
      tags: type.tag ? [type.tag] : [],
    }));
    // S4: remember last used type for the next session
    try { sessionStorage.setItem(LAST_TYPE_SESSION_KEY, type.id); } catch { /* ignore */ }
    if (advance) setStep(2);
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
        setAmountTouched(false);
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
      subtitle={stepSubtitle}
      size="lg"
      panelClassName="max-h-modal-xl"
      hideFooter
      headerExtra={
        <SimpleTransactionWizardSteps
          currentStep={step}
          onSelectStep={(n) => {
            if (n > step && !canProceed()) return;
            setStep(n);
          }}
        />
      }
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
                amountTouched={amountTouched}
                onAmountTouched={() => setAmountTouched(true)}
                onChangeType={() => setStep(1)}
                onProceed={() => {
                  if (canProceed()) setStep(3);
                }}
              />
            )}
            {step === 3 && selectedType && (
              <StepReview
                type={selectedType}
                form={form}
                accounts={accounts}
                showAdvanced={showAdvanced}
                setShowAdvanced={setShowAdvanced}
                formatCurrency={formatCurrency}
                onEditDetails={() => setStep(2)}
              />
            )}
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
