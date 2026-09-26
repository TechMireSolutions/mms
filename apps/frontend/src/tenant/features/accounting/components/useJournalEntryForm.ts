import { useState, useEffect } from "react";
import { generateJERef, isJournalRefUnique, type Account, type JournalEntry, type FiscalYear, type AccountingSettings } from '@/lib/data/accountingData';
import { hasFieldValue } from "@/lib/formCompleteness";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { isJournalEntryBalanced, journalEntryRecordSchema, moneyToCents, todayISO } from "@mms/shared";
import type { DraftForm, DraftLine } from "./journalEntryFormTypes";

const EMPTY_LINE = (): DraftLine => ({ id: `l-${crypto.randomUUID()}`, account_id: "", debit: "", credit: "", description: "" });

interface UseJournalEntryFormOptions {
  accounts: Account[];
  entries: JournalEntry[];
  onSave: (entry: JournalEntry) => void | Promise<void>;
  initial?: JournalEntry | null;
  fiscalYears: FiscalYear[];
  settings?: Partial<AccountingSettings>;
}

export function useJournalEntryForm({ accounts, entries, onSave, initial, fiscalYears, settings }: UseJournalEntryFormOptions) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isEdit = !!initial?.id;
  const activeFiscalYearRecord = (fiscalYears || []).find((fiscalYear) => fiscalYear.status === "active");
  const activeFiscalYear = activeFiscalYearRecord?.id || "";

  const [form, setForm] = useState<DraftForm>(() => {
    return initial
      ? {
          ...initial,
          lines: initial.lines.map((entryLine) => ({ ...entryLine, debit: entryLine.debit || "", credit: entryLine.credit || "" }))
        }
      : {
          id: "",
          ref: "",
          date: todayISO(),
          description: "",
          status: "draft",
          tags: [],
          attachments: [],
          fiscal_year: activeFiscalYearRecord?.label || "",
          fiscal_year_id: activeFiscalYear,
          lines: [EMPTY_LINE(), EMPTY_LINE()],
          created_by: user?.name ?? ""
        };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const base: DraftForm = initial
      ? {
          ...initial,
          lines: initial.lines.map((entryLine) => ({ ...entryLine, debit: entryLine.debit || "", credit: entryLine.credit || "" }))
        }
      : {
          id: "",
          ref: "",
          date: todayISO(),
          description: "",
          status: "draft",
          tags: [],
          attachments: [],
          fiscal_year: activeFiscalYearRecord?.label || "",
          fiscal_year_id: activeFiscalYear,
          lines: [EMPTY_LINE(), EMPTY_LINE()],
          created_by: user?.name ?? ""
        };
    setForm(base);
    setErrors({});
  }, [initial, activeFiscalYear, activeFiscalYearRecord?.label, user?.name]);

