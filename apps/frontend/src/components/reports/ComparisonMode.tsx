import React, { useState, useMemo, useEffect } from "react";
import { useBrandPalette } from "@/lib/BrandingPaletteContext";
import { GitCompare, X } from "lucide-react";
import { DatePicker } from "../ui/DatePicker";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { CONTACTS } from "../../lib/contactsData";
import { Contact } from "../../lib/contactFields";
import { SESSIONS_DATA, Session } from "../../lib/sessionsData";
import { useLiveCollection } from "../../hooks/useLiveCollection";
import { useContactConfig, calculateProfileHealth } from "../../lib/ContactConfigContext";

interface ComparisonDataItem {
  metric: string;
  a: number;
  b: number;
}

interface DateRangeDataItem {
  month: string;
  a: number;
  b: number;
}

interface DateRange {
  from: string;
  to: string;
}

/**
 * Side-by-side comparison data generator using actual contacts collection.
 */
function getContactCompData(contacts: Contact[], filterA: (c: Contact) => boolean, filterB: (c: Contact) => boolean): ComparisonDataItem[] {
  const setA = contacts.filter(filterA);
  const setB = contacts.filter(filterB);

  const calcConversion = (list: Contact[]) => {
    if (list.length === 0) return 0;
    const nonLeads = list.filter(c => (c.lifecycleStage || "Lead") !== "Lead").length;
    return Math.round((nonLeads / list.length) * 100);
  };

  const calcHealth = (list: Contact[]) => {
    if (list.length === 0) return 0;
    return Math.round(list.reduce((s: number, c: Contact) => s + calculateProfileHealth(c), 0) / list.length);
  };

  const calcRating = (list: Contact[]) => {
    if (list.length === 0) return 0;
    const withRating = list.filter(c => typeof c.rating === "number");
    if (withRating.length === 0) return 0;
    return parseFloat((withRating.reduce((s: number, c: Contact) => s + (c.rating || 0), 0) / withRating.length).toFixed(1));
  };

  return [
    { metric: "Total Volume",  a: setA.length, b: setB.length },
    { metric: "Conversion%",   a: calcConversion(setA), b: calcConversion(setB) },
    { metric: "Avg Health%",    a: calcHealth(setA), b: calcHealth(setB) },
    { metric: "Engagement",    a: calcRating(setA), b: calcRating(setB) },
    { metric: "Active Status", a: setA.filter(c => c.isActive !== false).length, b: setB.filter(c => c.isActive !== false).length },
  ];
}

/**
 * Comparison data generator for session-to-session metrics.
 */
function getCompData(category: string, contacts: Contact[], targetA: string, targetB: string): ComparisonDataItem[] {
  if (category.toLowerCase() === "contacts") {
    return getContactCompData(
       contacts, 
       (c) => (c.lifecycleStage || "Lead") === targetA, 
       (c) => (c.lifecycleStage || "Lead") === targetB
    );
  }

  return [
    { metric: "Enrollment",   a: targetA === "s1" ? 21 : targetA === "s2" ? 18 : 10, b: targetB === "s1" ? 21 : targetB === "s2" ? 18 : 10 },
    { metric: "Attendance%",  a: targetA === "s1" ? 88 : targetA === "s2" ? 92 : 82, b: targetB === "s1" ? 88 : targetB === "s2" ? 92 : 82 },
    { metric: "Fee Collected",a: targetA === "s1" ? 73500 : targetA === "s2" ? 45000 : 40000, b: targetB === "s1" ? 73500 : targetB === "s2" ? 45000 : 40000 },
    { metric: "Pass Rate%",   a: targetA === "s1" ? 100 : targetA === "s2" ? 100 : 90, b: targetB === "s1" ? 100 : targetB === "s2" ? 100 : 90 },
    { metric: "Hasanat",      a: targetA === "s1" ? 1140 : targetA === "s2" ? 930 : 500, b: targetB === "s1" ? 1140 : targetB === "s2" ? 930 : 500 },
  ];
}

/**
 * Real comparison data generator for date range metrics.
 */
function getDateRangeData(category: string, contacts: Contact[], rangeA: DateRange, rangeB: DateRange): DateRangeDataItem[] {
  if (category.toLowerCase() === "contacts") {
     const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
     return months.slice(0, 6).map((m, i) => {
       const monthStr = String(i + 1).padStart(2, "0");
       return {
         month: m,
         a: contacts.filter(c => c.createdAt?.includes(`-${monthStr}-`) && c.createdAt?.startsWith(rangeA.from.slice(0, 4))).length,
         b: contacts.filter(c => c.createdAt?.includes(`-${monthStr}-`) && c.createdAt?.startsWith(rangeB.from.slice(0, 4))).length,
       };
     });
  }

  return [
    { month: "Jan", a: 18000, b: 15000 },
    { month: "Feb", a: 22000, b: 19000 },
    { month: "Mar", a: 19500, b: 21000 },
    { month: "Apr", a: 25000, b: 22500 },
    { month: "May", a: 28000, b: 26000 },
    { month: "Jun", a: 35000, b: 30000 },
  ];
}

interface ComparisonModeProps {
  category: string;
  onClose: () => void;
}

/**
 * ComparisonMode component that displays side-by-side session or date range comparisons.
 *
 * @param props - Component props.
 * @returns React.JSX.Element
 */
