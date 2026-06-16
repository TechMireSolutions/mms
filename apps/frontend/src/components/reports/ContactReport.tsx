import React, { useMemo } from "react";
import { Users, ShieldCheck, Target, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getCollection } from "../../lib/db";
import { useLiveCollection } from "../../hooks/useLiveCollection";
import ReportSummaryCard from "./ReportSummaryCard";
import ReportExportBar from "./ReportExportBar";
import EmptyState from "../ui/EmptyState";

const COLORS = ["#047857", "#0ea5e9", "#f59e0b", "#6366f1", "#ec4899", "#94a3b8"];

import { CONTACTS } from '@/lib/data/contactsData';
import { Contact } from "../../lib/contactFields";
import { calculateProfileHealth } from '@/lib/contexts/ContactConfigContext';
import { STUDENTS, Student } from '@/lib/data/studentsData';

export interface ContactStageItem {
  stage: string;
  count: number;
  health: number;
}

export interface LifecycleStageItem {
  stage: string;
  count: number;
  conversionRate: number;
}

/**
 * ContactReport component provides CRM-specific analytics.
 * Visualizes lifecycle stage distribution, lifecycle stages, and health metrics.
 *
 * @param {object} props - Component props.
 * @param {Function} [props.onEditVisual] - Optional callback to open the visualizer.
 * @returns {React.JSX.Element}
 */
export default function ContactReport(_props: { onEditVisual?: (config: unknown) => void } = {}) {
  const contacts = useLiveCollection<Contact>("contacts", CONTACTS);
  
  const students = useLiveCollection<Student>("students", STUDENTS);

  const stageDistribution = useMemo<ContactStageItem[]>(() => {
    const counts: Record<string, { count: number; totalHealth: number }> = {};
    contacts.forEach(c => {
      const s = c.lifecycleStage || "Lead";
      if (!counts[s]) counts[s] = { count: 0, totalHealth: 0 };
      counts[s].count++;
      counts[s].totalHealth += calculateProfileHealth(c);
    });
    return Object.entries(counts).map(([stage, data]) => ({
      stage,
      count: data.count,
      health: Math.round(data.totalHealth / data.count)
    }));
  }, [contacts]);

  const stages = useMemo<LifecycleStageItem[]>(() => {
    const counts: Record<string, number> = {};
    contacts.forEach(c => {
      const s = c.lifecycleStage || "Lead";
      counts[s] = (counts[s] || 0) + 1;
    });
    // For mock conversion we just use arbitrary but deterministic logic based on counts
    return Object.entries(counts).map(([stage, count]) => ({
      stage,
      count,
      conversionRate: Math.min(100, Math.round((count / contacts.length) * 200)) // simulated
    }));
  }, [contacts]);

  const totalContacts = contacts.length;
  const avgHealth = totalContacts > 0 
    ? Math.round(contacts.reduce((s, c) => s + calculateProfileHealth(c), 0) / totalContacts)
    : 0;

  const leads = contacts.filter((c) => (c.lifecycleStage || "Lead") === "Lead").length;
  const conversionRate = totalContacts > 0 ? Math.round(((totalContacts - leads) / totalContacts) * 100) : 0;

  const activeStudents = students.filter((s) => s.status === "active").length;
  const retentionRate = students.length > 0 ? Math.round((activeStudents / students.length) * 100) : 100;

  return (
    <div className="space-y-6 text-left p-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <ReportSummaryCard icon={Users} label="Total CRM Identity" value={totalContacts} color="primary" />
        <ReportSummaryCard icon={ShieldCheck} label="Avg Profile Health" value={`${avgHealth}%`} color="green" />
        <ReportSummaryCard icon={Target} label="Lead Conversion" value={`${conversionRate}%`} color="violet" />
        <ReportSummaryCard icon={TrendingUp} label="Retention Rate" value={`${retentionRate}%`} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lifecycle Stage Distribution Pie */}
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-foreground">Lifecycle Stage Distribution</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
              <PieChart>
                <Pie
                  data={stageDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="stage"
                >
                  {stageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lifecycle Conversion Bar */}
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-foreground">Lifecycle Stage Conversion</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
              <BarChart data={stages} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 100]} unit="%" hide />
                <YAxis dataKey="stage" type="category" width={100} tick={{ fontSize: 11, fontWeight: 600 }} />
                <Tooltip formatter={(v) => v !== undefined ? `${v}% Conversion` : ""} />
                <Bar dataKey="conversionRate" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Health by Lifecycle Stage Table */}
      <div className="space-y-4">
        <ReportExportBar 
          title="Database Integrity Report" 
          data={stageDistribution}
          headers={["Stage", "Count", "Avg Health"]}
        />
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border/50">
              <tr>
                {["Stage", "Count", "Avg Health", "Completeness"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-transparent">
              {stageDistribution.map((p, i) => (
                <tr key={p.stage} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4 font-bold text-foreground">{p.stage}</td>
                  <td className="px-4 py-4 text-muted-foreground font-medium">{p.count}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                       <span className="font-bold">{p.health}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 w-48">
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                       <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p.health}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
