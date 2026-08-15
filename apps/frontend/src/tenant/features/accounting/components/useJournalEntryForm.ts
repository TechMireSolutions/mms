import { useState, useMemo, useEffect } from "react";
import { generateJERef, type Account, type JournalEntry, type FiscalYear } from '@/lib/data/accountingData';
import { hasFieldValue } from "@/lib/formCompleteness";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { journalEntryRecordSchema, todayISO } from "@mms/shared";
import type { DraftForm, DraftLine } from "./journalEntryFormTypes";

const EMPTY_LINE = (): DraftLine => ({ id: `l-${crypto.randomUUID()}`, account_id: "", debit: "", credit: "", description: "" });

interface UseJournalEntryFormOptions {
  accounts: Account[];
  entries: JournalEntry[];
  onSave: (entry: JournalEntry) => void | Promise<void>;
  initial?: JournalEntry | null;
  fiscalYears: FiscalYear[];
}

export function useJournalEntryForm({ accounts, entries, onSave, initial, fiscalYears }: UseJournalEntryFormOptions) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isEdit = !!initial?.id;
  const activeFiscalYear = (fiscalYears || []).find((fiscalYear) => fiscalYear.status === "active")?.label || "";

  const [form, setForm] = useState<DraftForm>(() => {
    return initial
      ? {
          ...initial,
          customData: initial.customData ?? {},
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
          fiscal_year: activeFiscalYear,
          customData: {},
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
          customData: initial.customData ?? {},
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
          fiscal_year: activeFiscalYear,
          customData: {},
          lines: [EMPTY_LINE(), EMPTY_LINE()],
          created_by: user?.name ?? ""
        };
    setForm(base);
    setErrors({});
  }, [initial, activeFiscalYear, user?.name]);

  const totalDebit = form.lines.reduce((sum, journalLine) => sum + (Number(journalLine.debit) || 0), 0);
  const totalCredit = form.lines.reduce((sum, journalLine) => sum + (Number(journalLine.credit) || 0), 0);
  const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const completeness = useMemo(() => {
    const total = 4;
    let filled = 0;
    if (hasFieldValue(form.date)) filled += 1;
    if (hasFieldValue(form.description)) filled += 1;
    if (form.lines.filter((line) => line.account_id).length >= 2) filled += 1;
    if (isBalanced) filled += 1;
    return Math.round((filled / total) * 100);
  }, [form.date, form.description, form.lines, isBalanced]);

  const updateLine = (lineIndex: number, field: keyof DraftLine, fieldValue: string | number) => {
    const lines = [...form.lines];
    lines[lineIndex] = { ...lines[lineIndex], [field]: fieldValue };
    if (field === "debit"  && fieldValue) lines[lineIndex].credit = "";
    if (field === "credit" && fieldValue) lines[lineIndex].debit  = "";
    setForm({ ...form, lines });
  };

  const addLine    = () => setForm({ ...form, lines: [...form.lines, EMPTY_LINE()] });
  const removeLine = (lineIndex: number) => { if (form.lines.length <= 2) return; setForm({ ...form, lines: form.lines.filter((_, currentIndex) => currentIndex !== lineIndex) }); };

  const toggleTag = (tag: string) => {
    const tags = form.tags?.includes(tag) ? form.tags.filter((existingTag) => existingTag !== tag) : [...(form.tags || []), tag];
    setForm({ ...form, tags });
  };

  const validate = (): Record<string, string> => {
    const validationErrors: Record<string, string> = {};
    if (!form.date) validationErrors.date = t("accounting.journal.form.errorDate");
    if (!form.description.trim()) validationErrors.description = t("accounting.journal.form.errorNarration");
    const filledLines = form.lines.filter((journalLine) => journalLine.account_id);
    if (filledLines.length < 2) validationErrors.lines = t("accounting.journal.form.errorLines");
    if (!isBalanced) validationErrors.balance = t("accounting.journal.form.errorBalance");
    form.lines.forEach((journalLine, lineIndex) => { if (!journalLine.account_id) validationErrors[`line${lineIndex}`] = t("accounting.journal.form.errorAccountRequired"); });

    return validationErrors;
  };

  const saveEntry = async (saveAs?: "draft" | "posted") => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) { setErrors(validationErrors); return; }
    const journalReference = isEdit ? form.ref : generateJERef(entries);
    const candidate = {
      ...form,
      id: isEdit ? form.id : `je${crypto.randomUUID()}`,
      ref: journalReference,
      status: saveAs || form.status,
      created_by: form.created_by || user?.name || "system",
      lines: form.lines.map((journalLine) => ({
        ...journalLine,
        debit: typeof journalLine.debit === "string" ? Number(journalLine.debit) || 0 : journalLine.debit,
        credit: typeof journalLine.credit === "string" ? Number(journalLine.credit) || 0 : journalLine.credit,
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

  const sortedAccounts = [...accounts].filter((account) => account.isActive !== false).sort((firstAccount, secondAccount) => firstAccount.code.localeCompare(secondAccount.code));

  const flattenedAccountOptions = sortedAccounts.map((account) => ({
    value: account.id,
    label: `${account.type}: ${account.code} – ${account.name}`
  }));

  const errorMessages = useMemo(
    () => Object.values(errors).filter(Boolean),
    [errors],
  );

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
