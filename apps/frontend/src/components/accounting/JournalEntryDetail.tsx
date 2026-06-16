import React from "react";
import { X, Pencil, CheckCircle2, Clock, RotateCcw, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { ACCOUNT_TYPE_META, Account, JournalEntry } from '@/lib/data/accountingData';

interface JournalEntryDetailProps {
  entry: JournalEntry;
  accounts: Account[];
  fmt?: (n: number) => string;
  onClose: () => void;
  onEdit: () => void;
  onReverse?: () => void;
}

/**
 * JournalEntryDetail component.
 * 
 * Displays the details of a journal entry in a modal.
 * 
 * @param {JournalEntryDetailProps} props - The component props.
 * @returns {React.ReactElement}
 */
export default function JournalEntryDetail({ entry, accounts, fmt, onClose, onEdit, onReverse }: JournalEntryDetailProps) {
  const getAccount = (id: string) => accounts.find((a) => a.id === id);
  const totalD = entry.lines.reduce((s, l) => s + l.debit, 0);
  const totalC = entry.lines.reduce((s, l) => s + l.credit, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        role="dialog" aria-modal="true" aria-labelledby="modal-title"
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <h2 id="modal-title" className="text-base font-bold text-foreground font-mono m-0">{entry.ref}</h2>
            {entry.status === "posted"
              ? <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-2.5 h-2.5" aria-hidden="true" />Posted</span>
              : <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200"><Clock className="w-2.5 h-2.5" aria-hidden="true" />Draft</span>
            }
            {entry.reversed_ref && (
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                ↩ Reversal of {entry.reversed_ref}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {entry.status === "draft" && (
              <button type="button" onClick={onEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-muted transition-colors">
                <Pencil className="w-3 h-3" aria-hidden="true" /> Edit
              </button>
            )}
            {entry.status === "posted" && onReverse && (
              <button type="button" onClick={onReverse} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors">
                <RotateCcw className="w-3 h-3" aria-hidden="true" /> Reverse
              </button>
            )}
            <button type="button" aria-label="Close details" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><X className="w-4 h-4" aria-hidden="true" /></button>
          </div>
        </header>

        <div className="px-6 py-5 space-y-5">
          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase m-0">Date</h3>
              <p className="font-semibold text-foreground m-0">
                {new Date(entry.date).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase m-0">Created By</h3>
              <p className="font-semibold text-foreground m-0">{entry.created_by || "—"}</p>
            </div>
            <div>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase m-0">Financial Year</h3>
              <p className="font-semibold text-foreground m-0">{entry.fiscal_year || "—"}</p>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase m-0">Narration</h3>
              <p className="font-medium text-foreground m-0">{entry.description}</p>
            </div>
          </div>

          {/* Tags */}
          {(entry.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-label="Tags">
              <Tag className="w-3.5 h-3.5 text-muted-foreground mt-0.5" aria-hidden="true" />
              {entry.tags!.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">{t}</span>
              ))}
            </div>
          )}

          {/* Lines table */}
          <section aria-label="Entry Lines" className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <caption className="sr-only">Line items for journal entry {entry.ref}</caption>
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase">Account</th>
                  <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase hidden sm:table-cell">Note</th>
                  <th scope="col" className="px-4 py-2 text-right text-[11px] font-semibold text-muted-foreground uppercase">Debit</th>
                  <th scope="col" className="px-4 py-2 text-right text-[11px] font-semibold text-muted-foreground uppercase">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entry.lines.map((line) => {
                  const acc = getAccount(line.account_id);
                  return (
                    <tr key={line.id} className="hover:bg-muted/10">
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-foreground m-0">{acc?.name || "Unknown Account"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-muted-foreground">{acc?.code}</span>
                          {acc && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ACCOUNT_TYPE_META[acc.type]?.color}`}>{acc.type}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">{line.description || "—"}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-blue-700">
                        {line.debit > 0 ? line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-emerald-700">
                        {line.credit > 0 ? line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-border bg-muted/30">
                <tr>
                  <td colSpan={2} className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase">Totals</td>
                  <td className="px-4 py-2 text-right font-mono font-bold text-blue-700">{fmt ? fmt(totalD) : totalD.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2 text-right font-mono font-bold text-emerald-700">{fmt ? fmt(totalC) : totalC.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          {/* Balance check */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border ${Math.abs(totalD - totalC) < 0.01 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`} role="status">
            {Math.abs(totalD - totalC) < 0.01
              ? <><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Balanced entry — Debits equal Credits</>
              : <>Unbalanced — Difference: {Math.abs(totalD - totalC).toLocaleString(undefined, { minimumFractionDigits: 2 })}</>
            }
          </div>
        </div>
      </motion.div>
    </div>
  );
}
