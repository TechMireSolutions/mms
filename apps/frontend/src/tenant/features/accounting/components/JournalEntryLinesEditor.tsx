import { AlertCircle, BookOpen, CheckCircle2 } from 'lucide-react';
import {
  type Account,
} from '@/lib/data/accountingData';
import { FieldErrorMessage } from '@/components/ui/FormField';
import { FormCollectionShell } from '@/components/ui/FormPrimitives';
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
import { JournalEntryLineRow } from './JournalEntryLineRow';
import { JournalEntryLinesEditorMobile } from './JournalEntryLinesEditorMobile';
import { useWorkDirectoryViewMode, type WorkDirectoryViewMode } from '@/hooks/useWorkDirectoryViewMode';

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
  canAddAccount?: boolean;
  onOpenAddAccount?: (lineIndex: number) => void;
  viewMode?: WorkDirectoryViewMode;
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
  canAddAccount = false,
  onOpenAddAccount,
  viewMode: propViewMode,
}: JournalEntryLinesEditorProps) {
  const { t } = useTranslation();
  const { viewMode: hookViewMode } = useWorkDirectoryViewMode();
  const viewMode = propViewMode ?? hookViewMode;
  const accountMap = new Map(accounts.map((account) => [account.id, account]));

  return (
    <div className="space-y-4 text-start">
      <FormCollectionShell
        title={t("accounting.journal.form.linesTitle")}
        icon={BookOpen}
        addLabel={t("accounting.journal.form.addLine")}
        onAdd={onAddLine}
        listKey="journal-lines"
      >
        <div className="rounded-xl border border-border overflow-hidden">
          {viewMode === "cards" ? (
            <JournalEntryLinesEditorMobile
              accounts={accounts}
              accountOptions={accountOptions}
              errors={errors}
              lines={lines}
              totalDebit={totalDebit}
              totalCredit={totalCredit}
              formatCurrency={formatCurrency}
              canAddAccount={canAddAccount}
              onOpenAddAccount={onOpenAddAccount}
              onRemoveLine={onRemoveLine}
              onUpdateLine={onUpdateLine}
            />
          ) : (
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
                {lines.map((line, lineIndex) => (
                  <JournalEntryLineRow
                    key={line.id}
                    line={line}
                    lineIndex={lineIndex}
                    account={accountMap.get(line.account_id)}
                    accountOptions={accountOptions}
                    errorMessage={errors[`line${lineIndex}`]}
                    canRemove={lines.length > 2}
                    canAddAccount={canAddAccount}
                    onOpenAddAccount={
                      onOpenAddAccount ? () => onOpenAddAccount(lineIndex) : undefined
                    }
                    onUpdateLine={onUpdateLine}
                    onRemoveLine={onRemoveLine}
                  />
                ))}
              </TableBody>
              <TableFooter className="border-t-2 border-border bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableCell className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">{t("accounting.journal.form.totals")}</TableCell>
                  <TableCell className="hidden md:table-cell" />
                  <TableCell className="px-3 py-2 text-end font-mono font-bold text-info">{formatCurrency(totalDebit)}</TableCell>
                  <TableCell className="px-3 py-2 text-end font-mono font-bold text-success">{formatCurrency(totalCredit)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </div>
      </FormCollectionShell>

      <div className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 shadow-sm", balanceToneClass(isBalanced))} role="status">
        {isBalanced ? <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> : <AlertCircle className="w-4 h-4" aria-hidden="true" />}
        {isBalanced ? t("accounting.journal.form.balanced") : t("accounting.journal.form.unbalanced", { diff: formatCurrency(Math.abs(totalDebit - totalCredit)) })}
      </div>
      <FieldErrorMessage message={errors.lines} />
      <FieldErrorMessage message={errors.balance} />
    </div>
  );
}
