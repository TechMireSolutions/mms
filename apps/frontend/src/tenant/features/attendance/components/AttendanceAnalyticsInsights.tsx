import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import type { StudentRateEntry } from "@/tenant/features/attendance/components/useAttendanceAnalyticsModel";
import type { TranslationFunction } from "@/lib/contexts/TranslationContext";

interface AttendanceAnalyticsInsightsProps {
  t: TranslationFunction;
  lowAttendance: StudentRateEntry[];
  topStudents: StudentRateEntry[];
}

export function AttendanceAnalyticsInsights({
  t,
  lowAttendance,
  topStudents,
}: AttendanceAnalyticsInsightsProps) {
  return (
    <>
      {lowAttendance.length > 0 && (
        <motion.article
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="rounded-xl border border-warning/30 bg-warning/10 p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" aria-hidden="true" />
            <h3 className="text-sm font-bold text-warning m-0">{t("attendance.analytics.lowAlertTitle", { count: lowAttendance.length })}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowAttendance.map((studentRate) => (
              <div key={studentRate.name} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card/45 backdrop-blur-sm border border-warning/30">
                <span className="text-xs font-semibold text-foreground">{studentRate.name}</span>
                <span className="text-xs font-bold text-destructive">{studentRate.rate}%</span>
              </div>
            ))}
          </div>
        </motion.article>
      )}

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.45, ease: "easeOut" }}
      >
        <Card accentColor="success" className="p-4 shadow-sm hover:shadow-md border-border/80 bg-card/45 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-foreground mb-3 m-0">{t("attendance.analytics.charts.topPerformersTitle")}</h2>
          <div className="space-y-2">
            {topStudents.map((studentRate, index) => (
              <div key={studentRate.name} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? "bg-warning/15 text-warning" : index === 1 ? "bg-muted text-muted-foreground" : "bg-warning/10 text-warning"}`}>{index + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold text-foreground">{studentRate.name}</span>
                    <span className="text-xs font-bold text-success">{studentRate.rate}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-success" style={{ width: `${studentRate.rate}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </>
  );
}
