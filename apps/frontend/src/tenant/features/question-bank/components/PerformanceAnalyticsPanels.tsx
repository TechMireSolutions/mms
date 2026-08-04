import React from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SafeResponsiveContainer } from "@/components/ui/SafeResponsiveContainer";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line,
} from "recharts";
import { AlertTriangle, Trophy } from "lucide-react";
import {
  QUESTION_ACCURACY_EXCELLENT_THRESHOLD,
  QUESTION_ACCURACY_WEAK_THRESHOLD,
  questionAccuracyBarClass,
  questionAccuracyTextClass,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import type { CategoryPerformance, StudentStatItem } from "./performanceAnalyticsUtils";

export interface PerformanceAnalyticsPanelsProps {
  weakAreas: CategoryPerformance[];
  trendData: Array<{ name: string; avg: number }>;
  radarData: Array<{ subject: string; accuracy: number }>;
  studentStats: StudentStatItem[];
  diffData: Array<{ name: string; accuracy: number }>;
  catPerformance: CategoryPerformance[];
}

export function PerformanceAnalyticsPanels({
  weakAreas,
  trendData,
  radarData,
  studentStats,
  diffData,
  catPerformance,
}: PerformanceAnalyticsPanelsProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {weakAreas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <WarningCallout
            title={t("questionBank.analytics.weakAreas")}
            className="items-start p-4"
            role="alert"
          >
            <div className="mt-3 flex flex-wrap gap-2.5" role="list">
              {weakAreas.map((categoryResult) => (
                <div
                  key={categoryResult.name}
                  className="flex items-center gap-1.5 rounded-lg border border-warning/30 bg-card px-2.5 py-1.5"
                  role="listitem"
                >
                  <span className="text-base" aria-hidden>{categoryResult.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-warning m-0">{categoryResult.name}</p>
                    <p className="text-xs text-warning/90 m-0">
                      {t("questionBank.analytics.accuracy", { percent: categoryResult.accuracy })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </WarningCallout>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard accentColor="primary" title={t("questionBank.analytics.classTrend")}>
          <div className="h-[11.25rem]" aria-hidden>
            <SafeResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(v) => [`${v}%`, t("questionBank.analytics.tooltipAvgScore")]}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
              </LineChart>
            </SafeResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard accentColor="info" title={t("questionBank.analytics.categoryAccuracy")}>
          {radarData.length >= 3 ? (
            <div className="h-[11.25rem]" aria-hidden>
              <SafeResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                  <Radar dataKey="accuracy" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip
                    formatter={(v) => [`${v}%`, t("questionBank.analytics.tooltipAccuracy")]}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                </RadarChart>
              </SafeResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[11.25rem] items-center justify-center text-sm text-muted-foreground" role="status">
              {t("questionBank.analytics.radarInsufficient")}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard accentColor="success" title={t("questionBank.analytics.studentPerformance")}>
          <div className="h-[11.25rem]" aria-hidden>
            <SafeResponsiveContainer width="100%" height="100%">
              <BarChart data={studentStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip
                  formatter={(v) => [`${v}%`, t("questionBank.analytics.tooltipAvg")]}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </SafeResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard accentColor="warning" title={t("questionBank.analytics.difficultyBreakdown")}>
          <div className="h-[11.25rem]" aria-hidden>
            <SafeResponsiveContainer width="100%" height="100%">
              <BarChart data={diffData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(v) => [`${v}%`, t("questionBank.analytics.tooltipAccuracy")]}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} fill="hsl(var(--chart-1))" />
              </BarChart>
            </SafeResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard accentColor="info" title={t("questionBank.analytics.categoryBreakdown")} padding={false}>
        <div className="divide-y divide-border/50 ps-6.5" role="list">
          {catPerformance.sort((a, b) => a.accuracy - b.accuracy).map((categoryResult) => (
            <div key={categoryResult.name} className="flex items-center gap-4 px-4 py-3" role="listitem">
              <span className="flex-shrink-0 text-xl" aria-hidden>{categoryResult.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-semibold text-foreground">{categoryResult.name}</p>
                  <span className={`shrink-0 text-xs font-bold ${questionAccuracyTextClass(categoryResult.accuracy)}`}>{categoryResult.accuracy}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-border" aria-hidden>
                  <div
                    className={`h-full rounded-full transition-all ${questionAccuracyBarClass(categoryResult.accuracy)}`}
                    style={{ width: `${categoryResult.accuracy}%` }}
                  />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("questionBank.analytics.correctRatio", { correct: categoryResult.correct, total: categoryResult.total })}
                </p>
              </div>
              {categoryResult.accuracy < QUESTION_ACCURACY_WEAK_THRESHOLD && (
                <AlertTriangle
                  className="h-4 w-4 flex-shrink-0 text-warning"
                  aria-label={t("questionBank.analytics.lowPerformanceWarning")}
                />
              )}
              {categoryResult.accuracy >= QUESTION_ACCURACY_EXCELLENT_THRESHOLD && (
                <Trophy
                  className="h-4 w-4 flex-shrink-0 text-warning"
                  aria-label={t("questionBank.analytics.highPerformanceAward")}
                />
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {studentStats.length > 0 && (
        <SectionCard accentColor="emerald" title={t("questionBank.analytics.studentLeaderboard")} icon={Trophy}>
          <div className="space-y-2.5" role="list">
            {studentStats.map((studentStat, studentIndex) => (
              <div key={studentStat.name} className="flex items-center gap-3" role="listitem">
                <span className="w-6 flex-shrink-0 text-sm font-bold text-muted-foreground">{studentIndex + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex min-w-0 items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-semibold text-foreground">
                      {studentStat.name}{" "}
                      <span className="font-normal text-muted-foreground">· {studentStat.class}</span>
                    </p>
                    <p className="shrink-0 text-sm font-bold text-foreground">{studentStat.avg}%</p>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-border" aria-hidden>
                    <div className="h-full rounded-full bg-primary" style={{ width: `${studentStat.avg}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