export default function ComparisonMode({ category, onClose }: ComparisonModeProps): React.JSX.Element {
  const { primary, secondary } = useBrandPalette();
  const { fieldConfig } = useContactConfig();
  const contacts = useLiveCollection<Contact>("contacts", CONTACTS);
  const sessions = useLiveCollection<Session>("sessions", SESSIONS_DATA);
  const SESSIONS_OPTIONS = useMemo<{id: string, name: string}[]>(() => sessions.filter((s) => s.id !== "all").map(s => ({ id: s.id, name: s.name })), [sessions]);

  const LIFECYCLE_OPTIONS = useMemo(() => {
    const field = (fieldConfig.fields?.basic || []).find((f) => f.key === "lifecycleStage");
    const opts = field?.options || ["Lead", "Active Student", "Alumnus", "Staff", "Donor", "Volunteer", "Parent"];
    return opts.map(opt => ({ id: opt, name: opt }));
  }, [fieldConfig]);

  const isContacts = category.toLowerCase() === "contacts";

  const [mode, setMode] = useState<"sessions" | "daterange">("sessions");
  const [valA, setValA] = useState<string>(isContacts ? "Lead" : "s1");
  const [valB, setValB] = useState<string>(isContacts ? "Active Student" : "s2");

  // Sync targets when category changes
  useEffect(() => {
    if (category.toLowerCase() === "contacts") {
      setValA("Lead");
      setValB("Active Student");
    } else {
      setValA("s1");
      setValB("s2");
    }
  }, [category]);
  const [rangeA, setRangeA] = useState<DateRange>({ from: "2025-01-01", to: "2025-03-31" });
  const [rangeB, setRangeB] = useState<DateRange>({ from: "2026-01-01", to: "2026-03-31" });

  const options = isContacts ? LIFECYCLE_OPTIONS : SESSIONS_OPTIONS;
  const labelA = mode === "sessions" ? options.find((s) => s.id === valA)?.name : `${rangeA.from} → ${rangeA.to}`;
  const labelB = mode === "sessions" ? options.find((s) => s.id === valB)?.name : `${rangeB.from} → ${rangeB.to}`;

  const data = mode === "sessions"
    ? getCompData(category, contacts, valA, valB)
    : (getDateRangeData(category, contacts, rangeA, rangeB) as Array<ComparisonDataItem | DateRangeDataItem>);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-border/50 text-left">
        <div className="flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Comparison Mode</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border/50 overflow-hidden text-xs font-semibold">
            <button onClick={() => setMode("sessions")} className={`px-3 py-1.5 transition-colors ${mode === "sessions" ? "bg-primary text-primary-foreground" : "bg-card/50 backdrop-blur-md text-muted-foreground hover:text-foreground"}`} type="button">
              {isContacts ? "Stages" : "Sessions"}
            </button>
            <button onClick={() => setMode("daterange")} className={`px-3 py-1.5 transition-colors ${mode === "daterange" ? "bg-primary text-primary-foreground" : "bg-card/50 backdrop-blur-md text-muted-foreground hover:text-foreground"}`} type="button">Date Ranges</button>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors" type="button" aria-label="Close comparison">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Selectors */}
        {mode === "sessions" ? (
          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              { label: "A", val: valA, set: setValA, color: "text-primary" },
              { label: "B", val: valB, set: setValB, color: "text-amber-600" }
            ].map(({ label, val, set, color }) => (
              <div key={label} className="flex flex-col gap-1">
                <label className={`text-[11px] font-bold uppercase tracking-wide ${color}`}>{isContacts ? "Stage" : "Session"} {label}</label>
                <select value={val} onChange={(e) => set(e.target.value)} className="text-sm rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm px-2 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {options.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-left">
            {[
              { label: "Range A", range: rangeA, set: setRangeA, color: "text-primary" },
              { label: "Range B", range: rangeB, set: setRangeB, color: "text-amber-600" }
            ].map(({ label, range, set, color }) => (
              <div key={label} className="space-y-2">
                <p className={`text-[11px] font-bold uppercase tracking-wide ${color}`}>{label}</p>
                <div className="flex gap-2 items-center">
                  <DatePicker
                    value={range.from}
                    onChange={(val) => set((r) => ({ ...r, from: val }))}
                    className="flex-1 text-sm rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm px-2 py-1.5"
                  />
                  <DatePicker
                    value={range.to}
                    onChange={(val) => set((r) => ({ ...r, to: val }))}
                    className="flex-1 text-sm rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm px-2 py-1.5"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 shadow-sm text-left">
          <p className="text-xs text-muted-foreground mb-3">
            Comparing: <span className="font-semibold text-primary">{labelA}</span> vs <span className="font-semibold text-amber-600">{labelB}</span>
          </p>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
              <BarChart data={data} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey={mode === "sessions" ? "metric" : "month"} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="a" name={labelA} fill={primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="b" name={labelB} fill={secondary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delta table */}
        {mode === "sessions" && (
          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Metric</th>
                  <th className="px-3 py-2 text-left text-[11px] font-bold text-primary uppercase tracking-widest">{isContacts ? "Target A" : "Session A"}</th>
                  <th className="px-3 py-2 text-left text-[11px] font-bold text-amber-600 uppercase tracking-widest">{isContacts ? "Target B" : "Session B"}</th>
                  <th className="px-3 py-2 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Δ Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-left bg-transparent">
                {(data as ComparisonDataItem[]).map((row) => {
                  const diff = parseFloat((row.a - row.b).toFixed(1));
                  return (
                    <tr key={row.metric} className="hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-3 font-bold text-foreground">{row.metric}</td>
                      <td className="px-3 py-3 text-primary font-bold">{row.a.toLocaleString()}</td>
                      <td className="px-3 py-3 text-amber-600 font-bold">{row.b.toLocaleString()}</td>
                      <td className={`px-3 py-3 text-xs font-black ${diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                        {diff > 0 ? "+" : ""}{diff.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
