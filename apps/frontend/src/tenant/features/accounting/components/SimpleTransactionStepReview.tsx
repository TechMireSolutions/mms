import type { Dispatch, SetStateAction } from "react";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatGrid, StatRow } from "@/components/ui/StatGrid";
import { FORM_LABEL } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { Account } from "@/lib/data/accountingData";
import type { QuickActionType, WizardFormState } from "./simpleTransactionWizardTypes";

interface StepReviewProps {
  type: QuickActionType;
  form: WizardFormState;
  accounts: Account[];
  showAdvanced: boolean;
  setShowAdvanced: Dispatch<SetStateAction<boolean>>;
  formatCurrency: (amount: number | string | null | undefined) => string;
}

interface ReviewRow {
  label: string;
  value: string;
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
}: StepReviewProps) {
  const { t } = useTranslation();
  const amount = parseFloat(form.amount) || 0;
  const debitAccount = accounts.find((account) => account.id === form.debitAcc);
  const creditAccount = accounts.find((account) => account.id === form.creditAcc);

  const rows = [
    { label: t("accounting.journal.dashboard.wizard.transactionType"), value: t(type.labelKey) },
    { label: t("accounting.columns.journal.date"), value: form.date },
    { label: t("accounting.journal.dashboard.wizard.amountLabel"), value: formatCurrency(amount) },
    type.groupKey === "accounting.journal.dashboard.group.moneyIn"
      ? { label: t("accounting.journal.dashboard.wizard.receivedIntoLabel"), value: debitAccount?.name || "—" }
      : type.groupKey === "accounting.journal.dashboard.group.transfers"
        ? { label: t("accounting.journal.dashboard.wizard.transferLabel"), value: `${creditAccount?.name || "—"} → ${debitAccount?.name || "—"}` }
        : { label: t("accounting.journal.dashboard.wizard.paidFromLabel"), value: creditAccount?.name || "—" },
    { label: t("accounting.columns.journal.description"), value: form.description || "—" },
    form.ref ? { label: t("accounting.journal.dashboard.wizard.referenceLabel"), value: form.ref } : null,
  ].filter(isReviewRow);

  return (
    <section aria-label={t("accounting.wizard.reviewAria")} className="space-y-4">
      <header className="text-center space-y-1 pb-1">
        <h3 className="text-lg font-bold text-foreground m-0">{t("accounting.journal.dashboard.wizard.reviewTitle")}</h3>
        <p className="text-sm text-muted-foreground m-0">{t("accounting.journal.dashboard.wizard.reviewSubtitle")}</p>
      </header>

      <div className="rounded-2xl border border-border overflow-hidden">
        {rows.map((row, index) => (
          <div key={index} className={`flex items-start gap-4 px-4 py-3 ${index % 2 === 0 ? "bg-muted/20" : "bg-background"}`}>
            <span className={cn(FORM_LABEL, "mb-0 w-32 shrink-0 pt-0.5")}>{row.label}</span>
            <span className="min-w-0 flex-1 break-words text-sm font-semibold text-foreground">{row.value}</span>
          </div>
        ))}
        <div className="px-4 py-3 bg-success/10 border-t border-success/20 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-success">{t("accounting.journal.dashboard.wizard.postMessage")}</span>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowAdvanced((previousValue) => !previousValue)}
          aria-expanded={showAdvanced}
          className="w-full h-auto flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{t("accounting.journal.dashboard.wizard.showAdvanced")}</span>
          {showAdvanced ? <ChevronUp className="w-4 h-4 text-muted-foreground" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />}
        </Button>
        {showAdvanced && (
          <div className="p-4 space-y-2">
            <div className="space-y-3 md:hidden">
              <article className="space-y-2 rounded-xl border border-border bg-info/10 p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase m-0">{t("accounting.journal.detail.account")}</p>
                <p className="text-sm font-semibold text-foreground m-0">{debitAccount?.name || "—"}</p>
                <StatGrid>
                  <StatRow
                    label={t("accounting.columns.journal.debit")}
                    value={formatCurrency(amount)}
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
                <p className="text-sm font-semibold text-foreground m-0">{creditAccount?.name || "—"}</p>
                <StatGrid>
                  <StatRow
                    label={t("accounting.columns.journal.debit")}
                    value="—"
                    ddClassName="font-mono text-xs text-muted-foreground"
                  />
                  <StatRow
                    label={t("accounting.columns.journal.credit")}
                    value={formatCurrency(amount)}
                    ddClassName="font-mono text-xs font-bold text-success"
                  />
                </StatGrid>
              </article>
            </div>
            <div className="hidden overflow-x-auto md:block rounded-lg border border-border text-xs">
              <div className="min-w-review-panel">
                <div className="grid grid-cols-3 gap-0 bg-muted/60 border-b border-border">
                  <div className="px-3 py-2 font-bold text-muted-foreground uppercase">{t("accounting.journal.detail.account")}</div>
                  <div className="px-3 py-2 font-bold text-muted-foreground uppercase text-end">{t("accounting.columns.journal.debit")}</div>
                  <div className="px-3 py-2 font-bold text-muted-foreground uppercase text-end">{t("accounting.columns.journal.credit")}</div>
                </div>
                <div className="grid grid-cols-3 bg-info/5 border-b border-border">
                  <div className="px-3 py-2 font-semibold text-foreground">{debitAccount?.name || "—"}</div>
                  <div className="px-3 py-2 text-end font-mono text-info font-bold">{formatCurrency(amount)}</div>
                  <div className="px-3 py-2 text-end text-muted-foreground">—</div>
                </div>
                <div className="grid grid-cols-3 bg-success/10/50">
                  <div className="px-3 py-2 font-semibold text-foreground">{creditAccount?.name || "—"}</div>
                  <div className="px-3 py-2 text-end text-muted-foreground">—</div>
                  <div className="px-3 py-2 text-end font-mono text-success font-bold">{formatCurrency(amount)}</div>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground m-0">{t("accounting.journal.dashboard.wizard.linesAutoGenerated")}</p>
          </div>
        )}
      </div>
    </section>
  );
}
