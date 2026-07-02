import React, { useState, useMemo } from "react";
import { Plus, Trash2, AlertCircle, CheckCircle2, Tag, BookOpen } from "lucide-react";
import { ACCOUNT_TYPE_META, JOURNAL_TAGS, generateJERef, Account, JournalEntry, FiscalYear, JournalLine } from '@/lib/data/accountingData';
import { DatePicker } from "@/components/ui/DatePicker";
import { FormModal } from "@/components/ui/FormModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { hasFieldValue } from "@/lib/formCompleteness";

interface DraftLine extends Omit<JournalLine, "debit" | "credit"> {
  debit: string | number;
  credit: string | number;
}

interface DraftForm extends Omit<JournalEntry, "lines"> {
  lines: DraftLine[];
}

const EMPTY_LINE = (): DraftLine => ({ id: `l${Date.now()}_${Math.random()}`, account_id: "", debit: "", credit: "", description: "" });

interface JournalEntryFormProps {
  accounts: Account[];
  entries: JournalEntry[];
  onSave: (entry: JournalEntry) => void;
  onClose: () => void;
  initial?: JournalEntry | null;
  fiscalYears: FiscalYear[];
}

/**
 * JournalEntryForm component.
 * 
 * Form for creating or editing a journal entry.
 * 
 * @param {JournalEntryFormProps} props - The component props.
 * @returns {React.ReactElement}
 */
