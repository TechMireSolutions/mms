import { Trash2 } from 'lucide-react';
import type { AppTranslationKey } from '@mms/shared';
import { ACCOUNT_TYPE_META, type Account } from '@/lib/data/accountingData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FieldErrorMessage } from '@/components/ui/FormField';
import { FormSelect } from '@/components/ui/FormSelect';
import { Input } from '@/components/ui/input';
import { FORM_LABEL, WORK_SURFACE_INNER } from '@/components/ui/formStyles';
import { StatGrid, StatRow } from '@/components/ui/StatGrid';
import { useTranslation } from '@/hooks/useTranslation';
import type { DraftLine } from './journalEntryFormTypes';

interface JournalEntryLinesEditorMobileProps {
  accounts: readonly Account[];
  accountOptions: readonly { value: string; label: string }[];
  errors: Readonly<Record<string, string>>;
  lines: readonly DraftLine[];
  totalDebit: number;
  totalCredit: number;
  formatCurrency: (amount: number) => string;
  onRemoveLine: (lineIndex: number) => void;
  onUpdateLine: (lineIndex: number, field: keyof DraftLine, fieldValue: string | number) => void;
}

export function JournalEntryLinesEditorMobile({
  accounts,
  accountOptions,
  errors,
  lines,
  totalDebit,
  totalCredit,
  formatCurrency,
  onRemoveLine,
  onUpdateLine,
}: JournalEntryLinesEditorMobileProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 p-3 md:hidden">
      {lines.map((line, lineIndex) => {
        const account = accounts.find((accountOption) => accountOption.id === line.account_id);
        return (
          <article key={line.id} className={`${WORK_SURFACE_INNER} space-y-3 p-3`}>
            <div className="flex items-center justify-end">
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
            </div>
            <div>
              <label className={FORM_LABEL}>{t("accounting.journal.detail.account")}</label>
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
            </div>
            <div>
              <label className={FORM_LABEL}>{t("accounting.ledger.columns.lineNote")}</label>
              <Input
                aria-label={`Description for line ${lineIndex + 1}`}
                value={line.description || ""}
                onChange={(event) => onUpdateLine(lineIndex, "description", event.target.value)}
                placeholder={t("accounting.journal.form.notePlaceholder")}
                className="text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={FORM_LABEL}>{t("accounting.ledger.columns.debit")}</label>
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
              </div>
              <div>
                <label className={FORM_LABEL}>{t("accounting.ledger.columns.credit")}</label>
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
              </div>
            </div>
          </article>
        );
      })}
      <article className="rounded-xl border border-border bg-muted/30 p-3">
        <p className="text-xs font-bold uppercase text-muted-foreground m-0 mb-2">{t("accounting.journal.form.totals")}</p>
        <StatGrid>
          <StatRow
            label={t("accounting.ledger.columns.debit")}
            value={formatCurrency(totalDebit)}
            ddClassName="font-mono font-bold text-info"
          />
          <StatRow
            label={t("accounting.ledger.columns.credit")}
            value={formatCurrency(totalCredit)}
            ddClassName="font-mono font-bold text-success"
          />
        </StatGrid>
      </article>
    </div>
  );
}
