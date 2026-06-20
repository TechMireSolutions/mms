import React, { useMemo } from "react";
import { Users, UserCheck, Target, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useLiveCollection } from "../../hooks/useLiveCollection";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import ReportSummaryCard from "./ReportSummaryCard";
import ReportExportBar from "./ReportExportBar";

import { CONTACTS } from '@/lib/data/contactsData';
import { Contact } from "../../lib/contactFields";
import { STUDENTS, Student } from '@/lib/data/studentsData';

export interface ContactStageItem {
  stage: string;
  count: number;
}

export interface LifecycleStageItem {
  stage: string;
  count: number;
  conversionRate: number;
}

/**
 * ContactReport component provides CRM-specific analytics.
 * Visualizes lifecycle stage distribution, lifecycle stages, and conversion metrics.
 */
export default function ContactReport(_props: { onEditVisual?: (config: unknown) => void } = {}) {
  const contacts = useLiveCollection<Contact>("contacts", CONTACTS);
  const { primary, secondary, charts } = useBrandPalette();
  const COLORS = useMemo(() => [primary, charts[3], secondary, charts[4], charts[2], charts[1]], [primary, secondary, charts]);
  
  const students = useLiveCollection<Student>("students", STUDENTS);

  const stageDistribution = useMemo<ContactStageItem[]>(() => {
    const counts: Record<string, number> = {};
    contacts.forEach(c => {
      const s = c.lifecycleStage || "Lead";
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([stage, count]) => ({ stage, count }));
  }, [contacts]);

  const stages = useMemo<LifecycleStageItem[]>(() => {
    const counts: Record<string, number> = {};
    contacts.forEach(c => {
      const s = c.lifecycleStage || "Lead";
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([stage, count]) => ({
      stage,
      count,
      conversionRate: Math.min(100, Math.round((count / contacts.length) * 200))
    }));
  }, [contacts]);

  const totalContacts = contacts.length;
  const activeContacts = contacts.filter((c) => c.isActive !== false).length;

  const leads = contacts.filter((c) => (c.lifecycleStage || "Lead") === "Lead").length;
  const conversionRate = totalContacts > 0 ? Math.round(((totalContacts - leads) / totalContacts) * 100) : 0;

  const activeStudents = students.filter((s) => s.status === "active").length;
  const retentionRate = students.length > 0 ? Math.round((activeStudents / students.length) * 100) : 100;

  return (
    <div className="space-y-6 text-left p-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <ReportSummaryCard icon={Users} label="Total CRM Identity" value={totalContacts} color="primary" />
        <ReportSummaryCard icon={UserCheck} label="Active Contacts" value={activeContacts} color="green" />
        <ReportSummaryCard icon={Target} label="Lead Conversion" value={`${conversionRate}%`} color="violet" />
        <ReportSummaryCard icon={TrendingUp} label="Retention Rate" value={`${retentionRate}%`} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-foreground">Lifecycle Stage Conversion</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
              <BarChart data={stages} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 100]} unit="%" hide />
                <YAxis dataKey="stage" type="category" width={100} tick={{ fontSize: 11, fontWeight: 600 }} />
                <Tooltip formatter={(v) => v !== undefined ? `${v}% Conversion` : ""} />
                <Bar dataKey="conversionRate" fill={charts[4]} radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <ReportExportBar 
          title="Stage Distribution Report" 
          data={stageDistribution}
          headers={["Stage", "Count"]}
        />
        <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border/50">
              <tr>
                {["Stage", "Count"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-transparent">
              {stageDistribution.map((p) => (
                <tr key={p.stage} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4 font-bold text-foreground">{p.stage}</td>
                  <td className="px-4 py-4 text-muted-foreground font-medium">{p.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
