import React, { useMemo } from "react";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Users, DollarSign, TrendingUp, BookOpen } from "lucide-react";
import { ENROLLMENT_STATUSES, Enrollment } from '@/lib/data/enrollmentData';

interface KPIProps {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  label: string;
  value: React.ReactNode;
  sub?: string;
  color?: string;
}

/**
 * Single KPI card helper.
 *
 * @returns Component layout.
 */
function KPI({ icon: Icon, label, value, sub, color = "bg-primary/10 text-primary" }: KPIProps): React.ReactElement {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs font-semibold text-foreground">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

interface EnrollmentReportsProps {
  enrollments: Enrollment[];
}

interface SessionDataPoint {
  name: string;
  count: number;
  revenue: number;
}

/**
 * Aggregates and displays reports & charts representing enrollment distributions.
 *
 * @param props - Component props.
 * @param props.enrollments - Current enrollment list context.
 * @returns The EnrollmentReports component.
 */
export default function EnrollmentReports({ enrollments }: EnrollmentReportsProps): React.ReactElement {
  const palette = useBrandPalette();
  const COLORS = useMemo(
    () => [palette.primary, palette.secondary, "#dc2626", palette.charts[3]],
    [palette],
  );
  const total      = enrollments.length;
  const confirmed  = enrollments.filter((e) => e.status === "confirmed").length;
  const pending    = enrollments.filter((e) => e.status === "pending").length;
  const cancelled  = enrollments.filter((e) => e.status === "cancelled").length;
  const totalFees  = enrollments.filter((e) => e.status !== "cancelled")
    .reduce((sum, e) => sum + (e.finalFee || 0), 0);
  const paidFees   = enrollments.filter((e) => e.paymentStatus === "paid")
    .reduce((sum, e) => sum + (e.finalFee || 0), 0);

  // Status distribution
  const statusData = ENROLLMENT_STATUSES.map((s) => ({
    name: s.label,
    value: enrollments.filter((e) => e.status === s.id).length,
  }));

  // Per-session breakdown
  const sessionData = useMemo<SessionDataPoint[]>(() => {
    const map: Record<string, SessionDataPoint> = {};
    enrollments.forEach((e) => {
      if (!map[e.sessionId]) {
        map[e.sessionId] = { name: e.sessionName, count: 0, revenue: 0 };
      }
      map[e.sessionId].count++;
      if (e.status !== "cancelled") {
        map[e.sessionId].revenue += e.finalFee || 0;
      }
    });
    return Object.values(map);
  }, [enrollments]);

  return (
    <section className="space-y-6" aria-label="Enrollment Reports Summary">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={Users}      label="Total Enrollments" value={total}    sub={`${confirmed} confirmed`} />
        <KPI icon={TrendingUp} label="Confirmed"          value={confirmed} sub={`${pending} pending`}   color="bg-success/10 text-success" />
        <KPI icon={BookOpen}   label="Cancelled"          value={cancelled} sub="This period"            color="bg-destructive/10 text-destructive" />
        <KPI icon={DollarSign} label="Revenue Due"        value={`PKR ${totalFees.toLocaleString()}`} sub={`Paid: PKR ${paidFees.toLocaleString()}`} color="bg-warning/10 text-warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status chart */}
        <section className="rounded-xl border border-border bg-card p-4" aria-label="Enrollment by Status Chart">
          <h3 className="text-sm font-bold text-foreground mb-3">Enrollment by Status</h3>
          <div className="h-[200px]" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={3}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val) => [`${val} enrollments`]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Per-session bar */}
        <section className="rounded-xl border border-border bg-card p-4" aria-label="Enrollments by Session Chart">
          <h3 className="text-sm font-bold text-foreground mb-3">Enrollments by Session</h3>
          {sessionData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm" role="status">No data</div>
          ) : (
            <div className="h-[200px]" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                <BarChart data={sessionData} barSize={20}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(val) => [`${val}`]} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* Session Revenue Table */}
      <section className="rounded-xl border border-border overflow-hidden" aria-label="Revenue by Session Details">
        <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Revenue by Session</h3>
        </div>
        <div className="divide-y divide-border" role="list">
          {sessionData.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground" role="status">No data</p>
          ) : (
            sessionData.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3" role="listitem">
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.count} enrollment{s.count !== 1 ? "s" : ""}</p>
                </div>
                <p className="text-sm font-bold text-primary">PKR {s.revenue.toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
