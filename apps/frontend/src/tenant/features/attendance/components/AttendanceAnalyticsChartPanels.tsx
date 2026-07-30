import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { SafeResponsiveContainer } from "@/components/ui/SafeResponsiveContainer";
import type { AttendanceStatus } from '@/lib/data/attendanceData';
import { attendanceStatusLabel } from "@/lib/attendanceStatusUi";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";
import type { ClassStatEntry, StudentRateEntry } from "@/tenant/features/attendance/components/useAttendanceAnalyticsModel";

interface AttendanceAnalyticsChartPanelsProps {
  t: TranslationFunction;
  colors: string[];
  classStats: ClassStatEntry[];
  monthlyTrend: Array<{ month: string; rate: number }>;
  studentRates: StudentRateEntry[];
  pieData: Array<{ name: string; value: number }>;
  statuses: AttendanceStatus[];
  totalStats: Record<string, number>;
}

export function AttendanceAnalyticsChartPanels({
  t,
  colors,
  classStats,
  monthlyTrend,
  studentRates,
  pieData,
  statuses,
  totalStats,
}: AttendanceAnalyticsChartPanelsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2, ease: "easeOut" }}
      >
        <Card accentColor="primary" className="p-4 shadow-sm hover:shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-foreground mb-3 m-0">{t("attendance.analytics.charts.classRateTitle")}</h2>
          <SafeResponsiveContainer height={200}>
            <BarChart data={classStats} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="rate" name={t("attendance.analytics.attendanceLabel")} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}
                label={{ position: "top", fontSize: 10, fill: "hsl(var(--muted-foreground))", formatter: (value) => value !== undefined && value !== null ? `${value}%` : "" }} />
            </BarChart>
          </SafeResponsiveContainer>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25, ease: "easeOut" }}
      >
        <Card accentColor="info" className="p-4 shadow-sm hover:shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-foreground mb-3 m-0">{t("attendance.analytics.charts.monthlyTrendTitle")}</h2>
          <SafeResponsiveContainer height={200}>
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="att-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(value) => `${value}%`} />
              <Area type="monotone" dataKey="rate" name={t("attendance.analytics.attendancePercentLabel")} stroke="hsl(var(--primary))" fill="url(#att-grad)" strokeWidth={2} dot={{ r: 3 }} />
            </AreaChart>
          </SafeResponsiveContainer>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.3, ease: "easeOut" }}
      >
        <Card accentColor="info" className="p-4 shadow-sm hover:shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-foreground mb-3 m-0">{t("attendance.analytics.charts.studentRatesTitle")}</h2>
          <SafeResponsiveContainer height={220}>
            <BarChart data={studentRates} layout="vertical" barSize={12}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="rate" name={t("attendance.analytics.rateLabel")} radius={[0, 4, 4, 0]}
                fill="hsl(var(--primary))"
                background={{ fill: "hsl(var(--muted))", radius: 4 }} />
            </BarChart>
          </SafeResponsiveContainer>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.35, ease: "easeOut" }}
      >
        <Card accentColor="primary" className="p-4 shadow-sm hover:shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-foreground mb-3 m-0">{t("attendance.analytics.charts.statusDistributionTitle")}</h2>
          <div className="flex items-center gap-4">
            <SafeResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </SafeResponsiveContainer>
            <div className="space-y-2">
              {statuses.map((status, index) => (
                <div key={status.id} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: colors[index % colors.length] }} />
                  <span className="text-muted-foreground">{attendanceStatusLabel(status, t)}</span>
                  <span className="font-bold text-foreground ms-auto">{totalStats[status.id] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