function parseLineAmount(val: string | number | null | undefined): number {
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  if (typeof val !== "string") return 0;
  const cleaned = val.replace(/,/g, "").trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

  // Money is summed through integer cents (and converted once) so the totals
  // shown beside the lines are the same figures the ledger posts, with no float
  // artefacts such as 0.30000000000000004.
  const totalDebit = moneyToCents(form.lines.reduce((sum, journalLine) => sum + parseLineAmount(journalLine.debit), 0)) / 100;
  const totalCredit = moneyToCents(form.lines.reduce((sum, journalLine) => sum + parseLineAmount(journalLine.credit), 0)) / 100;
  /**
   * Balanced by the same rule the server enforces (`isJournalEntryBalanced`:
   * exact integer cents, at least two lines, each single-sided) instead of a
   * second, weaker float comparison with a 0.01 tolerance. Two definitions of
   * "balanced" meant the form could accept what the API then rejected with a
   * generic error.
   */
  const isBalanced = isJournalEntryBalanced(
    form.lines.map((journalLine) => ({
      debit: parseLineAmount(journalLine.debit),
      credit: parseLineAmount(journalLine.credit),
    })),
  );

  const completeness = (() => {
    const total = 4;
    let filled = 0;
    if (hasFieldValue(form.date)) filled += 1;
    if (hasFieldValue(form.description)) filled += 1;
    if (form.lines.filter((line) => line.account_id).length >= 2) filled += 1;
    if (isBalanced) filled += 1;
    return Math.round((filled / total) * 100);
  })();

  const updateLine = (lineIndex: number, field: keyof DraftLine, fieldValue: string | number) => {
    setForm((prev) => {
      const lines = [...prev.lines];
      lines[lineIndex] = { ...lines[lineIndex], [field]: fieldValue };
      if (field === "debit" && fieldValue) lines[lineIndex].credit = "";
      if (field === "credit" && fieldValue) lines[lineIndex].debit = "";
      return { ...prev, lines };
    });
  };

  const addLine = () => {
    const unbalance = Math.round((totalDebit - totalCredit) * 100) / 100;
    const newLine = EMPTY_LINE();
    if (unbalance > 0) {
      newLine.credit = unbalance.toFixed(2);
    } else if (unbalance < 0) {
      newLine.debit = Math.abs(unbalance).toFixed(2);
    }
    setForm((prev) => ({ ...prev, lines: [...prev.lines, newLine] }));
  };
  const removeLine = (lineIndex: number) => {
    if (form.lines.length <= 2) return;
    setForm((prev) => ({ ...prev, lines: prev.lines.filter((_, currentIndex) => currentIndex !== lineIndex) }));
  };

  const toggleTag = (tag: string) => {
    setForm((prev) => {
      const tags = prev.tags?.includes(tag) ? prev.tags.filter((existingTag) => existingTag !== tag) : [...(prev.tags || []), tag];
      return { ...prev, tags };
    });
  };

  const validate = (targetStatus: "draft" | "posted"): Record<string, string> => {
    const validationErrors: Record<string, string> = {};
    if (!form.date) validationErrors.date = t("accounting.journal.form.errorDate");
    if (!form.description.trim()) validationErrors.description = t("accounting.journal.form.errorNarration");
    const trimmedRef = form.ref?.trim();
    if (trimmedRef && !isJournalRefUnique(trimmedRef, entries, form.id)) {
      validationErrors.ref = t("accounting.journal.form.errorRefDuplicate");
    }
    const filledLines = form.lines.filter((journalLine) => journalLine.account_id);
    if (filledLines.length < 2) validationErrors.lines = t("accounting.journal.form.errorLines");
    /**
     * Balance is a **posted**-entry invariant, matching the server
     * (`prepareJournalEntryForPersist` rejects only `status === 'posted'`
     * unbalanced writes). Requiring it unconditionally made the "Save draft"
     * control unusable for a work-in-progress entry, so users invented equal
     * placeholder amounts that later posted as real ledger figures.
     */
    if (targetStatus === "posted" && !isBalanced) validationErrors.balance = t("accounting.journal.form.errorBalance");
    form.lines.forEach((journalLine, lineIndex) => { if (!journalLine.account_id) validationErrors[`line${lineIndex}`] = t("accounting.journal.form.errorAccountRequired"); });

    return validationErrors;
  };

  const saveEntry = async (saveAs?: "draft" | "posted") => {
    const targetStatus = saveAs ?? form.status;
    const validationErrors = validate(targetStatus);
    if (Object.keys(validationErrors).length) { setErrors(validationErrors); return; }
    const trimmedRef = form.ref?.trim();
    const journalReference = trimmedRef || (isEdit ? form.ref : generateJERef(entries, settings, form.date));
    if (!isJournalRefUnique(journalReference, entries, form.id)) {
      setErrors({ ref: t("accounting.journal.form.errorRefDuplicate") });
      return;
    }
    const candidate = {
      ...form,
      id: isEdit ? form.id : `je${crypto.randomUUID()}`,
      ref: journalReference,
      status: targetStatus,
      created_by: form.created_by || user?.name || "system",
      lines: form.lines.map((journalLine) => ({
        ...journalLine,
        debit: parseLineAmount(journalLine.debit),
        credit: parseLineAmount(journalLine.credit),
      })),
    };
    const parsed = journalEntryRecordSchema.safeParse(candidate);
    if (!parsed.success) {
      setErrors({ schema: t("common.formPleaseFixErrors") });
      return;
    }
    setSubmitting(true);
    try {
      await onSave(parsed.data);
    } finally {
      setSubmitting(false);
    }
  };

  const sortedAccounts = accounts
    .filter((account) => account.isActive !== false)
    .toSorted((firstAccount, secondAccount) => firstAccount.code.localeCompare(secondAccount.code));

  const flattenedAccountOptions = sortedAccounts.map((account) => ({
    value: account.id,
    label: `${account.type}: ${account.code} – ${account.name}`
  }));

  const errorMessages = (() => Object.values(errors).filter(Boolean))();

  return {
    t,
    isEdit,
    activeFiscalYear,
    form,
    setForm,
    errors,
    submitting,
    totalDebit,
    totalCredit,
    isBalanced,
    completeness,
    updateLine,
    addLine,
    removeLine,
    toggleTag,
    saveEntry,
    flattenedAccountOptions,
    errorMessages,
  };
}
