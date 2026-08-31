import { useState } from "react";
import { TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";
import { JournalEntry, Account } from '@/lib/data/accountingData';
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { SegmentedPillFilter } from "@/components/ui/SegmentedPillFilter";
import { useTranslation } from "@/hooks/useTranslation";
import { useAccountingCurrency } from "@/hooks/useCurrency";
import { buildCashbookRows, type EntryType } from "@/tenant/features/accounting/components/cashbookViewShared";
import { CashbookViewTable } from "@/tenant/features/accounting/components/CashbookViewTable";

interface CashbookViewProps {
  entries: JournalEntry[];
  accounts: Account[];
}

export function CashbookView({ entries, accounts: _accounts }: CashbookViewProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useAccountingCurrency();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<EntryType | "all">("all");

  const rows = (() => buildCashbookRows(entries, search, filterType, t))();

  const totalIn = rows.filter((cashbookRow) => cashbookRow.flowType === "in").reduce((sum, cashbookRow) => sum + cashbookRow.flowAmount, 0);
  const totalOut = rows.filter((cashbookRow) => cashbookRow.flowType === "out").reduce((sum, cashbookRow) => sum + cashbookRow.flowAmount, 0);
  const balance = totalIn - totalOut;

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
          ]}
        />
      </nav>

      <CashbookViewTable rows={rows} totalIn={totalIn} totalOut={totalOut} formatCurrency={formatCurrency} />
    </div>
  );
}
