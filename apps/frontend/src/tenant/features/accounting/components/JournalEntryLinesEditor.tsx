import { AlertCircle, BookOpen, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import type { AppTranslationKey } from '@mms/shared';
import {
  ACCOUNT_TYPE_META,
  type Account,
} from '@/lib/data/accountingData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FieldErrorMessage } from '@/components/ui/FormField';
import { FormSelect } from '@/components/ui/FormSelect';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';
import type { DraftLine } from './journalEntryFormTypes';
import { JournalEntryLinesEditorMobile } from './JournalEntryLinesEditorMobile';

interface JournalEntryLinesEditorProps {
  accounts: readonly Account[];
  accountOptions: readonly { value: string; label: string }[];
  errors: Readonly<Record<string, string>>;
  lines: readonly DraftLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  formatCurrency: (amount: number) => string;
  onAddLine: () => void;
  onRemoveLine: (lineIndex: number) => void;
  onUpdateLine: (lineIndex: number, field: keyof DraftLine, fieldValue: string | number) => void;
}

export function JournalEntryLinesEditor({
  accounts,
  accountOptions,
  errors,
  lines,
  totalDebit,
  totalCredit,
  isBalanced,
  formatCurrency,
  onAddLine,
  onRemoveLine,
  onUpdateLine,
}: JournalEntryLinesEditorProps) {
  const { t } = useTranslation();

  return (
    <Card accentColor="primary" className="p-0">
      <fieldset className="p-5.5 px-6.5 pb-6 space-y-4 border-0 m-0 text-start">
        <div className="flex items-center justify-between pb-1.5 border-b border-border/40 mb-2">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t("accounting.journal.form.linesTitle")}</h3>
          </div>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onAddLine}
            className="flex items-center gap-1 min-h-11 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.journal.form.addLine")}
          </Button>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <JournalEntryLinesEditorMobile
            accounts={accounts}
            accountOptions={accountOptions}
            errors={errors}
            lines={lines}
            totalDebit={totalDebit}
            totalCredit={totalCredit}
            formatCurrency={formatCurrency}
            onRemoveLine={onRemoveLine}
            onUpdateLine={onUpdateLine}
          />
          <div className="hidden overflow-x-auto max-w-full md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("accounting.journal.form.linesCaption")}</caption>
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  <th scope="col" className="px-3 py-2 text-start text-xs font-semibold text-muted-foreground uppercase">{t("accounting.journal.detail.account")}</th>
                  <th scope="col" className="px-3 py-2 text-start text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">{t("accounting.ledger.columns.lineNote")}</th>
                  <th scope="col" className="px-3 py-2 text-end text-xs font-semibold text-muted-foreground uppercase w-28">{t("accounting.ledger.columns.debit")}</th>
                  <th scope="col" className="px-3 py-2 text-end text-xs font-semibold text-muted-foreground uppercase w-28">{t("accounting.ledger.columns.credit")}</th>
                  <th scope="col" className="px-3 py-2 w-8"><span className="sr-only">{t("common.actions")}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((line, lineIndex) => {
                  const account = accounts.find((accountOption) => accountOption.id === line.account_id);
                  return (
                    <tr key={line.id} className="hover:bg-muted/10">
                      <td className="px-3 py-2">
                        <FormSelect
                          aria-label={`Account for line ${lineIndex + 1}`}
                          value={line.account_id}
                          onChange={(accountId) => onUpdateLine(lineIndex, "account_id", accountId)}
                          placeholder={t("accounting.journal.form.selectAccount")}
                          options={accountOptions}
                        />
                        {account && (
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${ACCOUNT_TYPE_META[account.type]?.color}`}>
                            {t(`accounting.type.${account.type}` as AppTranslationKey)} · {ACCOUNT_TYPE_META[account.type]?.normalBalance === "debit" ? t("accounting.journal.form.drNormal") : t("accounting.journal.form.crNormal")}
                          </span>
                        )}
                        <FieldErrorMessage message={errors[`line${lineIndex}`]} className="m-0" />
                      </td>
                      <td className="px-3 py-2 hidden md:table-cell">
                        <Input
                          aria-label={`Description for line ${lineIndex + 1}`}
                          value={line.description || ""}
                          onChange={(event) => onUpdateLine(lineIndex, "description", event.target.value)}
                          placeholder={t("accounting.journal.form.notePlaceholder")}
                          className="text-xs"
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
                          onChange={(event) => onUpdateLine(lineIndex, "debit", event.target.value)}
                          className="bg-info/5 text-end font-mono text-xs focus:ring-info/30"
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
                          onChange={(event) => onUpdateLine(lineIndex, "credit", event.target.value)}
                          className="bg-success/5 text-end font-mono text-xs focus:ring-success/30"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove line ${lineIndex + 1}`}
                          onClick={() => onRemoveLine(lineIndex)}
                          disabled={lines.length <= 2}
                          className="text-muted-foreground hover:text-destructive transition-colors"
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
                  <td colSpan={2} className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">{t("accounting.journal.form.totals")}</td>
                  <td className="px-3 py-2 text-end font-mono font-bold text-info">{formatCurrency(totalDebit)}</td>
                  <td className="px-3 py-2 text-end font-mono font-bold text-success">{formatCurrency(totalCredit)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className={`mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 ${isBalanced ? "bg-success/10 text-success border-success/20 shadow-sm" : "bg-destructive/10 text-destructive border-destructive/20 shadow-sm"}`} role="status">
          {isBalanced ? <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> : <AlertCircle className="w-4 h-4" aria-hidden="true" />}
          {isBalanced ? t("accounting.journal.form.balanced") : t("accounting.journal.form.unbalanced", { diff: formatCurrency(Math.abs(totalDebit - totalCredit)) })}
        </div>
        <FieldErrorMessage message={errors.lines} />
        <FieldErrorMessage message={errors.balance} />
      </fieldset>
    </Card>
  );
}
