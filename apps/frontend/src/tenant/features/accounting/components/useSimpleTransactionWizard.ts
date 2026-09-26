import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { isJournalRefUnique, type Account, type FiscalYear, type JournalEntry } from "@/lib/data/accountingData";
import { isJournalEntryBalanced, journalEntryRecordSchema, todayISO, type AppTranslationKey } from "@mms/shared";
import { notify } from "@/lib/notify";
import {
  buildWizardFormState,
  resolveSimpleTransactionAccounts,
  validateWizardForm,
  TRANSACTION_GROUPS,
  type QuickActionType,
  type WizardFormState,
} from "./simpleTransactionWizardTypes";
import { parseMoneyInput } from "./simpleTransactionMoney";
import type { JournalEntrySave } from "./journalEntriesTypes";

export const LAST_TYPE_SESSION_KEY = "mms-wizard-last-type-id";

export interface UseSimpleTransactionWizardParams {
  open: boolean;
  accounts: Account[];
  entries: JournalEntry[];
  fiscalYears: FiscalYear[];
  onSave: JournalEntrySave;
  prefillType?: QuickActionType | null;
  prefillAmount?: string;
  prefillDescription?: string;
}

export function useSimpleTransactionWizard({
  open,
  accounts,
  entries,
  fiscalYears,
  onSave,
  prefillType,
  prefillAmount,
  prefillDescription,
}: UseSimpleTransactionWizardParams) {
  const { t } = useTranslation();
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
   * Latest chart/labels for the reset effect below. Read through a ref so background
   * refetches do not wipe active user input.
   */
  const resetContextRef = useRef({
    accounts,
    fiscalYearLabel: activeFiscalYearLabel,
    translate: (key: AppTranslationKey) => t(key) as string,
  });
  useEffect(() => {
    resetContextRef.current = {
      accounts,
      fiscalYearLabel: activeFiscalYearLabel,
      translate: (key: AppTranslationKey) => t(key) as string,
    };
  });

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
              if (item) {
                lastType = { ...item, groupKey: group.groupKey, color: group.color };
                break;
              }
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
      }
    } else if (!open && wasOpenRef.current) {
      // W3: capture draft when closing with unsaved data
      if (formRef.current.amount.trim() !== "") {
        draftRef.current = { form: formRef.current, type: selectedTypeRef.current, closedAt: Date.now() };
      }
    }
    wasOpenRef.current = open;
  }, [open, prefillType, prefillAmount, prefillDescription, t]);

  const parsedAmount = useMemo(() => parseMoneyInput(form.amount), [form.amount]);

  // S3: dynamic subtitle eliminates redundant inner heading
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
    try { sessionStorage.setItem(LAST_TYPE_SESSION_KEY, type.id); } catch { /* ignore */ }
    if (advance) setStep(2);
  };

  const isDuplicateRef = useMemo(() => {
    const trimmed = form.ref ? form.ref.trim() : "";
    if (!trimmed || !entries) return false;
    return !isJournalRefUnique(trimmed, entries);
  }, [form.ref, entries]);

  const canProceed = () => {
    if (step === 2) {
      if (isDuplicateRef) return false;
      return parsedAmount !== null && parsedAmount > 0;
    }
    return true;
  };

  const handleSave = async (status: "draft" | "posted", recordAnother = false) => {
    if (isSubmitting) return;
    const userRef = form.ref ? form.ref.trim() : "";
    if (userRef && !isJournalRefUnique(userRef, entries)) {
      notify.error(t("accounting.journal.dashboard.wizard.errorRefDuplicate"));
      return;
    }
    const validation = validateWizardForm(form, accounts);
    if (!validation.ok) { notify.error(t(validation.errorKey)); return; }
    if (!selectedType) { notify.error(t("accounting.journal.dashboard.wizard.errorSource")); return; }
    setSubmittingStatus(recordAnother ? "posted_and_new" : status);
    try {
      const description = form.description.trim() || t(selectedType.labelKey);
      const candidateTags = form.tags && form.tags.length > 0 ? form.tags : (selectedType.tag ? [selectedType.tag] : []);
      const candidate: JournalEntry = {
        id: `je${crypto.randomUUID()}`,
        // Blank → the server assigns the next voucher number on save.
        ref: userRef,
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

      const parsedEntry = journalEntryRecordSchema.safeParse(candidate);
      if (!parsedEntry.success || !isJournalEntryBalanced(parsedEntry.data.lines)) {
        notify.error(t("common.formPleaseFixErrors"));
        return;
      }
      const saved = await onSave(parsedEntry.data, recordAnother);
      if (recordAnother) {
        notify.success(`${saved?.ref || candidate.ref}: ${t("accounting.journal.dashboard.wizard.postMessage")}`);
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

  return {
    step,
    setStep,
    selectedType,
    showAdvanced,
    setShowAdvanced,
    amountTouched,
    setAmountTouched,
    submittingStatus,
    isSubmitting,
    isDuplicateRef,
    form,
    setForm,
    stepSubtitle,
    handleTypeSelect,
    canProceed,
    handleSave,
  };
}
