import { Pencil, CheckCircle2, RotateCcw, Tag } from "lucide-react";
import { formatDate } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { ACCOUNT_TYPE_META, Account, JournalEntry } from '@/lib/data/accountingData';
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import { useAccountingCurrency } from "@/hooks/useCurrency";

interface JournalEntryDetailProps {
  entry: JournalEntry;
  accounts: Account[];
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
export function JournalEntryDetail({ entry, accounts, onClose, onEdit, onReverse }: JournalEntryDetailProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();
  const journalStatusConfig: Record<string, StatusBadgeConfigItem> = {
    posted: { label: t("accounting.journal.status.posted"), cls: SEMANTIC_BADGE.successStrong },
    draft: { label: t("accounting.journal.status.draft"), cls: SEMANTIC_BADGE.warningStrong },
  };
  const getAccount = (id: string) => accounts.find((account) => account.id === id);
  const totalDebit = entry.lines.reduce((sum, journalLine) => sum + journalLine.debit, 0);
  const totalCredit = entry.lines.reduce((sum, journalLine) => sum + journalLine.credit, 0);

  return (
    <Modal
      open
      onClose={onClose}
      title={entry.ref}
      icon={Tag}
      size="lg"
      headerExtra={
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <StatusBadge status={entry.status} config={journalStatusConfig} size="sm" />
          {entry.reversed_ref && (
            <span className="text-[10px] font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded-full border border-warning/30">
              ↩ {t("accounting.journal.detail.reversalOf", { ref: entry.reversed_ref })}
            </span>
          )}
        </div>
      }
      headerActions={
        <div className="flex items-center gap-2">
          {entry.status === "draft" && (
            <Button type="button" variant="outline" size="sm" onClick={onEdit} className="flex items-center gap-1 text-xs font-semibold">
              <Pencil className="w-3 h-3" aria-hidden="true" /> {t("accounting.journal.detail.edit")}
            </Button>
          )}
          {entry.status === "posted" && onReverse && (
            <Button type="button" variant="outline" size="sm" onClick={onReverse} className="flex items-center gap-1 text-xs font-semibold border-warning/30 text-warning hover:bg-warning/10 hover:text-warning">
              <RotateCcw className="w-3 h-3" aria-hidden="true" /> {t("accounting.journal.detail.reverse")}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase m-0">{t("accounting.journal.detail.date")}</h3>
              <p className="font-semibold text-foreground m-0">
                {formatDate(entry.date)}
              </p>
            </div>
            <div>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase m-0">{t("accounting.journal.detail.createdBy")}</h3>
              <p className="font-semibold text-foreground m-0">{entry.created_by || "—"}</p>
            </div>
            <div>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase m-0">{t("accounting.journal.detail.fiscalYear")}</h3>
              <p className="font-semibold text-foreground m-0">{entry.fiscal_year || "—"}</p>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase m-0">{t("accounting.journal.detail.narration")}</h3>
              <p className="font-medium text-foreground m-0">{entry.description}</p>
            </div>
          </div>

          {/* Tags */}
          {(entry.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-label="Tags">
              <Tag className="w-3.5 h-3.5 text-muted-foreground mt-0.5" aria-hidden="true" />
              {entry.tags!.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">{tag}</span>
              ))}
            </div>
          )}

          {/* Lines table */}
          <section aria-label="Entry Lines" className="relative overflow-hidden group/lines rounded-xl border border-border/80 bg-card/45 backdrop-blur-xs shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/60 transition-colors group-hover/lines:bg-primary" />
            <table className="w-full text-sm">
              <caption className="sr-only">Line items for journal entry {entry.ref}</caption>
              <thead className="bg-muted/60 border-b border-border/40">
                <tr>
                  <th scope="col" className="px-5 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase">{t("accounting.journal.detail.account")}</th>
                  <th scope="col" className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground uppercase hidden sm:table-cell">{t("accounting.journal.detail.note")}</th>
                  <th scope="col" className="px-4 py-2 text-right text-[11px] font-semibold text-muted-foreground uppercase">{t("accounting.journal.detail.debit")}</th>
                  <th scope="col" className="px-5 py-2 text-right text-[11px] font-semibold text-muted-foreground uppercase">{t("accounting.journal.detail.credit")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entry.lines.map((line) => {
                  const account = getAccount(line.account_id);
                  return (
                    <tr key={line.id} className="hover:bg-muted/10">
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-foreground m-0">{account?.name || t("accounting.journal.detail.unknownAccount")}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-muted-foreground">{account?.code}</span>
                          {account && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ACCOUNT_TYPE_META[account.type]?.color}`}>{account.type}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">{line.description || "—"}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-info">
                        {line.debit > 0 ? formatCurrency(line.debit) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-success">
                        {line.credit > 0 ? formatCurrency(line.credit) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-border bg-muted/30">
                <tr>
                  <td colSpan={2} className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase">{t("accounting.journal.detail.totals")}</td>
                  <td className="px-4 py-2 text-right font-mono font-bold text-info">{formatCurrency(totalDebit)}</td>
                  <td className="px-4 py-2 text-right font-mono font-bold text-success">{formatCurrency(totalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </section>

          {/* Balance check */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border ${Math.abs(totalDebit - totalCredit) < 0.01 ? "bg-success/10 text-success border-success/30" : "bg-destructive/10 text-destructive border-destructive/30"}`} role="status">
            {Math.abs(totalDebit - totalCredit) < 0.01
              ? <><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.journal.detail.balanced")}</>
              : <>{t("accounting.journal.detail.unbalanced", { diff: formatCurrency(Math.abs(totalDebit - totalCredit)) })}</>
            }
          </div>
      </div>
    </Modal>
  );
}
