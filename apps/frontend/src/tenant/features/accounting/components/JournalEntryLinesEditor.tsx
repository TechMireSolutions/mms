import { AlertCircle, BookOpen, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import type { AppTranslationKey } from '@mms/shared';
import {
  ACCOUNT_TYPE_META,
  type Account,
} from '@/lib/data/accountingData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FieldErrorMessage } from '@/components/ui/FormField';
import { FormSelect } from '@/components/ui/FormSelect';
import { SectionCard } from '@/components/ui/SectionCard';
import { Input } from '@/components/ui/input';
import { ModuleTableHeaderCell } from '@/components/ui/ModuleTableHeaderCell';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { balanceToneClass } from '@/lib/semanticTone';
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
    <SectionCard
      accentColor="primary"
      icon={BookOpen}
      title={t("accounting.journal.form.linesTitle")}
      actions={
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={onAddLine}
          className="flex items-center gap-1 min-h-11 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.journal.form.addLine")}
        </Button>
      }
      className="shadow-sm text-start space-y-4"
    >
      <div className="space-y-4">

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
          <div className="hidden md:block">
            <Table>
              <caption className="sr-only">{t("accounting.journal.form.linesCaption")}</caption>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
                  <ModuleTableHeaderCell columnKey="account" className="px-3 py-2">{t("accounting.journal.detail.account")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="lineNote" className="px-3 py-2 hidden md:table-cell">{t("accounting.ledger.columns.lineNote")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="debit" className="px-3 py-2 text-end w-28">{t("accounting.ledger.columns.debit")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="credit" className="px-3 py-2 text-end w-28">{t("accounting.ledger.columns.credit")}</ModuleTableHeaderCell>
                  <ModuleTableHeaderCell columnKey="actions" className="px-3 py-2 w-8"><span className="sr-only">{t("common.actions")}</span></ModuleTableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {lines.map((line, lineIndex) => {
                  const account = accounts.find((accountOption) => accountOption.id === line.account_id);
                  return (
                    <TableRow key={line.id} className="hover:bg-muted/10">
                      <TableCell className="px-3 py-2">
                        <FormSelect
                          aria-label={`Account for line ${lineIndex + 1}`}
                          value={line.account_id}
                          onChange={(accountId) => onUpdateLine(lineIndex, "account_id", accountId)}
                          placeholder={t("accounting.journal.form.selectAccount")}
                          options={accountOptions}
                        />
                        {account && (
                          <Badge pill variant="outline" className={`mt-0.5 px-1.5 font-bold ${ACCOUNT_TYPE_META[account.type]?.color}`}>
                            {t(`accounting.type.${account.type}` as AppTranslationKey)} · {ACCOUNT_TYPE_META[account.type]?.normalBalance === "debit" ? t("accounting.journal.form.drNormal") : t("accounting.journal.form.crNormal")}
                          </Badge>
                        )}
                        <FieldErrorMessage message={errors[`line${lineIndex}`]} className="m-0" />
                      </TableCell>
                      <TableCell className="px-3 py-2 hidden md:table-cell">
                        <Input
                          aria-label={`Description for line ${lineIndex + 1}`}
                          value={line.description || ""}
                          onChange={(event) => onUpdateLine(lineIndex, "description", event.target.value)}
                          placeholder={t("accounting.journal.form.notePlaceholder")}
                          className="text-xs"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Input
                          type="text"
                          inputMode="decimal"
                          aria-label={`Debit amount for line ${lineIndex + 1}`}
                          value={line.debit}
                          placeholder="0.00"
                          onChange={(event) => onUpdateLine(lineIndex, "debit", event.target.value)}
                          className="bg-info/5 text-end font-mono text-xs focus:ring-info/30"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Input
                          type="text"
                          inputMode="decimal"
                          aria-label={`Credit amount for line ${lineIndex + 1}`}
                          value={line.credit}
                          placeholder="0.00"
                          onChange={(event) => onUpdateLine(lineIndex, "credit", event.target.value)}
                          className="bg-success/5 text-end font-mono text-xs focus:ring-success/30"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2">
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
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter className="border-t-2 border-border bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={2} className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">{t("accounting.journal.form.totals")}</TableCell>
                  <TableCell className="px-3 py-2 text-end font-mono font-bold text-info">{formatCurrency(totalDebit)}</TableCell>
                  <TableCell className="px-3 py-2 text-end font-mono font-bold text-success">{formatCurrency(totalCredit)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>

        <div className={cn("mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 shadow-sm", balanceToneClass(isBalanced))} role="status">
          {isBalanced ? <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> : <AlertCircle className="w-4 h-4" aria-hidden="true" />}
          {isBalanced ? t("accounting.journal.form.balanced") : t("accounting.journal.form.unbalanced", { diff: formatCurrency(Math.abs(totalDebit - totalCredit)) })}
        </div>
        <FieldErrorMessage message={errors.lines} />
        <FieldErrorMessage message={errors.balance} />
      </div>
    </SectionCard>
  );
}
