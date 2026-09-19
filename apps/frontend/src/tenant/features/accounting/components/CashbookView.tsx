import { useState } from "react";
import { TrendingUp, TrendingDown, ArrowUpDown, AlertTriangle } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { centsToMoney, type JournalEntry, type Account } from '@/lib/data/accountingData';
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { SegmentedPillFilter } from "@/components/ui/SegmentedPillFilter";
import { useTranslation } from "@/hooks/useTranslation";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import {
  buildCashbookRows,
  countCashbookRowsByType,
  resolveCashAccountIds,
  sumCashbookTotals,
  type EntryType,
} from "@/tenant/features/accounting/components/cashbookViewShared";
import { CashbookViewTable } from "@/tenant/features/accounting/components/CashbookViewTable";

interface CashbookViewProps {
  entries: JournalEntry[];
  accounts: Account[];
  /**
   * Cash/bank account configured in Setup → posting rules, when the caller has
   * it. It is always treated as cash even if its code/name look nothing like it.
   */
  configuredCashAccountId?: string | null;
}

export function CashbookView({ entries, accounts, configuredCashAccountId }: CashbookViewProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<EntryType | "all">("all");

  /**
   * Cash accounts are resolved from the chart itself (Asset accounts whose
   * code/subtype/name say cash or bank) instead of the seed chart's literal ids,
   * which only existed for workspaces seeded with that exact chart.
   */
  const cashAccountIds = (() => resolveCashAccountIds(accounts, configuredCashAccountId))();

  const rows = (() => buildCashbookRows(entries, search, filterType, t, { cashAccountIds }))();
  const countByType = (() => countCashbookRowsByType(rows))();

  /**
   * Totals are summed in integer cents (see `sumCashbookTotals`) and converted
   * exactly once — currency is money, and a float reduce can turn 0.1 + 0.2 into
   * 0.30000000000000004 in the figures the user reconciles against.
   */
  const { totalIn, totalOut, balance } = (() => {
    const { totalInCents, totalOutCents, balanceCents } = sumCashbookTotals(rows);
    return {
      totalIn: centsToMoney(totalInCents),
      totalOut: centsToMoney(totalOutCents),
      balance: centsToMoney(balanceCents),
    };
  })();

  return (
    <div className="space-y-4">
      <section aria-label={t("accounting.cashbook.summaryAria")}>
        <ModuleCommandMetricsGrid
          items={[
            { icon: TrendingUp, label: t("accounting.cashbook.moneyIn"), value: formatCurrency(totalIn), accent: "success" },
            { icon: TrendingDown, label: t("accounting.cashbook.moneyOut"), value: formatCurrency(totalOut), accent: "destructive" },
            {
              icon: ArrowUpDown,
              label: t("accounting.cashbook.netBalance"),
              value: formatCurrency(Math.abs(balance)),
              accent: balance >= 0 ? "success" : "destructive",
            },
          ]}
        />
      </section>

      {/*
        Classification is only as good as the chart: say so out loud rather than
        rendering a silently empty or all-transfer cashbook.
      */}
      {cashAccountIds.size === 0 && (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs font-semibold text-warning m-0">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          {t("accounting.cashbook.noCashAccount")}
        </p>
      )}
      {countByType.unclassified > 0 && (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-semibold text-muted-foreground m-0">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          {t("accounting.cashbook.unclassifiedCount", { count: countByType.unclassified })}
        </p>
      )}

      <nav aria-label={t("accounting.cashbook.filterAria")} className="flex flex-wrap items-center gap-2">
        <SearchBar value={search} onChange={setSearch} placeholder={t("reports.widgets.searchRecords")} className="flex-1 min-w-search" />
        <SegmentedPillFilter
          value={filterType}
          onChange={setFilterType}
          options={[
            { value: "all", label: t("accounting.cashbook.all") },
            { value: "in", label: t("accounting.cashbook.moneyIn") },
            { value: "out", label: t("accounting.cashbook.moneyOut") },
            { value: "transfer", label: t("accounting.cashbook.transfers") },
            { value: "unclassified", label: t("accounting.cashbook.unclassified") },
          ]}
        />
      </nav>

      <CashbookViewTable rows={rows} totalIn={totalIn} totalOut={totalOut} formatCurrency={formatCurrency} />
    </div>
  );
}
