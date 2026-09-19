import { useMemo, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { Account } from "@/lib/data/accountingData";
import type { QuickActionType, WizardFormState } from "./simpleTransactionWizardTypes";
import { formatDate } from "@mms/shared";
import { parseMoneyInput } from "./simpleTransactionMoney";

interface StepReviewProps {
  type: QuickActionType;
  form: WizardFormState;
  accounts: Account[];
  showAdvanced: boolean;
  setShowAdvanced: Dispatch<SetStateAction<boolean>>;
  formatCurrency: (amount: number | string | null | undefined) => string;
  /** R5: jump back to the details step to edit a field */
  onEditDetails?: () => void;
}

interface ReviewRow {
  label: string;
  value: ReactNode;
  /** When set, an edit shortcut is shown for this row (R5) */
  editable?: boolean;
}

function isReviewRow(row: ReviewRow | null): row is ReviewRow {
  return row !== null;
}

export function StepReview({
  type,
  form,
  accounts,
  showAdvanced,
  setShowAdvanced,
  formatCurrency,
  onEditDetails,
}: StepReviewProps) {
  const { t } = useTranslation();
  /**
   * The reviewed amount is the parsed one — the same value the wizard posts.
   * An unparseable amount must never be shown as `formatCurrency(0)`, which
   * reads like a real zero-value transaction.
   */
  const amount = parseMoneyInput(form.amount);
  const amountLabel = amount === null ? "—" : formatCurrency(amount);
  const debitAccount = useMemo(() => accounts.find((account) => account.id === form.debitAcc), [accounts, form.debitAcc]);
  const creditAccount = useMemo(() => accounts.find((account) => account.id === form.creditAcc), [accounts, form.creditAcc]);

  const formatAccountName = (account?: Account) => {
    if (!account) return "—";
    return account.code ? `${account.code} — ${account.name}` : account.name;
  };

  const rows = useMemo(() => {
    const accountRows: ReviewRow[] =
      type.groupKey === "accounting.journal.dashboard.group.moneyIn"
        ? [
            { label: t("accounting.journal.dashboard.wizard.receivedIntoLabel"), value: formatAccountName(debitAccount) },
            { label: t("accounting.journal.dashboard.wizard.incomeCategory"), value: formatAccountName(creditAccount) },
          ]
        : type.groupKey === "accounting.journal.dashboard.group.transfers"
          ? [
              {
                label: t("accounting.journal.dashboard.wizard.transferLabel"),
                value: (
                  <span className="inline-flex items-center gap-1.5 flex-wrap">
                    <span>{formatAccountName(creditAccount)}</span>
                    <span className="inline-block rtl:rotate-180 text-muted-foreground" aria-hidden="true">→</span>
                    <span>{formatAccountName(debitAccount)}</span>
                  </span>
                ),
              },
            ]
          : [
              { label: t("accounting.journal.dashboard.wizard.paidFromLabel"), value: formatAccountName(creditAccount) },
              { label: t("accounting.journal.dashboard.wizard.expenseCategory"), value: formatAccountName(debitAccount) },
            ];

    return [
      { label: t("accounting.journal.dashboard.wizard.transactionType"), value: t(type.labelKey) },
      { label: t("accounting.columns.journal.date"), value: formatDate(form.date) },
      form.fiscal_year ? { label: t("accounting.journal.form.financialYear"), value: form.fiscal_year } : null,
      { label: t("accounting.journal.dashboard.wizard.amountLabel"), value: amountLabel, editable: true },
      ...accountRows,
      { label: t("accounting.columns.journal.description"), value: form.description || "—", editable: true },
      form.ref ? { label: t("accounting.journal.dashboard.wizard.referenceLabel"), value: form.ref } : null,
      form.tags && form.tags.length > 0
        ? {
            label: t("accounting.columns.journal.tags"),
            value: (
              <span className="inline-flex flex-wrap gap-1">
                {form.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-2 py-0.5 text-xs font-semibold">
                    {tag}
                  </Badge>
                ))}
              </span>
            ),
          }
        : null,
    ].filter(isReviewRow);
  }, [type, form, debitAccount, creditAccount, amountLabel, t]);

  return (
    <section aria-label={t("accounting.wizard.reviewAria")} className="space-y-4">

      <dl className="rounded-2xl border border-border overflow-hidden m-0">
        {rows.map((row, index) => (
          <div
            key={index}
            className={`flex items-start gap-4 px-4 py-3 ${index < rows.length - 1 ? "border-b border-border" : ""}`}
          >
            <dt className={cn(FORM_LABEL, "mb-0 w-32 shrink-0 pt-0.5")}>{row.label}</dt>
            <dd className="min-w-0 flex-1 break-words text-sm font-semibold text-foreground m-0">{row.value}</dd>
            {row.editable && onEditDetails && (
              <button
                type="button"
                onClick={onEditDetails}
                aria-label={`${t("common.edit")} ${row.label}`}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded p-0.5"
              >
                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
      </dl>

      {/* R1: Status banner prominently outside the data table */}
      {amount === null ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3" role="alert">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-destructive">{t("accounting.journal.dashboard.wizard.errorAmountInvalid")}</span>
        </div>
      ) : !debitAccount || !creditAccount ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3" role="alert">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-destructive">{t("accounting.journal.dashboard.wizard.errorSource")}</span>
        </div>
      ) : debitAccount.id === creditAccount.id ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3" role="alert">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-destructive">{t("accounting.journal.dashboard.wizard.errorSameAccount")}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-success">{t("accounting.journal.dashboard.wizard.postMessage")}</span>
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowAdvanced((previousValue) => !previousValue)}
          aria-expanded={showAdvanced}
          aria-controls="wizard-advanced-panel"
          className="w-full h-auto flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          {/* R2: non-jargon label for non-accountant staff */}
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{t("accounting.journal.dashboard.wizard.showAdvanced")}</span>
          {showAdvanced ? <ChevronUp className="w-4 h-4 text-muted-foreground" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />}
        </Button>
        {showAdvanced && (
          <div id="wizard-advanced-panel" className="p-4 space-y-2">
            <div className="space-y-3 md:hidden">
              <article className="space-y-2 rounded-xl border border-border bg-info/10 p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase m-0">{t("accounting.journal.detail.account")}</p>
                <p className="text-sm font-semibold text-foreground m-0">{formatAccountName(debitAccount)}</p>
                <StatGrid>
                  <StatRow
                    label={t("accounting.columns.journal.debit")}
                    value={amountLabel}
                    ddClassName="font-mono text-xs font-bold text-info"
                  />
                  <StatRow
                    label={t("accounting.columns.journal.credit")}
                    value="—"
                    ddClassName="font-mono text-xs text-muted-foreground"
                  />
                </StatGrid>
              </article>
              <article className="space-y-2 rounded-xl border border-border bg-success/10 p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase m-0">{t("accounting.journal.detail.account")}</p>
                <p className="text-sm font-semibold text-foreground m-0">{formatAccountName(creditAccount)}</p>
                <StatGrid>
                  <StatRow
                    label={t("accounting.columns.journal.debit")}
                    value="—"
                    ddClassName="font-mono text-xs text-muted-foreground"
                  />
                  <StatRow
                    label={t("accounting.columns.journal.credit")}
                    value={amountLabel}
                    ddClassName="font-mono text-xs font-bold text-success"
                  />
                </StatGrid>
              </article>
            </div>
            <div className="hidden overflow-x-auto md:block rounded-lg border border-border text-xs">
              <table className="min-w-review-panel w-full border-collapse">
                <caption className="sr-only">{t("accounting.journal.dashboard.wizard.linesAutoGenerated")}</caption>
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th scope="col" className="px-3 py-2 font-bold text-muted-foreground uppercase text-start">{t("accounting.journal.detail.account")}</th>
                    <th scope="col" className="px-3 py-2 font-bold text-muted-foreground uppercase text-end">{t("accounting.columns.journal.debit")}</th>
                    <th scope="col" className="px-3 py-2 font-bold text-muted-foreground uppercase text-end">{t("accounting.columns.journal.credit")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-info/5 border-b border-border">
                    <td className="px-3 py-2 font-semibold text-foreground">{formatAccountName(debitAccount)}</td>
                    <td className="px-3 py-2 text-end font-mono text-info font-bold">{amountLabel}</td>
                    <td className="px-3 py-2 text-end text-muted-foreground">—</td>
                  </tr>
                  <tr className="bg-success/10">
                    <td className="px-3 py-2 font-semibold text-foreground">{formatAccountName(creditAccount)}</td>
                    <td className="px-3 py-2 text-end text-muted-foreground">—</td>
                    <td className="px-3 py-2 text-end font-mono text-success font-bold">{amountLabel}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground m-0">{t("accounting.journal.dashboard.wizard.linesAutoGenerated")}</p>
          </div>
        )}
      </div>
    </section>
  );
}