export function JournalEntryForm({ accounts, entries, onSave, onClose, initial, fiscalYears }: JournalEntryFormProps) {
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
          date: new Date().toISOString().slice(0, 10),
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
    if (!form.date) validationErrors.date = "Date is required";
    if (!form.description.trim()) validationErrors.description = "Narration is required";
    const filledLines = form.lines.filter((journalLine) => journalLine.account_id);
    if (filledLines.length < 2) validationErrors.lines = "At least 2 account lines are required";
    if (!isBalanced) validationErrors.balance = "Debits must equal Credits";
    form.lines.forEach((journalLine, lineIndex) => { if (!journalLine.account_id) validationErrors[`line${lineIndex}`] = "Account required"; });
    return validationErrors;
  };

  const saveEntry = (saveAs?: "draft" | "posted") => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) { setErrors(validationErrors); return; }
    const journalReference = isEdit ? form.ref : generateJERef(entries);
    onSave({
      ...form,
      id: isEdit ? form.id : `je${Date.now()}`,
      ref: journalReference,
      status: saveAs || form.status,
      created_by: "Admin",
      lines: form.lines.map((journalLine) => ({
        ...journalLine,
        debit: typeof journalLine.debit === "string" ? parseFloat(journalLine.debit) || 0 : journalLine.debit,
        credit: typeof journalLine.credit === "string" ? parseFloat(journalLine.credit) || 0 : journalLine.credit,
      })),
    } as JournalEntry);
  };

  const sortedAccounts = [...accounts].filter((account) => account.isActive !== false).sort((firstAccount, secondAccount) => firstAccount.code.localeCompare(secondAccount.code));

  // Group accounts for optgroup
  const accountGroups: Record<string, Account[]> = {};
  sortedAccounts.forEach((account) => {
    if (!accountGroups[account.type]) accountGroups[account.type] = [];
    accountGroups[account.type].push(account);
  });

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
      title={isEdit ? "Edit Journal Entry" : "New Journal Entry"}
      subtitle={activeFiscalYear || undefined}
      icon={BookOpen}
      size="xl"
      tall
      progress={completeness}
      progressLabel="Progress"
      cancelLabel="Cancel"
      saveLabel="Post Entry"
      onSave={() => saveEntry("posted")}
      saveDisabled={!isBalanced}
      error={errorMessages}
      footerStart={
        <Button type="button" variant="secondary" onClick={() => saveEntry("draft")}>
          Save as Draft
        </Button>
      }
    >
        <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
          {/* Header fields */}
          <fieldset className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5.5 px-6.5 pb-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300 border-0 m-0">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/60 transition-colors group-hover:bg-primary" />
            <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-4">
              <BookOpen className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Entry Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="je-date" className={FORM_LABEL}>Date *</label>
                <DatePicker
                  id="je-date"
                  value={form.date}
                  onChange={(dateValue) => setForm({ ...form, date: dateValue })}
                  required
                />
                {errors.date && <p className="text-xs text-destructive mt-1" role="alert">{errors.date}</p>}
              </div>
              <div>
                <label htmlFor="journal-entry-financial-year" className={FORM_LABEL}>Financial Year</label>
                <FormSelect
                  id="journal-entry-financial-year"
                  value={form.fiscal_year || ""}
                  onChange={(fiscalYearValue) => setForm({ ...form, fiscal_year: fiscalYearValue })}
                  placeholder="— None —"
                  options={(fiscalYears || []).map((fiscalYear) => fiscalYear.label)}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="journal-entry-description" className={FORM_LABEL}>Narration / Description *</label>
                <div className="relative flex items-center group/input">
                  <BookOpen className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                  <Input
                    id="journal-entry-description"
                    className="pl-10"
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    placeholder="e.g. Student fee collection for Spring 2026…"
                    aria-invalid={!!errors.description}
                  />
                </div>
                {errors.description && <p className="text-xs text-destructive mt-1" role="alert">{errors.description}</p>}
              </div>
            </div>
          </fieldset>

          {/* Tags */}
          <fieldset className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5.5 px-6.5 pb-6 shadow-sm hover:shadow-md transition-all duration-300 border-0 m-0">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500/60 transition-colors group-hover:bg-indigo-500" />
            <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-3">
              <Tag className="w-4 h-4 text-indigo-500/70 group-hover:text-indigo-500 transition-colors" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Journal Tags</h3>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {JOURNAL_TAGS.map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  variant={form.tags?.includes(tag) ? "default" : "outline"}
                  onClick={() => toggleTag(tag)}
                  aria-pressed={form.tags?.includes(tag)}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold h-auto"
                >
                  {tag}
                </Button>
              ))}
            </div>
          </fieldset>

          {/* Lines */}
          <fieldset className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-5.5 px-6.5 pb-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300 border-0 m-0">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500/60 transition-colors group-hover:bg-emerald-500" />
            <div className="flex items-center justify-between pb-1.5 border-b border-border/40 mb-2">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-emerald-500/70 group-hover:text-emerald-500 transition-colors" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Journal Lines *</h3>
              </div>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={addLine}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors p-0 h-auto"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Line
              </Button>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <caption className="sr-only">Journal Entry Lines</caption>
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-start text-[11px] font-semibold text-muted-foreground uppercase">Account</th>
                    <th scope="col" className="px-3 py-2 text-start text-[11px] font-semibold text-muted-foreground uppercase hidden md:table-cell">Line Note</th>
                    <th scope="col" className="px-3 py-2 text-end text-[11px] font-semibold text-muted-foreground uppercase w-28">Debit</th>
                    <th scope="col" className="px-3 py-2 text-end text-[11px] font-semibold text-muted-foreground uppercase w-28">Credit</th>
                    <th scope="col" className="px-3 py-2 w-8"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {form.lines.map((line, lineIndex) => {
                    const account = accounts.find((accountOption) => accountOption.id === line.account_id);
                    return (
                      <tr key={line.id} className="hover:bg-muted/10">
                        <td className="px-3 py-2">
                          <FormSelect
                            aria-label={`Account for line ${lineIndex + 1}`}
                            value={line.account_id}
                            onChange={(accountId) => updateLine(lineIndex, "account_id", accountId)}
                            placeholder="Select account…"
                            options={flattenedAccountOptions}
                          />
                          {account && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${ACCOUNT_TYPE_META[account.type]?.color}`}>
                              {account.type} · {ACCOUNT_TYPE_META[account.type]?.normalBalance === "debit" ? "Dr normal" : "Cr normal"}
                            </span>
                          )}
                          {errors[`line${lineIndex}`] && <p className="text-[10px] text-destructive m-0" role="alert">{errors[`line${lineIndex}`]}</p>}
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          <Input
                            aria-label={`Description for line ${lineIndex + 1}`}
                            value={line.description || ""}
                            onChange={(event) => updateLine(lineIndex, "description", event.target.value)}
                            placeholder="Note…"
                            className="h-8 py-1 px-2 text-xs"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            aria-label={`Debit amount for line ${lineIndex + 1}`}
                            value={line.debit}
                            placeholder="0.00"
                            onChange={(event) => updateLine(lineIndex, "debit", event.target.value)}
                            className="h-8 py-1 px-2 text-xs text-end bg-info/5 focus:ring-info/30 font-mono"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            aria-label={`Credit amount for line ${lineIndex + 1}`}
                            value={line.credit}
                            placeholder="0.00"
                            onChange={(event) => updateLine(lineIndex, "credit", event.target.value)}
                            className="h-8 py-1 px-2 text-xs text-end bg-success/5 focus:ring-success/30 font-mono"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove line ${lineIndex + 1}`}
                            onClick={() => removeLine(lineIndex)}
                            disabled={form.lines.length <= 2}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-border bg-muted/30">
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">Totals</td>
                    <td className="px-3 py-2 text-end font-mono font-bold text-info">{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 text-end font-mono font-bold text-success">{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className={`mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 ${isBalanced ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-sm" : "bg-destructive/10 text-destructive border-destructive/20 shadow-sm"}`} role="status">
              {isBalanced ? <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> : <AlertCircle className="w-4 h-4" aria-hidden="true" />}
              {isBalanced ? "Entry is balanced — Debits equal Credits" : `Out of balance — Difference: ${Math.abs(totalDebit - totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            </div>
            {errors.lines   && <p className="text-xs text-destructive mt-1" role="alert">{errors.lines}</p>}
            {errors.balance && <p className="text-xs text-destructive mt-1" role="alert">{errors.balance}</p>}
          </fieldset>

        </form>
    </FormModal>
  );
}
