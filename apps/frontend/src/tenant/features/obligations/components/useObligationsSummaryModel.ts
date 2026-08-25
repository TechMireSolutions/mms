import { useMemo, useState } from "react";
import type { ObligationCollection, ObligationDistribution, ObligationType, Mujtahid, MujtahidRep, WakalaType } from "@/lib/data/obligationsData";
import { useMergedObligationUsers } from "@/tenant/features/obligations/hooks/useObligationLookups";
import { useDebounce } from "@/hooks/useDebounce";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { useTranslation } from "@/hooks/useTranslation";
import { formatMonthYear } from "@mms/shared";
import type { RepSummaryEntry } from "./ObligationsRepDuesSection";
import type { MonthlyTrendEntry, TypeBreakdownEntry } from "./ObligationsSummaryChartsSection";
import type { WakalaSummaryEntry } from "./ObligationsWakalaSummarySection";

export interface ObligationsSummaryFilterState {
  dateFrom: string;
  dateTo: string;
  repFilter: string;
  typeFilter: string;
  userFilter: string;
  search: string;
}

export function useObligationsSummaryModel(
  collections: ObligationCollection[] | null = [],
  obligationTypes: ObligationType[] | null = [],
  reps: MujtahidRep[] | null = [],
  mujtahids: Mujtahid[] | null = [],
  wakalaTypes: WakalaType[] | null = [],
  distributions: ObligationDistribution[] | null = [],
) {
  collections = Array.isArray(collections) ? collections : [];
  obligationTypes = Array.isArray(obligationTypes) ? obligationTypes : [];
  reps = Array.isArray(reps) ? reps : [];
  mujtahids = Array.isArray(mujtahids) ? mujtahids : [];
  wakalaTypes = Array.isArray(wakalaTypes) ? wakalaTypes : [];
  distributions = Array.isArray(distributions) ? distributions : [];
  const { t } = useTranslation();
  const usersRaw = useMergedObligationUsers();
  const users = Array.isArray(usersRaw) ? usersRaw : [];
  const { primary, secondary, charts } = useBrandPalette();
  const COLORS = useMemo(() => [primary, charts[3], secondary, charts[4], charts[0], charts[2]], [primary, secondary, charts]);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [repFilter, setRepFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => collections.filter((collection) => {
    if (typeFilter !== "all" && collection.obligation_type_id !== typeFilter) return false;
    if (repFilter !== "all" && collection.mujtahid_representative_id !== repFilter) return false;
    if (userFilter !== "all" && collection.received_by !== userFilter) return false;
    if (dateFrom && (collection.received_date || "") < dateFrom) return false;
    if (dateTo && (collection.received_date || "") > dateTo) return false;
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
      const wakalaType = wakalaTypes.find((candidateWakalaType) =>
        candidateWakalaType.mujtahid_representative_id === collection.mujtahid_representative_id &&
        candidateWakalaType.obligation_type_id === collection.obligation_type_id
      );
      if (wakalaType) {
        const liabilityDistributions = distributions.filter((distribution) => distribution.wakala_type_id === wakalaType.id && distribution.type === "Liability");
        const totalLiabilityPct = liabilityDistributions.reduce((sum, distribution) => sum + distribution.percentage, 0);
        repSummaryByKey[key].due += amount * (totalLiabilityPct / 100);
      } else {
        repSummaryByKey[key].due += amount;
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

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setRepFilter("all");
    setTypeFilter("all");
    setUserFilter("all");
    setSearch("");
  };

  return {
    t,
    COLORS,
    primary,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    repFilter,
    setRepFilter,
    typeFilter,
    setTypeFilter,
    userFilter,
    setUserFilter,
    search,
    setSearch,
    filtered,
    totalAmount,
    totalRecords,
    uniqueReps,
    wakalaSummary,
    repSummary,
    typeBreakdown,
    monthlyTrend,
    hasFilters,
    repOptions,
    typeOptions,
    userOptions,
    clearFilters,
  };
}
