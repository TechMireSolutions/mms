import React, { useState, useMemo } from "react";
import { Tag, BookOpen } from "lucide-react";
import { JOURNAL_TAGS, generateJERef, type Account, type JournalEntry, type FiscalYear } from '@/lib/data/accountingData';
import { DatePicker } from "@/components/ui/DatePicker";
import { FormModal } from "@/components/ui/FormModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Card } from "@/components/ui/card";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { hasFieldValue } from "@/lib/formCompleteness";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import { useTranslation } from "@/hooks/useTranslation";
import { type AppTranslationKey, todayISO } from "@mms/shared";
import { JournalEntryLinesEditor } from "./JournalEntryLinesEditor";
import type { DraftForm, DraftLine } from "./journalEntryFormTypes";

const EMPTY_LINE = (): DraftLine => ({ id: `l${Date.now()}_${Math.random()}`, account_id: "", debit: "", credit: "", description: "" });

interface JournalEntryFormProps {
  accounts: Account[];
  entries: JournalEntry[];
  onSave: (entry: JournalEntry) => void | Promise<void>;
  onClose: () => void;
  initial?: JournalEntry | null;
  fiscalYears: FiscalYear[];
}

export function JournalEntryForm({ accounts, entries, onSave, onClose, initial, fiscalYears }: JournalEntryFormProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();
  const isEdit = !!initial?.id;
  const activeFiscalYear = (fiscalYears || []).find((fiscalYear) => fiscalYear.status === "active")?.label || "";

  const [form, setForm] = useState<DraftForm>(
    initial
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
          fiscal_year: activeFiscalYear,
          lines: [EMPTY_LINE(), EMPTY_LINE()],
          created_by: "Admin"
        }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Re-sync draft when editing another journal entry record
  React.useEffect(() => {
    setForm(
      initial
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
            fiscal_year: activeFiscalYear,
            lines: [EMPTY_LINE(), EMPTY_LINE()],
            created_by: "Admin"
          }
    );
    setErrors({});
  }, [initial, activeFiscalYear]);

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
    setSubmitting(true);
    try {
      await onSave({
        ...form,
        id: isEdit ? form.id : `je${Date.now()}`,
        ref: journalReference,
        status: saveAs || form.status,
        created_by: form.created_by || "system",
        lines: form.lines.map((journalLine) => ({
          ...journalLine,
          debit: typeof journalLine.debit === "string" ? parseFloat(journalLine.debit) || 0 : journalLine.debit,
          credit: typeof journalLine.credit === "string" ? parseFloat(journalLine.credit) || 0 : journalLine.credit,
        })),
      } as JournalEntry);
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

  return (
    <FormModal
      open
      onClose={onClose}
      title={isEdit ? t("accounting.journal.form.editTitle") : t("accounting.journal.form.newTitle")}
      subtitle={activeFiscalYear || undefined}
      icon={BookOpen}
      size="xl"
      tall
      progress={completeness}
      progressLabel={t("common.formProgress")}
      cancelLabel={t("accounting.journal.form.cancel")}
      saveLabel={t("accounting.journal.form.postEntry")}
      onSave={() => { void saveEntry("posted"); }}
      saving={submitting}
      saveDisabled={!isBalanced || submitting}
      error={errorMessages}
      footerStart={
        <Button type="button" variant="secondary" disabled={submitting} onClick={() => { void saveEntry("draft"); }}>
          {t("accounting.journal.form.saveDraft")}
        </Button>
      }
    >
        <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
          {/* Header fields */}
          <Card accentColor="primary" className="p-0">
            <fieldset className="p-5.5 px-6.5 pb-6 space-y-4 border-0 m-0 text-start">
            <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-4">
              <BookOpen className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("accounting.journal.form.entryDetails")}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="je-date" className={FORM_LABEL}>{t("accounting.journal.form.dateLabel")}</label>
                <DatePicker
                  id="je-date"
                  value={form.date}
                  onChange={(dateValue) => setForm({ ...form, date: dateValue })}
                  required
                />
                {errors.date && <p className="text-xs text-destructive mt-1" role="alert">{errors.date}</p>}
              </div>
              <div>
                <label htmlFor="journal-entry-financial-year" className={FORM_LABEL}>{t("accounting.journal.form.financialYear")}</label>
                <FormSelect
                  id="journal-entry-financial-year"
                  value={form.fiscal_year || ""}
                  onChange={(fiscalYearValue) => setForm({ ...form, fiscal_year: fiscalYearValue })}
                  placeholder={t("accounting.journal.form.none")}
                  options={(fiscalYears || []).map((fiscalYear) => fiscalYear.label)}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="journal-entry-description" className={FORM_LABEL}>{t("accounting.journal.form.narrationLabel")}</label>
                <div className="relative flex items-center group/input">
                  <BookOpen className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                  <Input
                    id="journal-entry-description"
                    className="ps-10"
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    placeholder={t("accounting.journal.form.narrationPlaceholder")}
                    aria-invalid={!!errors.description}
                  />
                </div>
                {errors.description && <p className="text-xs text-destructive mt-1" role="alert">{errors.description}</p>}
              </div>
            </div>
            </fieldset>
          </Card>

          {/* Tags */}
          <Card accentColor="info" className="p-0">
            <fieldset className="p-5.5 px-6.5 pb-6 border-0 m-0 text-start">
            <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-3">
              <Tag className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("accounting.journal.form.tagsTitle")}</h3>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
                  {JOURNAL_TAGS.map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  variant={form.tags?.includes(tag) ? "default" : "outline"}
                  onClick={() => toggleTag(tag)}
                  aria-pressed={form.tags?.includes(tag)}
                  className="min-h-11 px-2.5 py-1 rounded-full text-xs font-semibold"
                >
                  {t(`accounting.journal.tag.${tag.toLowerCase()}` as AppTranslationKey)}
                </Button>
              ))}
            </div>
            </fieldset>
          </Card>

          <JournalEntryLinesEditor
            accounts={accounts}
            accountOptions={flattenedAccountOptions}
            errors={errors}
            lines={form.lines}
            totalDebit={totalDebit}
            totalCredit={totalCredit}
            isBalanced={isBalanced}
            formatCurrency={formatCurrency}
            onAddLine={addLine}
            onRemoveLine={removeLine}
            onUpdateLine={updateLine}
          />

        </form>
    </FormModal>
  );
}
