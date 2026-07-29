import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart2, TrendingUp, Users, Layers,
  Search, Filter, Receipt, AlertCircle, LucideIcon
} from "lucide-react";
import { ObligationCollection, ObligationType, MujtahidRep, Mujtahid, WakalaType, ObligationDistribution } from '@/lib/data/obligationsData';
import { useMergedObligationUsers } from "@/tenant/features/obligations/hooks/useObligationLookups";
import { ExportToolbar } from "@/components/ui/ExportToolbar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from "recharts";
import { SafeResponsiveContainer } from "@/components/ui/SafeResponsiveContainer";
import { useDebounce } from "@/hooks/useDebounce";
import { DatePicker } from "@/components/ui/DatePicker";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";


import { formatMonthYear, getInitials, formatMoney } from "@mms/shared";
import { useFinanceCurrency } from "@/hooks/useCurrency";

import { StatCard } from "@/components/ui/StatCard";

interface SectionTitleProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  noMargin?: boolean;
}

function SectionTitle({ icon: Icon, title, subtitle, noMargin = false }: SectionTitleProps) {
  return (
    <header className={`flex items-center gap-2.5 ${noMargin ? "" : "mb-3"}`}>
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-foreground m-0">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground m-0">{subtitle}</p>}
      </div>
    </header>
  );
}

export interface ObligationsSummaryProps {
  collections: ObligationCollection[];
  obligationTypes: ObligationType[];
  reps: MujtahidRep[];
  mujtahids: Mujtahid[];
  wakalaTypes: WakalaType[];
  distributions: ObligationDistribution[];
}

