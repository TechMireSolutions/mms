import React, { useState, useMemo } from "react";
import { Plus, Trash2, AlertCircle, CheckCircle2, Tag, BookOpen } from "lucide-react";
import { ACCOUNT_TYPE_META, JOURNAL_TAGS, generateJERef, Account, JournalEntry, FiscalYear, JournalLine } from '@/lib/data/accountingData';
import { DatePicker } from "../ui/DatePicker";
import FormModal from "../ui/FormModal";
import { Button } from "../ui/button";
import { FORM_INPUT, FORM_LABEL, FORM_INPUT_COMPACT } from "../ui/formStyles";

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
export default function JournalEntryForm({ accounts, entries, onSave, onClose, initial, fiscalYears }: JournalEntryFormProps) {
  const isEdit = !!initial?.id;
  const activeFY = (fiscalYears || []).find((f) => f.status === "active")?.label || "";

  const [form, setForm] = useState<DraftForm>(
    initial
      ? {
          ...initial,
          lines: initial.lines.map((l) => ({ ...l, debit: l.debit || "", credit: l.credit || "" }))
        }
      : {
          id: "",
          ref: "",
          date: new Date().toISOString().slice(0, 10),
          description: "",
          status: "draft",
          tags: [],
          attachments: [],
          fiscal_year: activeFY,
          lines: [EMPTY_LINE(), EMPTY_LINE()],
          created_by: "Admin"
        }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalDebit  = form.lines.reduce((s, l) => s + (typeof l.debit === "string" ? parseFloat(l.debit) || 0 : l.debit), 0);
  const totalCredit = form.lines.reduce((s, l) => s + (typeof l.credit === "string" ? parseFloat(l.credit) || 0 : l.credit), 0);
  const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const updateLine = (idx: number, field: keyof DraftLine, val: string | number) => {
    const lines = [...form.lines];
    lines[idx] = { ...lines[idx], [field]: val };
    if (field === "debit"  && val) lines[idx].credit = "";
    if (field === "credit" && val) lines[idx].debit  = "";
    setForm({ ...form, lines });
  };

  const addLine    = () => setForm({ ...form, lines: [...form.lines, EMPTY_LINE()] });
  const removeLine = (idx: number) => { if (form.lines.length <= 2) return; setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) }); };

  const toggleTag = (t: string) => {
    const tags = form.tags?.includes(t) ? form.tags.filter((x) => x !== t) : [...(form.tags || []), t];
    setForm({ ...form, tags });
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.date) e.date = "Date is required";
    if (!form.description.trim()) e.description = "Narration is required";
    const filled = form.lines.filter((l) => l.account_id);
    if (filled.length < 2) e.lines = "At least 2 account lines are required";
    if (!isBalanced) e.balance = "Debits must equal Credits";
    form.lines.forEach((l, i) => { if (!l.account_id) e[`line${i}`] = "Account required"; });
    return e;
  };

  const saveEntry = (saveAs?: "draft" | "posted") => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const ref = isEdit ? form.ref : generateJERef(entries);
    onSave({
      ...form,
      id: isEdit ? form.id : `je${Date.now()}`,
      ref,
      status: saveAs || form.status,
      created_by: "Admin",
      lines: form.lines.map((l) => ({
        ...l,
        debit: typeof l.debit === "string" ? parseFloat(l.debit) || 0 : l.debit,
        credit: typeof l.credit === "string" ? parseFloat(l.credit) || 0 : l.credit,
      })),
    } as JournalEntry);
  };

  const sortedAccounts = [...accounts].filter(a => a.isActive !== false).sort((a, b) => a.code.localeCompare(b.code));

  // Group accounts for optgroup
  const accountGroups: Record<string, Account[]> = {};
  sortedAccounts.forEach((a) => {
    if (!accountGroups[a.type]) accountGroups[a.type] = [];
    accountGroups[a.type].push(a);
  });

  const errorMessages = useMemo(
    () => Object.values(errors).filter(Boolean),
    [errors],
  );

  return (
    <FormModal
      open
      onClose={onClose}
      title={isEdit ? "Edit Journal Entry" : "New Journal Entry"}
      subtitle={activeFY || undefined}
      icon={BookOpen}
      size="xl"
      tall
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
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          {/* Header fields */}
          <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-0 p-0 m-0">
            <div>
              <label htmlFor="je-date" className={FORM_LABEL}>Date *</label>
              <DatePicker
                id="je-date"
                value={form.date}
                onChange={(val) => setForm({ ...form, date: val })}
                required
              />
              {errors.date && <p className="text-xs text-destructive mt-1" role="alert">{errors.date}</p>}
            </div>
            <div>
              <label htmlFor="je-fy" className={FORM_LABEL}>Financial Year</label>
              <select id="je-fy" value={form.fiscal_year} onChange={(e) => setForm({ ...form, fiscal_year: e.target.value })} className={FORM_INPUT}>
                <option value="">— None —</option>
                {(fiscalYears || []).map((fy) => <option key={fy.id} value={fy.label}>{fy.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="je-desc" className={FORM_LABEL}>Narration / Description *</label>
              <input id="je-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Student fee collection for Spring 2026…" className={FORM_INPUT} aria-invalid={!!errors.description} />
              {errors.description && <p className="text-xs text-destructive mt-1" role="alert">{errors.description}</p>}
            </div>
          </fieldset>

          {/* Tags */}
          <fieldset className="border-0 p-0 m-0">
            <legend className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1"><Tag className="w-3 h-3" aria-hidden="true" /> Tags</legend>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {JOURNAL_TAGS.map((t) => (
                <button key={t} type="button" onClick={() => toggleTag(t)}
                  aria-pressed={form.tags?.includes(t)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                    form.tags?.includes(t)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40"
                  }`}>{t}</button>
              ))}
            </div>
          </fieldset>

          {/* Lines */}
          <fieldset className="border-0 p-0 m-0">
            <div className="flex items-center justify-between mb-2">
              <legend className={FORM_LABEL}>Journal Lines *</legend>
              <button type="button" onClick={addLine}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                <Plus className="w-3.5 h-3.5" aria-hidden="true" /> Add Line
              </button>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <caption className="sr-only">Journal Entry Lines</caption>
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase">Account</th>
                    <th scope="col" className="px-3 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase hidden md:table-cell">Line Note</th>
                    <th scope="col" className="px-3 py-2 text-right text-[11px] font-semibold text-muted-foreground uppercase w-28">Debit</th>
                    <th scope="col" className="px-3 py-2 text-right text-[11px] font-semibold text-muted-foreground uppercase w-28">Credit</th>
                    <th scope="col" className="px-3 py-2 w-8"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {form.lines.map((line, idx) => {
                    const acc = accounts.find((a) => a.id === line.account_id);
                    return (
                      <tr key={line.id} className="hover:bg-muted/10">
                        <td className="px-3 py-2">
                          <select 
                            aria-label={`Account for line ${idx + 1}`}
                            value={line.account_id} 
                            onChange={(e) => updateLine(idx, "account_id", e.target.value)}
                            className="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                            aria-invalid={!!errors[`line${idx}`]}
                          >
                            <option value="">Select account…</option>
                            {Object.entries(accountGroups).map(([type, accs]) => (
                              <optgroup key={type} label={type}>
                                {accs.map((a) => <option key={a.id} value={a.id}>{a.code} – {a.name}</option>)}
                              </optgroup>
                            ))}
                          </select>
                          {acc && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${ACCOUNT_TYPE_META[acc.type]?.color}`}>
                              {acc.type} · {ACCOUNT_TYPE_META[acc.type]?.normalBalance === "debit" ? "Dr normal" : "Cr normal"}
                            </span>
                          )}
                          {errors[`line${idx}`] && <p className="text-[10px] text-destructive m-0" role="alert">{errors[`line${idx}`]}</p>}
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell">
                          <input 
                            aria-label={`Description for line ${idx + 1}`}
                            value={line.description || ""} 
                            onChange={(e) => updateLine(idx, "description", e.target.value)}
                            placeholder="Note…" 
                            className={FORM_INPUT_COMPACT} 
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            aria-label={`Debit amount for line ${idx + 1}`}
                            value={line.debit} 
                            placeholder="0.00"
                            onChange={(e) => updateLine(idx, "debit", e.target.value)}
                            className="w-full px-2 py-1.5 text-sm text-right rounded-lg border border-border bg-info/10/50 focus:outline-none focus:ring-2 focus:ring-info/30 font-mono" 
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            aria-label={`Credit amount for line ${idx + 1}`}
                            value={line.credit} 
                            placeholder="0.00"
                            onChange={(e) => updateLine(idx, "credit", e.target.value)}
                            className="w-full px-2 py-1.5 text-sm text-right rounded-lg border border-border bg-success/10/50 focus:outline-none focus:ring-2 focus:ring-success/30 font-mono" 
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button 
                            type="button" 
                            aria-label={`Remove line ${idx + 1}`}
                            onClick={() => removeLine(idx)} 
                            disabled={form.lines.length <= 2}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-border bg-muted/30">
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">Totals</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-info">{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-success">{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${isBalanced ? "bg-success/10 text-success border border-success/30" : "bg-destructive/10 text-destructive border border-destructive/30"}`} role="status">
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
