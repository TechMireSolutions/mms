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


import { formatMoney, formatMonthYear, getInitials } from "@mms/shared";

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
        {subtitle && <p className="text-[11px] text-muted-foreground m-0">{subtitle}</p>}
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
        : `${rep?.name ?? "No Rep"} (No Wakala)`;
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
          key, repName: rep?.name ?? "No Rep",
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
      const typeName = obligationTypes.find((obligationType) => obligationType.id === collection.obligation_type_id)?.name ?? "Other";
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
      const name = obligationTypes.find((obligationType) => obligationType.id === collection.obligation_type_id)?.name ?? "Other";
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
      const month = collection.received_date?.slice(0, 7) ?? "Unknown";
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
    { value: "all", label: "All Reps" },
    ...reps.map((rep) => ({ value: rep.id, label: rep.name }))
  ], [reps]);

  const typeOptions = useMemo(() => [
    { value: "all", label: "All Obligation Types" },
    ...obligationTypes.map((obligationType) => ({ value: obligationType.id, label: obligationType.name }))
  ], [obligationTypes]);

  const userOptions = useMemo(() => [
    { value: "all", label: "All Collectors" },
    ...users.map((user) => ({ value: user.id, label: user.name || "" }))
  ], [users]);

  return (
    <div className="space-y-6">
      {/* ── Filter Bar ── */}
      <Card accentColor="primary" className="p-4 space-y-3 bg-card/45 backdrop-blur-sm border-border/80 shadow-sm hover:shadow-md">
        <header className="flex items-center gap-2 mb-1 pl-1">
          <Filter className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-bold text-foreground m-0">Filters</h2>
          {hasFilters && (
            <Button type="button" onClick={() => { setDateFrom(""); setDateTo(""); setRepFilter("all"); setTypeFilter("all"); setUserFilter("all"); setSearch(""); }}
              variant="link"
              className="ml-auto p-0 text-[11px] h-auto text-primary font-semibold hover:underline shadow-none">Clear all</Button>
          )}
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Search */}
          <div className="relative col-span-2 sm:col-span-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <Input 
              type="search"
              aria-label="Search by receipt, rep, or type"
              value={search} 
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Receipt, rep, type…"
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" 
            />
          </div>
          {/* Date From */}
          <div>
            <DatePicker
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="From Date"
              className="w-full px-2 py-2 text-xs rounded-lg border border-border bg-background"
            />
          </div>
          {/* Date To */}
          <div>
            <DatePicker
              value={dateTo}
              onChange={setDateTo}
              placeholder="To Date"
              className="w-full px-2 py-2 text-xs rounded-lg border border-border bg-background"
            />
          </div>
          {/* Rep filter */}
          <FormSelect 
            aria-label="Filter by representative"
            value={repFilter} 
            onChange={(val) => setRepFilter(val)}
            options={repOptions}
            className="text-xs rounded-lg border border-border bg-background"
          />
          {/* Type filter */}
          <FormSelect 
            aria-label="Filter by obligation type"
            value={typeFilter} 
            onChange={(val) => setTypeFilter(val)}
            options={typeOptions}
            className="text-xs rounded-lg border border-border bg-background"
          />
          {/* Received by */}
          <FormSelect 
            aria-label="Filter by collector"
            value={userFilter} 
            onChange={(val) => setUserFilter(val)}
            options={userOptions}
            className="text-xs rounded-lg border border-border bg-background"
          />
        </div>
      </Card>

      {/* ── KPI Cards ── */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Receipt}  label="Total Collections"     value={totalRecords}               accent="primary" />
        <StatCard icon={TrendingUp} label="Total Amount Received" value={formatMoney(totalAmount)}          accent="emerald" />
        <StatCard icon={Users}    label="Active Reps"            value={uniqueReps}                 accent="blue" />
        <StatCard icon={Layers}   label="Obligation Types"       value={typeBreakdown.length}        accent="amber" />
      </section>

      {/* ── Charts row ── */}
      {filtered.length > 0 && (
        <section aria-label="Charts" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Obligation Type Breakdown */}
          <Card accentColor="primary" className="p-4 bg-card/45 backdrop-blur-sm border-border/80 shadow-sm hover:shadow-md">
            <SectionTitle icon={BarChart2} title="Collection by Obligation Type" subtitle="Total amount per type" />
            <SafeResponsiveContainer height={200}>
              <BarChart data={typeBreakdown} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => v !== undefined ? formatMoney(Number(v)) : ""} />
                <Bar dataKey="total" radius={[6,6,0,0]}>
                  {typeBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </SafeResponsiveContainer>
          </Card>

          {/* Monthly trend */}
          {monthlyTrend.length > 1 ? (
            <Card accentColor="indigo" className="p-4 bg-card/45 backdrop-blur-sm border-border/80 shadow-sm hover:shadow-md">
              <SectionTitle icon={TrendingUp} title="Monthly Collection Trend" subtitle="Amounts received per month" />
              <SafeResponsiveContainer height={200}>
                <BarChart data={monthlyTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => v !== undefined ? formatMoney(Number(v)) : ""} />
                  <Bar dataKey="total" fill={primary} radius={[6,6,0,0]} />
                </BarChart>
              </SafeResponsiveContainer>
            </Card>
          ) : (
            /* Pie fallback if single month */
            <Card accentColor="success" className="p-4 bg-card/45 backdrop-blur-sm border-border/80 shadow-sm hover:shadow-md">
              <SectionTitle icon={Layers} title="Distribution by Type" subtitle="Share of total" />
              <SafeResponsiveContainer height={200}>
                <PieChart>
                  <Pie data={typeBreakdown} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0)*100).toFixed(0)}%`} labelLine={false}>
                    {typeBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => v !== undefined ? formatMoney(Number(v)) : ""} />
                </PieChart>
              </SafeResponsiveContainer>
            </Card>
          )}
        </section>
      )}

      {/* ── Wakala-wise Summary ── */}
      <section aria-label="Wakala-wise Collection Summary">
        <header className="flex items-center justify-between mb-3">
          <SectionTitle icon={Layers} title="Wakala-wise Collection Summary" subtitle="Breakdown per Wakala configuration" noMargin />
          <ExportToolbar
            title="Wakala-wise Collection Summary"
            filename="wakala_summary"
            moduleId="obligations"
            exportLabel="Wakala summary export"
            columns={[
              { header: "Rep / Wakala", key: "repName" },
              { header: "Mujtahid", key: "mujtahidName" },
              { header: "Obligation Type", key: "obligationType" },
              { header: "Collections", key: "count" },
              { header: "Total Amount (PKR)", key: "totalFmt" },
              { header: "Distributions", key: "distFmt" },
            ]}
            rows={wakalaSummary.map((w) => ({
              ...w,
              totalFmt: w.total.toLocaleString(),
              distFmt: w.distributions.map((d: ObligationDistribution) => `${d.name} ${d.percentage}%`).join("; ") || "—",
            }))}
          />
        </header>
        {wakalaSummary.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground" role="alert">No data for selected filters.</div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <caption className="sr-only">Wakala-wise Collection Summary</caption>
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Wakala / Rep</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Mujtahid</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Obligation</th>
                  <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">Collections</th>
                  <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">Total Amount</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Distributions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {wakalaSummary.map((w) => (
                  <tr key={w.key} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-3">
                      <p className="font-semibold text-foreground text-sm m-0">{w.repName}</p>
                      {!w.hasWakala && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-warning font-bold mt-0.5" aria-label="No Wakala Config">
                          <AlertCircle className="w-3 h-3" aria-hidden="true" /> No Wakala Config
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{w.mujtahidName}</td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">{w.obligationType}</span>
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-foreground">{w.count}</td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-success text-sm">{formatMoney(w.total)}</td>
                    <td className="px-3 py-3">
                      {w.distributions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {w.distributions.map((d: ObligationDistribution) => (
                            <span key={d.id} className={`text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${d.type === "Liability" ? "bg-destructive/10 border-destructive/30 text-destructive" : "bg-success/10 border-success/30 text-success"}`}>
                              {d.name} {d.percentage}%
                            </span>
                          ))}
                        </div>
                      ) : <span className="text-[11px] text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-border bg-muted/30">
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">{wakalaSummary.length} wakala config{wakalaSummary.length !== 1 ? "s" : ""}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-success text-xs">{formatMoney(totalAmount)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* ── Rep-wise Dues Summary ── */}
      <section aria-label="Rep-wise Dues Summary">
        <header className="flex items-center justify-between mb-3">
          <SectionTitle icon={Users} title="Rep-wise Dues Summary" subtitle="How much is due to each representative based on distribution" noMargin />
          <ExportToolbar
            title="Rep-wise Dues Summary"
            filename="rep_dues_summary"
            moduleId="obligations"
            exportLabel="Rep dues summary export"
            columns={[
              { header: "Representative", key: "repName" },
              { header: "Mujtahid", key: "mujtahidName" },
              { header: "By Obligation Type", key: "byTypeFmt" },
              { header: "Collections", key: "count" },
              { header: "Total Collected (PKR)", key: "totalFmt" },
              { header: "Due to Rep (PKR)", key: "dueFmt" },
            ]}
            rows={repSummary.map((r) => ({
              ...r,
              byTypeFmt: Object.entries(r.byType).map(([n, v]) => `${n}: ${(v as number).toLocaleString()}`).join("; "),
              totalFmt: r.total.toLocaleString(),
              dueFmt: r.due.toLocaleString(),
            }))}
          />
        </header>
        {repSummary.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground" role="alert">No data for selected filters.</div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <caption className="sr-only">Rep-wise Dues Summary</caption>
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Representative</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">Mujtahid</th>
                  <th scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase">By Obligation Type</th>
                  <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">Collections</th>
                  <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-muted-foreground uppercase">Total Collected</th>
                  <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-destructive uppercase">Due to Rep</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {repSummary.map((r) => (
                  <tr key={r.key} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                          <span className="text-[10px] font-bold text-primary">{getInitials(r.repName)}</span>
                        </div>
                        <p className="font-semibold text-foreground text-sm m-0">{r.repName}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{r.mujtahidName}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(r.byType).map(([name, amount]) => (
                          <span key={name} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted border border-border text-foreground whitespace-nowrap">
                            {name}: {formatMoney(amount as number).replace("PKR ", "")}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-foreground">{r.count}</td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-foreground text-sm">{formatMoney(r.total)}</td>
                    <td className="px-3 py-3 text-right">
                      <span className="font-mono font-bold text-destructive text-sm">{formatMoney(r.due)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-border bg-muted/30">
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">{repSummary.length} rep{repSummary.length !== 1 ? "s" : ""}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-foreground text-xs">{formatMoney(totalAmount)}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-destructive text-xs">{formatMoney(repSummary.reduce((sum, representativeSummary) => sum + representativeSummary.due, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* ── Obligation type detailed table ── */}
      <section aria-label="Obligation Type Breakdown">
        <header className="flex items-center justify-between mb-3">
          <SectionTitle icon={BarChart2} title="Obligation Type Breakdown" subtitle="Collection count and totals per type" noMargin />
          <ExportToolbar
            title="Obligation Type Breakdown"
            filename="obligation_type_breakdown"
            moduleId="obligations"
            exportLabel="Obligation type breakdown export"
            columns={[
              { header: "Obligation Type", key: "name" },
              { header: "Collections", key: "count" },
              { header: "Total Amount (PKR)", key: "totalFmt" },
              { header: "Share (%)", key: "shareFmt" },
            ]}
            rows={typeBreakdown.map((t) => ({
              ...t,
              totalFmt: t.total.toLocaleString(),
              shareFmt: totalAmount ? ((t.total / totalAmount) * 100).toFixed(1) + "%" : "0%",
            }))}
          />
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {typeBreakdown.map((t, i) => (
            <Card key={t.name} accentColor="primary" className="p-4 space-y-1.5 bg-card/45 backdrop-blur-sm border-border/80 shadow-sm hover:shadow-md transition-all">
              <header className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground m-0">{t.name}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ background: COLORS[i % COLORS.length] }}>
                  {t.count}
                </span>
              </header>
              <p className="text-lg font-bold text-foreground font-mono m-0">{formatMoney(t.total).replace("PKR ", "")}</p>
              <p className="text-[10px] text-muted-foreground m-0">PKR · {t.count} collection{t.count !== 1 ? "s" : ""}</p>
              <div className="w-full bg-muted rounded-full h-1.5 mt-1" role="progressbar" aria-valuenow={totalAmount ? (t.total / totalAmount) * 100 : 0} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-1.5 rounded-full transition-all"
                  style={{ width: `${totalAmount ? (t.total / totalAmount) * 100 : 0}%`, background: COLORS[i % COLORS.length] }} />
              </div>
              <p className="text-[10px] text-muted-foreground text-right m-0">{totalAmount ? ((t.total / totalAmount) * 100).toFixed(1) : 0}%</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