/**
 * ObligationsSummary component.
 * Displays KPI cards, charts, and detailed summaries of obligation collections.
 *
 * @param {ObligationsSummaryProps} props
 * @returns {React.ReactElement}
 */
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

  // ── Wakala-wise summary ─────────────────────────────────────────
  /** Shape of each wakala summary entry built from filtered collections. */
  interface WakalaSummaryEntry {
    key: string; label: string; repName: string; mujtahidName: string;
    obligationType: string; count: number; total: number;
    hasWakala: boolean; distributions: ObligationDistribution[];
  }
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
  }, [filtered, reps, mujtahids, wakalaTypes, distributions, obligationTypes]);

  // ── Rep-wise dues summary ───────────────────────────────────────
  /** Shape of each rep summary entry. */
  interface RepSummaryEntry {
    key: string; repName: string; mujtahidName: string;
    count: number; total: number; due: number;
    byType: Record<string, number>;
  }
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
  }, [filtered, reps, mujtahids, wakalaTypes, distributions, obligationTypes]);

  // ── Obligation-type breakdown for chart ────────────────────────
  /** Shape of each type breakdown entry. */
  interface TypeBreakdownEntry { name: string; total: number; count: number; }
  const typeBreakdown = useMemo(() => {
    const typeBreakdownByName: Record<string, TypeBreakdownEntry> = {};
    filtered.forEach((collection) => {
      const name = obligationTypes.find((obligationType) => obligationType.id === collection.obligation_type_id)?.name ?? t("obligations.summary.other");
      if (!typeBreakdownByName[name]) typeBreakdownByName[name] = { name, total: 0, count: 0 };
      typeBreakdownByName[name].total += collection.amount;
      typeBreakdownByName[name].count++;
    });
    return Object.values(typeBreakdownByName).sort((a, b) => b.total - a.total);
  }, [filtered, obligationTypes]);

  // ── Monthly trend ──────────────────────────────────────────────
  /** Shape of each monthly trend entry. */
  interface MonthlyEntry { month: string; total: number; count: number; }
  const monthlyTrend = useMemo(() => {
    const monthlyTrendByMonth: Record<string, MonthlyEntry> = {};
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
  }, [filtered]);

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
      {/* ── Filter Bar ── */}
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
          {/* Search */}
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
          {/* Date From */}
          <div>
            <DatePicker
              value={dateFrom}
              onChange={setDateFrom}
              placeholder={t("obligations.summary.filters.fromDate")}
              className="w-full px-2 py-2 text-xs rounded-lg border border-border bg-background"
            />
          </div>
          {/* Date To */}
          <div>
            <DatePicker
              value={dateTo}
              onChange={setDateTo}
              placeholder={t("obligations.summary.filters.toDate")}
              className="w-full px-2 py-2 text-xs rounded-lg border border-border bg-background"
            />
          </div>
          {/* Rep filter */}
          <FormSelect 
            aria-label={t("obligations.summary.filters.byRepresentativeAria")}
            value={repFilter} 
            onChange={(val) => setRepFilter(val)}
            options={repOptions}
            className="text-xs rounded-lg border border-border bg-background"
          />
          {/* Type filter */}
          <FormSelect 
            aria-label={t("obligations.summary.filters.byTypeAria")}
            value={typeFilter} 
            onChange={(val) => setTypeFilter(val)}
            options={typeOptions}
            className="text-xs rounded-lg border border-border bg-background"
          />
          {/* Received by */}
          <FormSelect 
            aria-label={t("obligations.summary.filters.byCollectorAria")}
            value={userFilter} 
            onChange={(val) => setUserFilter(val)}
            options={userOptions}
            className="text-xs rounded-lg border border-border bg-background"
          />
        </div>
      </Card>

      {/* ── KPI Cards ── */}
      <section aria-label={t("obligations.summary.kpi.aria")} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Receipt}  label={t("obligations.summary.kpi.totalCollections")} value={totalRecords} accent="primary" />
        <StatCard icon={TrendingUp} label={t("obligations.summary.kpi.totalAmountReceived")} value={formatCurrency(totalAmount)} accent="emerald" />
        <StatCard icon={Users} label={t("obligations.summary.kpi.activeReps")} value={uniqueReps} accent="blue" />
        <StatCard icon={Layers} label={t("obligations.summary.kpi.obligationTypes")} value={typeBreakdown.length} accent="amber" />
      </section>

      {/* ── Charts row ── */}
      {filtered.length > 0 && (
        <section aria-label={t("obligations.summary.charts.aria")} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Obligation Type Breakdown */}
          <Card accentColor="primary" className="p-4 bg-card/45 backdrop-blur-sm border-border/80 shadow-sm hover:shadow-md">
            <SectionTitle icon={BarChart2} title={t("obligations.summary.charts.byTypeTitle")} subtitle={t("obligations.summary.charts.byTypeSubtitle")} />
            <SafeResponsiveContainer height={200}>
              <BarChart data={typeBreakdown} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v === 0 ? formatCurrency(0) : `${formatCurrency(Math.round(v / 1000))}k`} />
                <Tooltip formatter={(v) => v !== undefined ? formatCurrency(Number(v)) : ""} />
                <Bar dataKey="total" radius={[6,6,0,0]}>
                  {typeBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </SafeResponsiveContainer>
          </Card>

          {/* Monthly trend */}
          {monthlyTrend.length > 1 ? (
            <Card accentColor="info" className="p-4 bg-card/45 backdrop-blur-sm border-border/80 shadow-sm hover:shadow-md">
              <SectionTitle icon={TrendingUp} title={t("obligations.summary.charts.monthlyTrendTitle")} subtitle={t("obligations.summary.charts.monthlyTrendSubtitle")} />
              <SafeResponsiveContainer height={200}>
                <BarChart data={monthlyTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => v === 0 ? formatCurrency(0) : `${formatCurrency(Math.round(v / 1000))}k`} />
                  <Tooltip formatter={(v) => v !== undefined ? formatCurrency(Number(v)) : ""} />
                  <Bar dataKey="total" fill={primary} radius={[6,6,0,0]} />
                </BarChart>
              </SafeResponsiveContainer>
            </Card>
          ) : (
            /* Pie fallback if single month */
            <Card accentColor="success" className="p-4 bg-card/45 backdrop-blur-sm border-border/80 shadow-sm hover:shadow-md">
              <SectionTitle icon={Layers} title={t("obligations.summary.charts.distributionTitle")} subtitle={t("obligations.summary.charts.distributionSubtitle")} />
              <SafeResponsiveContainer height={200}>
                <PieChart>
                  <Pie data={typeBreakdown} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0)*100).toFixed(0)}%`} labelLine={false}>
                    {typeBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => v !== undefined ? formatCurrency(Number(v)) : ""} />
                </PieChart>
              </SafeResponsiveContainer>
            </Card>
          )}
        </section>
      )}

      {/* ── Wakala-wise Summary ── */}
      <section aria-label={t("obligations.summary.wakala.aria")}>
        <header className="flex items-center justify-between mb-3">
          <SectionTitle icon={Layers} title={t("obligations.summary.wakala.title")} subtitle={t("obligations.summary.wakala.subtitle")} noMargin />
          <ExportToolbar
            title={t("obligations.summary.wakala.title")}
            filename="wakala_summary"
            moduleId="obligations"
            exportLabel={t("obligations.summary.wakala.exportLabel")}
            columns={[
              { header: t("obligations.summary.wakala.colRepWakala"), key: "repName" },
              { header: t("obligations.summary.wakala.colMujtahid"), key: "mujtahidName" },
              { header: t("obligations.summary.wakala.colObligationType"), key: "obligationType" },
              { header: t("obligations.summary.wakala.colCollections"), key: "count" },
              { header: t("obligations.summary.wakala.colTotalAmount", { currency: activeCurrency.code }), key: "totalFmt" },
              { header: t("obligations.summary.wakala.colDistributions"), key: "distFmt" },
            ]}
            rows={wakalaSummary.map((w) => ({
              ...w,
              totalFmt: formatCurrency(w.total),
              distFmt: w.distributions.map((d: ObligationDistribution) => `${d.name} ${d.percentage}%`).join("; ") || "—",
            }))}
          />
        </header>
        {wakalaSummary.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground" role="alert">{t("obligations.summary.emptyFiltered")}</div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="space-y-3 p-3 md:hidden">
              {wakalaSummary.map((w) => (
                <article key={w.key} className="space-y-3 rounded-xl border border-border bg-card p-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground m-0">{w.repName}</h4>
                    {!w.hasWakala && (
                      <span className="inline-flex items-center gap-1 text-xs text-warning font-bold mt-0.5" aria-label={t("obligations.summary.wakala.noConfigAria")}>
                        <AlertCircle className="w-3 h-3" aria-hidden="true" /> {t("obligations.summary.wakala.noConfig")}
                      </span>
                    )}
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.summary.wakala.colMujtahid")}</dt>
                      <dd className="text-xs text-muted-foreground">{w.mujtahidName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.summary.wakala.colObligation")}</dt>
                      <dd><span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">{w.obligationType}</span></dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.summary.wakala.colCollections")}</dt>
                      <dd className="text-sm font-semibold text-foreground">{w.count}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.summary.wakala.colTotalAmountShort")}</dt>
                      <dd className="font-mono font-bold text-success text-sm">{formatCurrency(w.total)}</dd>
                    </div>
                  </dl>
                  {w.distributions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">{t("obligations.summary.wakala.colDistributions")}</p>
                      <div className="flex flex-wrap gap-1">
                        {w.distributions.map((d: ObligationDistribution) => (
                          <span key={d.id} className={`text-xs font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${d.type === "Liability" ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-success/10 border-success/30 text-success"}`}>
                            {d.name} {d.percentage}%
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}
              <article className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs font-bold text-muted-foreground uppercase m-0">{t("obligations.summary.wakala.configCount", { count: wakalaSummary.length })}</p>
                <p className="font-mono font-bold text-success text-sm m-0">{formatCurrency(totalAmount)}</p>
              </article>
            </div>
            <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("obligations.summary.wakala.title")}</caption>
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  <th scope="col" className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.wakala.colRepWakala")}</th>
                  <th scope="col" className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.wakala.colMujtahid")}</th>
                  <th scope="col" className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.wakala.colObligation")}</th>
                  <th scope="col" className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.wakala.colCollections")}</th>
                  <th scope="col" className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.wakala.colTotalAmountShort")}</th>
                  <th scope="col" className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.wakala.colDistributions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {wakalaSummary.map((w) => (
                  <tr key={w.key} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-3">
                      <p className="font-semibold text-foreground text-sm m-0">{w.repName}</p>
                      {!w.hasWakala && (
                        <span className="inline-flex items-center gap-1 text-xs text-warning font-bold mt-0.5" aria-label={t("obligations.summary.wakala.noConfigAria")}>
                          <AlertCircle className="w-3 h-3" aria-hidden="true" /> {t("obligations.summary.wakala.noConfig")}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{w.mujtahidName}</td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-full">{w.obligationType}</span>
                    </td>
                    <td className="px-3 py-3 text-end text-sm font-semibold text-foreground">{w.count}</td>
                    <td className="px-3 py-3 text-end font-mono font-bold text-success text-sm">{formatCurrency(w.total)}</td>
                    <td className="px-3 py-3">
                      {w.distributions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {w.distributions.map((d: ObligationDistribution) => (
                            <span key={d.id} className={`text-xs font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${d.type === "Liability" ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-success/10 border-success/30 text-success"}`}>
                              {d.name} {d.percentage}%
                            </span>
                          ))}
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-border bg-muted/30">
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">{t("obligations.summary.wakala.configCount", { count: wakalaSummary.length })}</td>
                  <td className="px-3 py-2 text-end font-mono font-bold text-success text-xs">{formatCurrency(totalAmount)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
            </div>
          </div>
        )}
      </section>

      {/* ── Rep-wise Dues Summary ── */}
      <section aria-label={t("obligations.summary.rep.aria")}>
        <header className="flex items-center justify-between mb-3">
          <SectionTitle icon={Users} title={t("obligations.summary.rep.title")} subtitle={t("obligations.summary.rep.subtitle")} noMargin />
          <ExportToolbar
            title={t("obligations.summary.rep.title")}
            filename="rep_dues_summary"
            moduleId="obligations"
            exportLabel={t("obligations.summary.rep.exportLabel")}
            columns={[
              { header: t("obligations.summary.rep.colRepresentative"), key: "repName" },
              { header: t("obligations.summary.rep.colMujtahid"), key: "mujtahidName" },
              { header: t("obligations.summary.rep.colByType"), key: "byTypeFmt" },
              { header: t("obligations.summary.rep.colCollections"), key: "count" },
              { header: t("obligations.summary.rep.colTotalCollected", { currency: activeCurrency.code }), key: "totalFmt" },
              { header: t("obligations.summary.rep.colDueToRep", { currency: activeCurrency.code }), key: "dueFmt" },
            ]}
            rows={repSummary.map((r) => ({
              ...r,
              byTypeFmt: Object.entries(r.byType).map(([n, v]) => `${n}: ${formatCurrency(v as number)}`).join("; "),
              totalFmt: formatCurrency(r.total),
              dueFmt: formatCurrency(r.due),
            }))}
          />
        </header>
        {repSummary.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground" role="alert">{t("obligations.summary.emptyFiltered")}</div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="space-y-3 p-3 md:hidden">
              {repSummary.map((r) => (
                <article key={r.key} className="space-y-3 rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                      <span className="text-xs font-bold text-primary">{getInitials(r.repName)}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm m-0">{r.repName}</h4>
                      <p className="text-xs text-muted-foreground m-0">{r.mujtahidName}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">{t("obligations.summary.rep.colByType")}</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(r.byType).map(([name, amount]) => (
                        <span key={name} className="text-xs font-medium px-1.5 py-0.5 rounded bg-muted border border-border text-foreground whitespace-nowrap">
                          {name}: {formatValueOnly(amount as number)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.summary.rep.colCollections")}</dt>
                      <dd className="text-sm font-semibold text-foreground">{r.count}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.summary.rep.colTotalCollectedShort")}</dt>
                      <dd className="font-mono font-bold text-foreground text-sm">{formatCurrency(r.total)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-destructive">{t("obligations.summary.rep.colDueToRepShort")}</dt>
                      <dd className="font-mono font-bold text-destructive text-sm">{formatCurrency(r.due)}</dd>
                    </div>
                  </dl>
                </article>
              ))}
              <article className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs font-bold text-muted-foreground uppercase m-0">{t("obligations.summary.rep.repCount", { count: repSummary.length })}</p>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs font-semibold text-muted-foreground">{t("obligations.summary.rep.colTotalCollectedShort")}</dt>
                    <dd className="font-mono font-bold text-foreground text-xs">{formatCurrency(totalAmount)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-destructive">{t("obligations.summary.rep.colDueToRepShort")}</dt>
                    <dd className="font-mono font-bold text-destructive text-xs">{formatCurrency(repSummary.reduce((sum, representativeSummary) => sum + representativeSummary.due, 0))}</dd>
                  </div>
                </dl>
              </article>
            </div>
            <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("obligations.summary.rep.title")}</caption>
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  <th scope="col" className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.rep.colRepresentative")}</th>
                  <th scope="col" className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.rep.colMujtahid")}</th>
                  <th scope="col" className="px-3 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.rep.colByType")}</th>
                  <th scope="col" className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.rep.colCollections")}</th>
                  <th scope="col" className="px-3 py-2.5 text-end text-xs font-semibold text-muted-foreground uppercase">{t("obligations.summary.rep.colTotalCollectedShort")}</th>
                  <th scope="col" className="px-3 py-2.5 text-end text-xs font-semibold text-destructive uppercase">{t("obligations.summary.rep.colDueToRepShort")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {repSummary.map((r) => (
                  <tr key={r.key} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                          <span className="text-xs font-bold text-primary">{getInitials(r.repName)}</span>
                        </div>
                        <p className="font-semibold text-foreground text-sm m-0">{r.repName}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{r.mujtahidName}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(r.byType).map(([name, amount]) => (
                          <span key={name} className="text-xs font-medium px-1.5 py-0.5 rounded bg-muted border border-border text-foreground whitespace-nowrap">
                            {name}: {formatValueOnly(amount as number)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-end text-sm font-semibold text-foreground">{r.count}</td>
                    <td className="px-3 py-3 text-end font-mono font-bold text-foreground text-sm">{formatCurrency(r.total)}</td>
                    <td className="px-3 py-3 text-end">
                      <span className="font-mono font-bold text-destructive text-sm">{formatCurrency(r.due)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-border bg-muted/30">
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">{t("obligations.summary.rep.repCount", { count: repSummary.length })}</td>
                  <td className="px-3 py-2 text-end font-mono font-bold text-foreground text-xs">{formatCurrency(totalAmount)}</td>
                  <td className="px-3 py-2 text-end font-mono font-bold text-destructive text-xs">{formatCurrency(repSummary.reduce((sum, representativeSummary) => sum + representativeSummary.due, 0))}</td>
                </tr>
              </tfoot>
            </table>
            </div>
          </div>
        )}
      </section>

      {/* ── Obligation type detailed table ── */}
      <section aria-label={t("obligations.summary.types.aria")}>
        <header className="flex items-center justify-between mb-3">
          <SectionTitle icon={BarChart2} title={t("obligations.summary.types.title")} subtitle={t("obligations.summary.types.subtitle")} noMargin />
          <ExportToolbar
            title={t("obligations.summary.types.title")}
            filename="obligation_type_breakdown"
            moduleId="obligations"
            exportLabel={t("obligations.summary.types.exportLabel")}
            columns={[
              { header: t("obligations.summary.types.colType"), key: "name" },
              { header: t("obligations.summary.types.colCollections"), key: "count" },
              { header: t("obligations.summary.types.colTotalAmount", { currency: activeCurrency.code }), key: "totalFmt" },
              { header: t("obligations.summary.types.colShare"), key: "shareFmt" },
            ]}
            rows={typeBreakdown.map((t) => ({
              ...t,
              totalFmt: formatCurrency(t.total),
              shareFmt: totalAmount ? ((t.total / totalAmount) * 100).toFixed(1) + "%" : "0%",
            }))}
          />
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {typeBreakdown.map((typeItem, i) => (
            <Card key={typeItem.name} accentColor="primary" className="p-4 space-y-1.5 bg-card/45 backdrop-blur-sm border-border/80 shadow-sm hover:shadow-md transition-all">
              <header className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground m-0">{typeItem.name}</h3>
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold text-white" style={{ background: COLORS[i % COLORS.length] }}>
                  {typeItem.count}
                </span>
              </header>
              <p className="text-lg font-bold text-foreground font-mono m-0">{formatValueOnly(typeItem.total)}</p>
              <p className="text-xs text-muted-foreground m-0">{t("obligations.summary.types.countWithCurrency", { currency: activeCurrency.code, count: typeItem.count })}</p>
              <div className="w-full bg-muted rounded-full h-1.5 mt-1" role="progressbar" aria-valuenow={totalAmount ? (typeItem.total / totalAmount) * 100 : 0} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-1.5 rounded-full transition-all"
                  style={{ width: `${totalAmount ? (typeItem.total / totalAmount) * 100 : 0}%`, background: COLORS[i % COLORS.length] }} />
              </div>
              <p className="text-xs text-muted-foreground text-end m-0">{totalAmount ? ((typeItem.total / totalAmount) * 100).toFixed(1) : 0}%</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
