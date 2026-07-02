import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { useBrandPalette } from "@/lib/contexts/BrandingPaletteContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import SafeResponsiveContainer from "../reports/SafeResponsiveContainer";
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
    <Card className="relative overflow-hidden group rounded-2xl border border-border/80 bg-card/45 backdrop-blur-sm p-4 pl-5.5 flex items-start gap-3 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/45 transition-colors group-hover:bg-primary" />
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color} ml-1`}>
        <Icon className="w-4 h-4" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
        <p className="text-xs font-semibold text-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </Card>
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
export function EnrollmentReports({ enrollments }: EnrollmentReportsProps): React.ReactElement {
  const palette = useBrandPalette();
  const COLORS = useMemo(
    () => [palette.primary, palette.secondary, palette.charts[0], palette.charts[3]],
    [palette],
  );
  const total      = enrollments.length;
  const confirmed  = enrollments.filter((enrollment) => enrollment.status === "confirmed").length;
  const pending    = enrollments.filter((enrollment) => enrollment.status === "pending").length;
  const cancelled  = enrollments.filter((enrollment) => enrollment.status === "cancelled").length;
  const totalFees  = enrollments.filter((enrollment) => enrollment.status !== "cancelled")
    .reduce((totalFee, enrollment) => totalFee + (enrollment.finalFee || 0), 0);
  const paidFees   = enrollments.filter((enrollment) => enrollment.paymentStatus === "paid")
    .reduce((paidTotal, enrollment) => paidTotal + (enrollment.finalFee || 0), 0);

  // Status distribution
  const statusData = ENROLLMENT_STATUSES.map((status) => ({
    name: status.label,
    value: enrollments.filter((enrollment) => enrollment.status === status.id).length,
  }));

  // Per-session breakdown
  const sessionData = useMemo<SessionDataPoint[]>(() => {
    const sessionStatsById: Record<string, SessionDataPoint> = {};
    enrollments.forEach((enrollment) => {
      if (!sessionStatsById[enrollment.sessionId]) {
        sessionStatsById[enrollment.sessionId] = { name: enrollment.sessionName, count: 0, revenue: 0 };
      }
      sessionStatsById[enrollment.sessionId].count++;
      if (enrollment.status !== "cancelled") {
        sessionStatsById[enrollment.sessionId].revenue += enrollment.finalFee || 0;
      }
    });
    return Object.values(sessionStatsById);
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
        <Card accentColor="primary" className="p-4 shadow-sm hover:shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
          <h3 className="text-sm font-bold text-foreground mb-3">Enrollment by Status</h3>
          <div className="h-[200px]" aria-hidden="true">
            <SafeResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={3}>
                  {statusData.map((status, index) => <Cell key={status.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => [`${value} enrollments`]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </SafeResponsiveContainer>
          </div>
        </Card>

        {/* Per-session bar */}
        <Card accentColor="indigo" className="p-4 shadow-sm hover:shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
          <h3 className="text-sm font-bold text-foreground mb-3">Enrollments by Session</h3>
          {sessionData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm" role="status">No data</div>
          ) : (
            <div className="h-[200px]" aria-hidden="true">
              <SafeResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} initialDimension={{ width: 1, height: 1 }}>
                <BarChart data={sessionData} barSize={20}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => [`${value}`]} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </SafeResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Session Revenue Table */}
      <Card accentColor="success" className="p-0 overflow-hidden bg-card/45 backdrop-blur-sm shadow-sm hover:shadow-md border-border/80">
        <div className="px-4 py-2.5 bg-muted/20 border-b border-border/40 pl-6.5">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Revenue by Session</h3>
        </div>
        <div className="divide-y divide-border/50 pl-6.5" role="list">
          {sessionData.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground" role="status">No data</p>
          ) : (
            sessionData.map((sessionStats) => (
              <div key={sessionStats.name} className="flex items-center justify-between px-4 py-3" role="listitem">
                <div>
                  <p className="text-sm font-semibold text-foreground">{sessionStats.name}</p>
                  <p className="text-xs text-muted-foreground">{sessionStats.count} enrollment{sessionStats.count !== 1 ? "s" : ""}</p>
                </div>
                <p className="text-sm font-bold text-primary">PKR {sessionStats.revenue.toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </section>
  );
}
