import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Filter, Layers, Receipt, Search, TrendingUp, Users } from "lucide-react";
import type { ObligationCollection, ObligationDistribution, ObligationType, Mujtahid, MujtahidRep, WakalaType } from "@/lib/data/obligationsData";
import { useMergedObligationUsers } from "@/tenant/features/obligations/hooks/useObligationLookups";
import { useDebounce } from "@/hooks/useDebounce";
import { DatePicker } from "@/components/ui/DatePicker";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";
import { formatMoney, formatMonthYear } from "@mms/shared";
import { useFinanceCurrency } from "@/hooks/useCurrency";
import { StatCard } from "@/components/ui/StatCard";
import { ObligationsRepDuesSection } from "./ObligationsRepDuesSection";
import type { RepSummaryEntry } from "./ObligationsRepDuesSection";
import { ObligationsSummaryChartsSection } from "./ObligationsSummaryChartsSection";
import type { MonthlyTrendEntry, TypeBreakdownEntry } from "./ObligationsSummaryChartsSection";
import { ObligationsTypeBreakdownSection } from "./ObligationsTypeBreakdownSection";
import { ObligationsWakalaSummarySection } from "./ObligationsWakalaSummarySection";
import type { WakalaSummaryEntry } from "./ObligationsWakalaSummarySection";

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
  const { t } = useTranslation();
  const { formatCurrency, activeCurrency } = useFinanceCurrency();

  const formatValueOnly = (amount: number | string | null | undefined): string => {
    return formatMoney(amount, activeCurrency.code, { excludeCurrency: true });
  };
  const users = useMergedObligationUsers();
  const { primary, secondary, charts } = useBrandPalette();
  const COLORS = useMemo(() => [primary, charts[3], secondary, charts[4], charts[0], charts[2]], [primary, secondary, charts]);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [repFilter, setRepFilter]   = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [search, setSearch]         = useState("");

  const debouncedSearch = useDebounce(search, 300);

  // ── Filtered collections ────────────────────────────────────────
  const filtered = useMemo(() => collections.filter((collection) => {
    if (typeFilter !== "all" && collection.obligation_type_id !== typeFilter) return false;
    if (repFilter  !== "all" && collection.mujtahid_representative_id !== repFilter) return false;
    if (userFilter !== "all" && collection.received_by !== userFilter) return false;
    if (dateFrom && (collection.received_date || "") < dateFrom) return false;
    if (dateTo   && (collection.received_date || "") > dateTo)   return false;
    if (debouncedSearch) {
      const searchQuery = debouncedSearch.toLowerCase();
      const repName = reps.find((rep) => rep.id === collection.mujtahid_representative_id)?.name?.toLowerCase() || "";
      const typeName = obligationTypes.find((obligationType) => obligationType.id === collection.obligation_type_id)?.name?.toLowerCase() || "";
      if (!collection.receipt_no.toLowerCase().includes(searchQuery) && !repName.includes(searchQuery) && !typeName.includes(searchQuery)) return false;
    }
    return true;
  }), [collections, typeFilter, repFilter, userFilter, dateFrom, dateTo, debouncedSearch, reps, obligationTypes]);

  const totalAmount = filtered.reduce((sum, collection) => sum + collection.amount, 0);
  const totalRecords = filtered.length;
  const uniqueReps = new Set(filtered.map((collection) => collection.mujtahid_representative_id)).size;

  const wakalaSummary = useMemo(() => {
    const wakalaSummaryByKey: Record<string, WakalaSummaryEntry> = {};
    filtered.forEach((collection) => {
      const rep = reps.find((candidateRep) => candidateRep.id === collection.mujtahid_representative_id);
      const mujtahid = rep ? mujtahids.find((candidateMujtahid) => candidateMujtahid.id === rep.mujtahid_id) : null;
      const wakalaType = wakalaTypes.find((candidateWakalaType) =>
        candidateWakalaType.mujtahid_representative_id === collection.mujtahid_representative_id &&
        candidateWakalaType.obligation_type_id === collection.obligation_type_id
      );
      const key = wakalaType?.id || `no-wakala-${collection.mujtahid_representative_id}`;
      const label = wakalaType
        ? `${rep?.name ?? "?"} – ${obligationTypes.find((obligationType) => obligationType.id === collection.obligation_type_id)?.name ?? "?"}`
        : `${rep?.name ?? t("obligations.summary.noRep")} (${t("obligations.summary.noWakalaShort")})`;
      if (!wakalaSummaryByKey[key]) {
        wakalaSummaryByKey[key] = {
          key, label,
          repName: rep?.name ?? "—",
          mujtahidName: mujtahid?.name ?? "—",
          obligationType: obligationTypes.find((obligationType) => obligationType.id === collection.obligation_type_id)?.name ?? "—",
          count: 0, total: 0, hasWakala: !!wakalaType,
          distributions: wakalaType ? distributions.filter((distribution) => distribution.wakala_type_id === wakalaType.id) : [],
        };
      }
      wakalaSummaryByKey[key].count++;
      wakalaSummaryByKey[key].total += collection.amount;
    });
    return Object.values(wakalaSummaryByKey).sort((a, b) => b.total - a.total);
  }, [filtered, reps, mujtahids, wakalaTypes, distributions, obligationTypes, t]);

  const repSummary = useMemo(() => {
    const repSummaryByKey: Record<string, RepSummaryEntry> = {};
    filtered.forEach((collection) => {
      const rep = reps.find((candidateRep) => candidateRep.id === collection.mujtahid_representative_id);
      const mujtahid = rep ? mujtahids.find((candidateMujtahid) => candidateMujtahid.id === rep.mujtahid_id) : null;
      const key = collection.mujtahid_representative_id || "none";
      if (!repSummaryByKey[key]) {
        repSummaryByKey[key] = {
          key, repName: rep?.name ?? t("obligations.summary.noRep"),
          mujtahidName: mujtahid?.name ?? "—",
          count: 0, total: 0, due: 0,
          byType: {},
        };
      }
      const amount = collection.amount;
      repSummaryByKey[key].count++;
      repSummaryByKey[key].total += amount;
      // Calculate dues based on distribution percentages
      const wakalaType = wakalaTypes.find((candidateWakalaType) =>
        candidateWakalaType.mujtahid_representative_id === collection.mujtahid_representative_id &&
        candidateWakalaType.obligation_type_id === collection.obligation_type_id
      );
      if (wakalaType) {
        const liabilityDistributions = distributions.filter((distribution) => distribution.wakala_type_id === wakalaType.id && distribution.type === "Liability");
        const totalLiabilityPct = liabilityDistributions.reduce((sum, distribution) => sum + distribution.percentage, 0);
        repSummaryByKey[key].due += amount * (totalLiabilityPct / 100);
      } else {
        repSummaryByKey[key].due += amount; // No wakala config = full amount is due
      }
      const typeName = obligationTypes.find((obligationType) => obligationType.id === collection.obligation_type_id)?.name ?? t("obligations.summary.other");
      repSummaryByKey[key].byType[typeName] = (repSummaryByKey[key].byType[typeName] ?? 0) + amount;
    });
    return Object.values(repSummaryByKey).sort((a, b) => b.total - a.total);
  }, [filtered, reps, mujtahids, wakalaTypes, distributions, obligationTypes, t]);

  const typeBreakdown = useMemo(() => {
    const typeBreakdownByName: Record<string, TypeBreakdownEntry> = {};
    filtered.forEach((collection) => {
      const name = obligationTypes.find((obligationType) => obligationType.id === collection.obligation_type_id)?.name ?? t("obligations.summary.other");
      if (!typeBreakdownByName[name]) typeBreakdownByName[name] = { name, total: 0, count: 0 };
      typeBreakdownByName[name].total += collection.amount;
      typeBreakdownByName[name].count++;
    });
    return Object.values(typeBreakdownByName).sort((a, b) => b.total - a.total);
  }, [filtered, obligationTypes, t]);

  const monthlyTrend = useMemo(() => {
    const monthlyTrendByMonth: Record<string, Omit<MonthlyTrendEntry, "label">> = {};
    filtered.forEach((collection) => {
      const month = collection.received_date?.slice(0, 7) ?? t("obligations.summary.unknown");
      if (!monthlyTrendByMonth[month]) monthlyTrendByMonth[month] = { month, total: 0, count: 0 };
      monthlyTrendByMonth[month].total += collection.amount;
      monthlyTrendByMonth[month].count++;
    });
    return Object.values(monthlyTrendByMonth).sort((a, b) => a.month.localeCompare(b.month)).map((monthlyEntry) => ({
      ...monthlyEntry,
      label: formatMonthYear(monthlyEntry.month + "-01"),
    }));
  }, [filtered, t]);

  const hasFilters = dateFrom || dateTo || repFilter !== "all" || typeFilter !== "all" || userFilter !== "all" || search;

  const repOptions = useMemo(() => [
    { value: "all", label: t("obligations.summary.filters.allReps") },
    ...reps.map((rep) => ({ value: rep.id, label: rep.name }))
  ], [reps, t]);

  const typeOptions = useMemo(() => [
    { value: "all", label: t("obligations.summary.filters.allTypes") },
    ...obligationTypes.map((obligationType) => ({ value: obligationType.id, label: obligationType.name }))
  ], [obligationTypes, t]);

  const userOptions = useMemo(() => [
    { value: "all", label: t("obligations.summary.filters.allCollectors") },
    ...users.map((user) => ({ value: user.id, label: user.name || "" }))
  ], [users, t]);

  return (
    <div className="space-y-6">
      <Card accentColor="primary" className="p-4 space-y-3 bg-card/45 backdrop-blur-sm border-border/80 shadow-sm hover:shadow-md">
        <header className="flex items-center gap-2 mb-1 ps-1">
          <Filter className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-bold text-foreground m-0">{t("obligations.summary.filters.title")}</h2>
          {hasFilters && (
            <Button type="button" onClick={() => { setDateFrom(""); setDateTo(""); setRepFilter("all"); setTypeFilter("all"); setUserFilter("all"); setSearch(""); }}
              variant="link"
              className="ms-auto min-h-11 px-2 text-xs text-primary font-semibold hover:underline shadow-none">{t("obligations.summary.filters.clearAll")}</Button>
          )}
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <div className="relative col-span-2 sm:col-span-1">
            <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <Input 
              type="search"
              aria-label={t("obligations.summary.filters.searchAria")}
              value={search} 
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("obligations.summary.filters.searchPlaceholder")}
              className="w-full ps-8 pe-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" 
            />
          </div>
          <div>
            <DatePicker
              value={dateFrom}
              onChange={setDateFrom}
              placeholder={t("obligations.summary.filters.fromDate")}
              className="w-full px-2 py-2 text-xs rounded-lg border border-border bg-background"
            />
          </div>
          <div>
            <DatePicker
              value={dateTo}
              onChange={setDateTo}
              placeholder={t("obligations.summary.filters.toDate")}
              className="w-full px-2 py-2 text-xs rounded-lg border border-border bg-background"
            />
          </div>
          <FormSelect 
            aria-label={t("obligations.summary.filters.byRepresentativeAria")}
            value={repFilter} 
            onChange={(val) => setRepFilter(val)}
            options={repOptions}
            className="text-xs rounded-lg border border-border bg-background"
          />
          <FormSelect 
            aria-label={t("obligations.summary.filters.byTypeAria")}
            value={typeFilter} 
            onChange={(val) => setTypeFilter(val)}
            options={typeOptions}
            className="text-xs rounded-lg border border-border bg-background"
          />
          <FormSelect 
            aria-label={t("obligations.summary.filters.byCollectorAria")}
            value={userFilter} 
            onChange={(val) => setUserFilter(val)}
            options={userOptions}
            className="text-xs rounded-lg border border-border bg-background"
          />
        </div>
      </Card>

      <section aria-label={t("obligations.summary.kpi.aria")} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Receipt}  label={t("obligations.summary.kpi.totalCollections")} value={totalRecords} accent="primary" />
        <StatCard icon={TrendingUp} label={t("obligations.summary.kpi.totalAmountReceived")} value={formatCurrency(totalAmount)} accent="emerald" />
        <StatCard icon={Users} label={t("obligations.summary.kpi.activeReps")} value={uniqueReps} accent="blue" />
        <StatCard icon={Layers} label={t("obligations.summary.kpi.obligationTypes")} value={typeBreakdown.length} accent="amber" />
      </section>

      <ObligationsSummaryChartsSection
        filteredCount={filtered.length}
        typeBreakdown={typeBreakdown}
        monthlyTrend={monthlyTrend}
        colors={COLORS}
        primary={primary}
        formatCurrency={formatCurrency}
      />

      <ObligationsWakalaSummarySection
        wakalaSummary={wakalaSummary}
        totalAmount={totalAmount}
        activeCurrencyCode={activeCurrency.code}
        formatCurrency={formatCurrency}
      />

      <ObligationsRepDuesSection
        repSummary={repSummary}
        totalAmount={totalAmount}
        activeCurrencyCode={activeCurrency.code}
        formatCurrency={formatCurrency}
        formatValueOnly={formatValueOnly}
      />

      <ObligationsTypeBreakdownSection
        typeBreakdown={typeBreakdown}
        colors={COLORS}
        totalAmount={totalAmount}
        activeCurrencyCode={activeCurrency.code}
        formatCurrency={formatCurrency}
        formatValueOnly={formatValueOnly}
      />
    </div>
  );
}
