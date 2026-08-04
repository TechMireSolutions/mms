import { Layers, Receipt, TrendingUp, Users } from "lucide-react";
import type { ObligationCollection, ObligationDistribution, ObligationType, Mujtahid, MujtahidRep, WakalaType } from "@/lib/data/obligationsData";
import { formatMoney } from "@mms/shared";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { ObligationsRepDuesSection } from "./ObligationsRepDuesSection";
import { ObligationsSummaryChartsSection } from "./ObligationsSummaryChartsSection";
import { ObligationsTypeBreakdownSection } from "./ObligationsTypeBreakdownSection";
import { ObligationsWakalaSummarySection } from "./ObligationsWakalaSummarySection";
import { useObligationsSummaryModel } from "./useObligationsSummaryModel";
import { ObligationsSummaryFilters } from "./ObligationsSummaryFilters";

export interface ObligationsSummaryProps {
  collections: ObligationCollection[];
  obligationTypes: ObligationType[];
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  wakalaTypes: WakalaType[];
  distributions: ObligationDistribution[];
}

export function ObligationsSummary({
  collections, obligationTypes, reps, mujtahids, wakalaTypes, distributions
}: ObligationsSummaryProps) {
  const { formatCurrency, activeCurrency } = useFinanceCurrency();
  const formatValueOnly = (amount: number | string | null | undefined): string => {
    return formatMoney(amount, activeCurrency.code, { excludeCurrency: true });
  };

  const model = useObligationsSummaryModel(
    collections, obligationTypes, reps, mujtahids, wakalaTypes, distributions,
  );

  return (
    <div className="space-y-6">
      <ObligationsSummaryFilters
        search={model.search}
        dateFrom={model.dateFrom}
        dateTo={model.dateTo}
        repFilter={model.repFilter}
        typeFilter={model.typeFilter}
        userFilter={model.userFilter}
        hasFilters={model.hasFilters}
        repOptions={model.repOptions}
        typeOptions={model.typeOptions}
        userOptions={model.userOptions}
        onSearchChange={model.setSearch}
        onDateFromChange={model.setDateFrom}
        onDateToChange={model.setDateTo}
        onRepFilterChange={model.setRepFilter}
        onTypeFilterChange={model.setTypeFilter}
        onUserFilterChange={model.setUserFilter}
        onClearFilters={model.clearFilters}
      />

      <section aria-label={model.t("obligations.summary.kpi.aria")}>
        <ModuleCommandMetricsGrid
          items={[
            { icon: Receipt, label: model.t("obligations.summary.kpi.totalCollections"), value: model.totalRecords, accent: "primary" },
            { icon: TrendingUp, label: model.t("obligations.summary.kpi.totalAmountReceived"), value: formatCurrency(model.totalAmount), accent: "emerald" },
            { icon: Users, label: model.t("obligations.summary.kpi.activeReps"), value: model.uniqueReps, accent: "blue" },
            { icon: Layers, label: model.t("obligations.summary.kpi.obligationTypes"), value: model.typeBreakdown.length, accent: "amber" },
          ]}
        />
      </section>

      <ObligationsSummaryChartsSection
        filteredCount={model.filtered.length}
        typeBreakdown={model.typeBreakdown}
        monthlyTrend={model.monthlyTrend}
        colors={model.COLORS}
        primary={model.primary}
        formatCurrency={formatCurrency}
      />

      <ObligationsWakalaSummarySection
        wakalaSummary={model.wakalaSummary}
        totalAmount={model.totalAmount}
        activeCurrencyCode={activeCurrency.code}
        formatCurrency={formatCurrency}
      />

      <ObligationsRepDuesSection
        repSummary={model.repSummary}
        totalAmount={model.totalAmount}
        activeCurrencyCode={activeCurrency.code}
        formatCurrency={formatCurrency}
        formatValueOnly={formatValueOnly}
      />

      <ObligationsTypeBreakdownSection
        typeBreakdown={model.typeBreakdown}
        colors={model.COLORS}
        totalAmount={model.totalAmount}
        activeCurrencyCode={activeCurrency.code}
        formatCurrency={formatCurrency}
        formatValueOnly={formatValueOnly}
      />
    </div>
  );
}
