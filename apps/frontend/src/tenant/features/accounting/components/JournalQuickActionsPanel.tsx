import type React from "react";
import { formatDate, type AppTranslationKey } from "@mms/shared";
import { CheckCircle2, DollarSign, Download, Plus, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useTranslation } from "@/hooks/useTranslation";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import type { JournalEntry } from "@/lib/data/accountingData";
import { QUICK_ACTIONS, type QuickActionType } from "@/tenant/features/accounting/components/journalEntriesQuickActions";

interface JournalQuickActionsPanelProps {
  entries: JournalEntry[];
  canWrite: boolean;
  nlInput: string;
  nlSuggestion: QuickActionType | null;
  onNlSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNlChange: (inputValue: string) => void;
  onOpenPrefill: (prefillType: QuickActionType | null) => void;
  onExportCsv: () => void;
}

export function JournalQuickActionsPanel({
  entries,
  canWrite,
  nlInput,
  nlSuggestion,
  onNlSubmit,
  onNlChange,
  onOpenPrefill,
  onExportCsv,
}: JournalQuickActionsPanelProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();
  const journalStatusConfig: Record<string, StatusBadgeConfigItem> = {
    posted: { label: t("accounting.journal.status.posted"), cls: SEMANTIC_BADGE.successStrong },
    draft: { label: t("accounting.journal.status.draft"), cls: SEMANTIC_BADGE.warningStrong },
  };

  return (
    <>
      {canWrite && (
        <article className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <header className="flex flex-wrap items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <h3 className="text-sm font-bold text-foreground m-0">{t("accounting.journal.dashboard.whatHappened")}</h3>
            <span className="text-xs text-muted-foreground">{t("accounting.journal.dashboard.typePlainLanguage")}</span>
          </header>
          <form onSubmit={onNlSubmit} className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <label htmlFor="nl-input" className="sr-only">{t("accounting.journal.dashboard.nlInputAria")}</label>
              <Input
                id="nl-input"
                value={nlInput}
                onChange={(event) => onNlChange(event.target.value)}
                placeholder={t("accounting.journal.dashboard.placeholderNl")}
                className="w-full px-4 py-3"
              />
              {nlSuggestion && (
                <div className="absolute top-full start-0 mt-1 max-w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-lg z-10 flex items-center gap-1.5" role="status">
                  <CheckCircle2 className="w-3 h-3 shrink-0" aria-hidden="true" /> {t("accounting.journal.dashboard.autoDetected", { label: t(nlSuggestion.labelKey) })}
                </div>
              )}
            </div>
            <Button type="submit" className="min-h-11 w-full sm:w-auto px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap">
              {t("accounting.journal.dashboard.record")}
            </Button>
          </form>
        </article>
      )}

      {canWrite && (
        <section aria-label={t("accounting.journal.dashboard.quickActions")}>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2.5 m-0">{t("accounting.journal.dashboard.quickActions")}</h3>
          <nav className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((quickAction) => {
              const Icon = quickAction.icon;
              return (
                <Button
                  key={quickAction.labelKey}
                  type="button"
                  variant="outline"
                  onClick={() => onOpenPrefill(quickAction.type)}
                  className="flex min-h-11 items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted hover:border-primary/30 transition-all shadow-sm"
                >
                  <Icon className="w-4 h-4 text-primary" aria-hidden="true" /> {t(quickAction.labelKey)}
                </Button>
              );
            })}
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenPrefill(null)}
              className="flex min-h-11 items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-primary/40 bg-primary/5 text-sm font-semibold text-primary hover:bg-primary/10 transition-all"
            >
              <Plus className="w-4 h-4" aria-hidden="true" /> {t("accounting.journal.dashboard.otherTransaction")}
            </Button>
          </nav>
        </section>
      )}

      <section aria-label={t("accounting.journal.dashboard.recentTransactions")}>
        <header className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="min-w-0 text-xs font-bold text-muted-foreground uppercase tracking-wide m-0">{t("accounting.journal.dashboard.recentTransactions")}</h3>
          <Button type="button" variant="link" size="sm" onClick={onExportCsv} className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors min-h-11 px-2 self-start sm:self-auto">
            <Download className="w-3.5 h-3.5" aria-hidden="true" /> {t("accounting.journal.dashboard.export")}
          </Button>
        </header>

        {entries.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border-2 border-dashed border-border" role="status">
            <DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm font-semibold text-muted-foreground m-0">{t("accounting.journal.dashboard.noTransactionsYet")}</p>
            <p className="text-xs text-muted-foreground mt-1 m-0">{t("accounting.journal.dashboard.useQuickActions")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...entries].sort((firstEntry, secondEntry) => secondEntry.date.localeCompare(firstEntry.date)).slice(0, 20).map((entry) => {
              const amount = entry.lines.reduce((sum, journalLine) => sum + journalLine.debit, 0);
              const isMoneyIn = (entry.tags || []).some((tag) => ["Fees", "Donation", "Capital"].includes(tag)) || ["fee_collection", "donation", "rent_income", "other_income"].includes(entry.transaction_type || "");
              return (
                <Card key={entry.id} accentColor={isMoneyIn ? "success" : "destructive"} className="flex flex-col gap-3 px-5 py-3 hover:bg-muted/20 transition-all duration-300 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isMoneyIn ? "bg-success/15" : "bg-destructive/15"}`} aria-hidden="true">
                      {isMoneyIn ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingUp className="w-4 h-4 text-destructive rotate-180" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate m-0">{entry.description}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{formatDate(entry.date)}</span>
                        <span className="text-xs font-mono text-muted-foreground">{entry.ref}</span>
                        {(entry.tags || []).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                            {t(`accounting.journal.tag.${tag.toLowerCase()}` as AppTranslationKey)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end flex-shrink-0 ps-12 sm:ps-0">
                    <div className="text-end">
                      <p className={`text-sm font-bold font-mono m-0 ${isMoneyIn ? "text-success" : "text-destructive"}`}>
                        {isMoneyIn ? "+" : "−"}{formatCurrency(amount)}
                      </p>
                    </div>
                    <StatusBadge status={entry.status} config={journalStatusConfig} size="sm" />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
