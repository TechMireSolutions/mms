import React, { useState, useMemo } from "react";
import {
  BarChart2, TrendingUp, Users, Layers,
  Search, Filter, ArrowUpRight, Receipt, AlertCircle, LucideIcon
} from "lucide-react";
import { ObligationCollection, ObligationType, MujtahidRep, Mujtahid, WakalaType, ObligationDistribution } from "../../lib/obligationsData";
import { useMergedObligationUsers } from "../../hooks/useObligationLookups";
import ExportToolbar from "./ExportToolbar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import useDebounce from "../../hooks/useDebounce";
import { DatePicker } from "../ui/DatePicker";

const COLORS = ["#059669","#2563eb","#d97706","#7c3aed","#dc2626","#0891b2"];

function fmt(amount: string | number | null | undefined, code = "PKR"): string {
  return `${code} ${parseFloat(amount as string || "0").toLocaleString()}`;
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color?: "primary" | "emerald" | "blue" | "amber" | "purple";
  trend?: number;
}

function StatCard({ label, value, sub, icon: Icon, color = "primary", trend }: StatCardProps) {
  const colorMap: Record<string, { bg: string, text: string, iconBg: string }> = {
    primary:  { bg: "bg-primary/8",  text: "text-primary",  iconBg: "bg-primary/10" },
    emerald:  { bg: "bg-emerald-50",  text: "text-emerald-700", iconBg: "bg-emerald-100" },
    blue:     { bg: "bg-blue-50",     text: "text-blue-700",    iconBg: "bg-blue-100" },
    amber:    { bg: "bg-amber-50",    text: "text-amber-700",   iconBg: "bg-amber-100" },
    purple:   { bg: "bg-purple-50",   text: "text-purple-700",  iconBg: "bg-purple-100" },
  };
  const c = colorMap[color];
  return (
    <article className={`rounded-xl border border-border ${c.bg} p-4 space-y-2`}>
      <header className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl ${c.iconBg} flex items-center justify-center`} aria-hidden="true">
          <Icon className={`w-4.5 h-4.5 ${c.text}`} style={{ width: 18, height: 18 }} />
        </div>
        {trend !== undefined && (
          <span className={`text-[11px] font-bold flex items-center gap-0.5 ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`} aria-label={trend >= 0 ? "Positive trend" : "Negative trend"}>
            <ArrowUpRight className="w-3 h-3" style={{ transform: trend < 0 ? "rotate(180deg)" : undefined }} aria-hidden="true" />
            {Math.abs(trend)}%
          </span>
        )}
      </header>
      <div>
        <p className={`text-xl font-bold ${c.text} m-0`}>{value}</p>
        <h3 className="text-xs font-semibold text-muted-foreground m-0">{label}</h3>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5 m-0">{sub}</p>}
      </div>
    </article>
  );
}

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
export default function ObligationsSummary({
  collections, obligationTypes, reps, mujtahids, wakalaTypes, distributions
}: ObligationsSummaryProps) {
  const users = useMergedObligationUsers();

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [repFilter, setRepFilter]   = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [search, setSearch]         = useState("");

  const debouncedSearch = useDebounce(search, 300);

  // ── Filtered collections ────────────────────────────────────────
  const filtered = useMemo(() => collections.filter((c) => {
    if (typeFilter !== "all" && c.obligation_type_id !== typeFilter) return false;
    if (repFilter  !== "all" && c.mujtahid_representative_id !== repFilter) return false;
    if (userFilter !== "all" && c.received_by !== userFilter) return false;
    if (dateFrom && (c.received_date || "") < dateFrom) return false;
    if (dateTo   && (c.received_date || "") > dateTo)   return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      const repName = reps.find((r) => r.id === c.mujtahid_representative_id)?.name?.toLowerCase() || "";
      const typeName = obligationTypes.find((t) => t.id === c.obligation_type_id)?.name?.toLowerCase() || "";
      if (!c.receipt_no.toLowerCase().includes(q) && !repName.includes(q) && !typeName.includes(q)) return false;
    }
    return true;
  }), [collections, typeFilter, repFilter, userFilter, dateFrom, dateTo, debouncedSearch, reps, obligationTypes]);

  const totalAmount = filtered.reduce((s, c) => s + c.amount, 0);
  const totalRecords = filtered.length;
  const uniqueReps = new Set(filtered.map((c) => c.mujtahid_representative_id)).size;

  // ── Wakala-wise summary ─────────────────────────────────────────
  /** Shape of each wakala summary entry built from filtered collections. */
  interface WakalaSummaryEntry {
    key: string; label: string; repName: string; mujtahidName: string;
    obligationType: string; count: number; total: number;
    hasWakala: boolean; distributions: ObligationDistribution[];
  }
  const wakalaSummary = useMemo(() => {
    const map: Record<string, WakalaSummaryEntry> = {};
    filtered.forEach((c) => {
      const rep = reps.find((r) => r.id === c.mujtahid_representative_id);
      const mujtahid = rep ? mujtahids.find((m) => m.id === rep.mujtahid_id) : null;
      const wt = wakalaTypes.find((w) =>
        w.mujtahid_representative_id === c.mujtahid_representative_id &&
        w.obligation_type_id === c.obligation_type_id
      );
      const key = wt?.id || `no-wakala-${c.mujtahid_representative_id}`;
      const label = wt
        ? `${rep?.name ?? "?"} – ${obligationTypes.find((t) => t.id === c.obligation_type_id)?.name ?? "?"}`
        : `${rep?.name ?? "No Rep"} (No Wakala)`;
      if (!map[key]) {
        map[key] = {
          key, label,
          repName: rep?.name ?? "—",
          mujtahidName: mujtahid?.name ?? "—",
          obligationType: obligationTypes.find((t) => t.id === c.obligation_type_id)?.name ?? "—",
          count: 0, total: 0, hasWakala: !!wt,
          distributions: wt ? distributions.filter((d) => d.wakala_type_id === wt.id) : [],
        };
      }
      map[key].count++;
      map[key].total += c.amount;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filtered, reps, mujtahids, wakalaTypes, distributions, obligationTypes]);

  // ── Rep-wise dues summary ───────────────────────────────────────
  /** Shape of each rep summary entry. */
  interface RepSummaryEntry {
    key: string; repName: string; mujtahidName: string;
    count: number; total: number; due: number;
    byType: Record<string, number>;
  }
  const repSummary = useMemo(() => {
    const map: Record<string, RepSummaryEntry> = {};
    filtered.forEach((c) => {
      const rep = reps.find((r) => r.id === c.mujtahid_representative_id);
      const mujtahid = rep ? mujtahids.find((m) => m.id === rep.mujtahid_id) : null;
      const key = c.mujtahid_representative_id || "none";
      if (!map[key]) {
        map[key] = {
          key, repName: rep?.name ?? "No Rep",
          mujtahidName: mujtahid?.name ?? "—",
          count: 0, total: 0, due: 0,
          byType: {},
        };
      }
      const amount = c.amount;
      map[key].count++;
      map[key].total += amount;
      // Calculate dues based on distribution percentages
      const wt = wakalaTypes.find((w) =>
        w.mujtahid_representative_id === c.mujtahid_representative_id &&
        w.obligation_type_id === c.obligation_type_id
      );
      if (wt) {
        const liabilityDist = distributions.filter((d) => d.wakala_type_id === wt.id && d.type === "Liability");
        const totalLiabilityPct = liabilityDist.reduce((s, d) => s + d.percentage, 0);
        map[key].due += amount * (totalLiabilityPct / 100);
      } else {
        map[key].due += amount; // No wakala config = full amount is due
      }
      const typeName = obligationTypes.find((t) => t.id === c.obligation_type_id)?.name ?? "Other";
      map[key].byType[typeName] = (map[key].byType[typeName] ?? 0) + amount;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filtered, reps, mujtahids, wakalaTypes, distributions, obligationTypes]);

  // ── Obligation-type breakdown for chart ────────────────────────
  /** Shape of each type breakdown entry. */
  interface TypeBreakdownEntry { name: string; total: number; count: number; }
  const typeBreakdown = useMemo(() => {
    const map: Record<string, TypeBreakdownEntry> = {};
    filtered.forEach((c) => {
      const name = obligationTypes.find((t) => t.id === c.obligation_type_id)?.name ?? "Other";
      if (!map[name]) map[name] = { name, total: 0, count: 0 };
      map[name].total += c.amount;
      map[name].count++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filtered, obligationTypes]);

  // ── Monthly trend ──────────────────────────────────────────────
  /** Shape of each monthly trend entry. */
  interface MonthlyEntry { month: string; total: number; count: number; }
  const monthlyTrend = useMemo(() => {
    const map: Record<string, MonthlyEntry> = {};
    filtered.forEach((c) => {
      const month = c.received_date?.slice(0, 7) ?? "Unknown";
      if (!map[month]) map[month] = { month, total: 0, count: 0 };
      map[month].total += c.amount;
      map[month].count++;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).map((m) => ({
      ...m,
      label: new Date(m.month + "-01").toLocaleDateString("en-PK", { month: "short", year: "2-digit" }),
    }));
  }, [filtered]);

  const hasFilters = dateFrom || dateTo || repFilter !== "all" || typeFilter !== "all" || userFilter !== "all" || search;

  return (
    <div className="space-y-6">
      {/* ── Filter Bar ── */}
      <section aria-label="Filters" className="rounded-xl border border-border bg-card p-4 space-y-3">
        <header className="flex items-center gap-2 mb-1">
          <Filter className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-bold text-foreground m-0">Filters</h2>
          {hasFilters && (
            <button type="button" onClick={() => { setDateFrom(""); setDateTo(""); setRepFilter("all"); setTypeFilter("all"); setUserFilter("all"); setSearch(""); }}
              className="ml-auto text-[11px] text-primary font-semibold hover:underline">Clear all</button>
          )}
        </header>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Search */}
          <div className="relative col-span-2 sm:col-span-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
            <input 
              type="search"
              aria-label="Search by receipt, rep, or type"
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
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
          <select 
            aria-label="Filter by representative"
            value={repFilter} 
            onChange={(e) => setRepFilter(e.target.value)}
            className="px-2 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="all">All Reps</option>
            {reps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          {/* Type filter */}
          <select 
            aria-label="Filter by obligation type"
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="all">All Obligation Types</option>
            {obligationTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {/* Received by */}
          <select 
            aria-label="Filter by collector"
            value={userFilter} 
            onChange={(e) => setUserFilter(e.target.value)}
            className="px-2 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="all">All Collectors</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </section>

      {/* ── KPI Cards ── */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Receipt}  label="Total Collections"     value={totalRecords}               color="primary" />
        <StatCard icon={TrendingUp} label="Total Amount Received" value={fmt(totalAmount)}          color="emerald" />
        <StatCard icon={Users}    label="Active Reps"            value={uniqueReps}                 color="blue" />
        <StatCard icon={Layers}   label="Obligation Types"       value={typeBreakdown.length}        color="amber" />
      </section>

      {/* ── Charts row ── */}
      {filtered.length > 0 && (
        <section aria-label="Charts" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Obligation Type Breakdown */}
          <article className="rounded-xl border border-border bg-card p-4">
            <SectionTitle icon={BarChart2} title="Collection by Obligation Type" subtitle="Total amount per type" />
            <ResponsiveContainer width="100%" height={200} minWidth={0} initialDimension={{ width: 1, height: 1 }}>
              <BarChart data={typeBreakdown} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => v !== undefined ? fmt(Number(v)) : ""} />
                <Bar dataKey="total" radius={[6,6,0,0]}>
                  {typeBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </article>

          {/* Monthly trend */}
          {monthlyTrend.length > 1 ? (
            <article className="rounded-xl border border-border bg-card p-4">
              <SectionTitle icon={TrendingUp} title="Monthly Collection Trend" subtitle="Amounts received per month" />
              <ResponsiveContainer width="100%" height={200} minWidth={0} initialDimension={{ width: 1, height: 1 }}>
                <BarChart data={monthlyTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => v !== undefined ? fmt(Number(v)) : ""} />
                  <Bar dataKey="total" fill="#059669" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </article>
          ) : (
            /* Pie fallback if single month */
            <article className="rounded-xl border border-border bg-card p-4">
              <SectionTitle icon={Layers} title="Distribution by Type" subtitle="Share of total" />
              <ResponsiveContainer width="100%" height={200} minWidth={0} initialDimension={{ width: 1, height: 1 }}>
                <PieChart>
                  <Pie data={typeBreakdown} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0)*100).toFixed(0)}%`} labelLine={false}>
                    {typeBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => v !== undefined ? fmt(Number(v)) : ""} />
                </PieChart>
              </ResponsiveContainer>
            </article>
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
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-bold mt-0.5" aria-label="No Wakala Config">
                          <AlertCircle className="w-3 h-3" aria-hidden="true" /> No Wakala Config
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{w.mujtahidName}</td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">{w.obligationType}</span>
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-foreground">{w.count}</td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700 text-sm">{fmt(w.total)}</td>
                    <td className="px-3 py-3">
                      {w.distributions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {w.distributions.map((d: ObligationDistribution) => (
                            <span key={d.id} className={`text-[10px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${d.type === "Liability" ? "bg-red-50 border-red-200 text-red-600" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
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
                  <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700 text-xs">{fmt(totalAmount)}</td>
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
                  <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold text-red-600 uppercase">Due to Rep</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {repSummary.map((r) => (
                  <tr key={r.key} className="hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                          <span className="text-[10px] font-bold text-primary">{r.repName.split(" ").map((w: string) => w[0]).join("").slice(0,2).toUpperCase()}</span>
                        </div>
                        <p className="font-semibold text-foreground text-sm m-0">{r.repName}</p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{r.mujtahidName}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(r.byType).map(([name, amount]) => (
                          <span key={name} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted border border-border text-foreground whitespace-nowrap">
                            {name}: {fmt(amount as number).replace("PKR ", "")}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-semibold text-foreground">{r.count}</td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-foreground text-sm">{fmt(r.total)}</td>
                    <td className="px-3 py-3 text-right">
                      <span className="font-mono font-bold text-red-600 text-sm">{fmt(r.due)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-border bg-muted/30">
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase">{repSummary.length} rep{repSummary.length !== 1 ? "s" : ""}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-foreground text-xs">{fmt(totalAmount)}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-red-600 text-xs">{fmt(repSummary.reduce((s, r) => s + r.due, 0))}</td>
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
            <article key={t.name} className="rounded-xl border border-border bg-card p-4 space-y-1.5">
              <header className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground m-0">{t.name}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white" style={{ background: COLORS[i % COLORS.length] }}>
                  {t.count}
                </span>
              </header>
              <p className="text-lg font-bold text-foreground font-mono m-0">{fmt(t.total).replace("PKR ", "")}</p>
              <p className="text-[10px] text-muted-foreground m-0">PKR · {t.count} collection{t.count !== 1 ? "s" : ""}</p>
              <div className="w-full bg-muted rounded-full h-1.5 mt-1" role="progressbar" aria-valuenow={totalAmount ? (t.total / totalAmount) * 100 : 0} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-1.5 rounded-full transition-all"
                  style={{ width: `${totalAmount ? (t.total / totalAmount) * 100 : 0}%`, background: COLORS[i % COLORS.length] }} />
              </div>
              <p className="text-[10px] text-muted-foreground text-right m-0">{totalAmount ? ((t.total / totalAmount) * 100).toFixed(1) : 0}%</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
