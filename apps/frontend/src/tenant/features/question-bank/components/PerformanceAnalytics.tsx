import React, { useMemo } from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import { SafeResponsiveContainer } from "@/components/ui/SafeResponsiveContainer";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, LineChart, Line,
} from "recharts";
import { AlertTriangle, Trophy } from "lucide-react";
import type {
  QuestionBankQuestion,
  QuestionBankResult,
  QuestionBankTest,
  QuestionCategory,
} from "@mms/shared";
import {
  getQuestionCategoryIds,
  QUESTION_ACCURACY_EXCELLENT_THRESHOLD,
  QUESTION_ACCURACY_WEAK_THRESHOLD,
  questionAccuracyBarClass,
  questionAccuracyTextClass,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuestionBankConfig } from "@/tenant/features/question-bank/hooks/useQuestionBankConfig";

function pct(obtained: number, total: number): number {
  return total > 0 ? Math.round((obtained / total) * 100) : 0;
}

function sumScores(scores: Record<string, number>): number {
  return Object.values(scores).reduce((sum, value) => sum + value, 0);
}

function testTotalMarks(test: QuestionBankTest, questions: QuestionBankQuestion[]): number {
  return test.questionIds.reduce((sum, qid) => {
    const question = questions.find((item) => item.id === qid);
    return sum + (question?.marks ?? 0);
  }, 0);
}

interface PerformanceAnalyticsProps {
  tests: QuestionBankTest[];
  results: QuestionBankResult[];
  questions: QuestionBankQuestion[];
  categories: QuestionCategory[];
}

interface StudentStatItem {
  name: string;
  class: string;
  scores: number[];
  totalPts: number;
  maxPts: number;
  avg: number;
  overall: number;
}

interface CategoryPerformance {
  name: string;
  icon: string;
  color: string;
  accuracy: number;
  correct: number;
  total: number;
}

export function PerformanceAnalytics({
  tests,
  results,
  questions,
  categories,
}: PerformanceAnalyticsProps): React.ReactElement {
  const { t } = useTranslation();
  const qbConfig = useQuestionBankConfig(questions);

  const studentStats = useMemo<StudentStatItem[]>(() => {
    const statsByStudentId: Record<string, { name: string; class: string; scores: number[]; totalPts: number; maxPts: number }> = {};
    results.forEach((result) => {
      const test = tests.find((item) => item.id === result.testId);
      if (!test) return;
      const totalMarks = testTotalMarks(test, questions) || 100;
      const marksObtained = sumScores(result.scores);
      const percentageScore = pct(marksObtained, totalMarks);
      if (!statsByStudentId[result.studentId]) {
        statsByStudentId[result.studentId] = {
          name: result.studentName,
          class: t("questionBank.analytics.classLabel"),
          scores: [],
          totalPts: 0,
          maxPts: 0,
        };
      }
      statsByStudentId[result.studentId].scores.push(percentageScore);
      statsByStudentId[result.studentId].totalPts += marksObtained;
      statsByStudentId[result.studentId].maxPts += totalMarks;
    });
    return Object.values(statsByStudentId)
      .map((studentStat) => {
        const averageScore = studentStat.scores.length > 0 ? Math.round(studentStat.scores.reduce((scoreTotal, score) => scoreTotal + score, 0) / studentStat.scores.length) : 0;
        return { ...studentStat, avg: averageScore, overall: pct(studentStat.totalPts, studentStat.maxPts) };
      })
      .sort((a, b) => b.avg - a.avg);
  }, [tests, results, questions, t]);

  const catPerformance = useMemo<CategoryPerformance[]>(() => {
    return categories
      .map((category) => {
        const categoryQuestionIds = questions
          .filter((question) => getQuestionCategoryIds(question).includes(category.id))
          .map((question) => question.id);
        let correct = 0;
        let total = 0;
        results.forEach((result) => {
          categoryQuestionIds.forEach((questionId) => {
            if (result.answers?.[questionId] !== undefined) {
              const question = questions.find((candidateQuestion) => candidateQuestion.id === questionId);
              total++;
              if (result.answers[questionId] === question?.answer) correct++;
            }
          });
        });
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        return { name: category.name, icon: category.icon, color: category.color, accuracy, correct, total };
      })
      .filter((categoryResult) => categoryResult.total > 0);
  }, [categories, questions, results]);

  const weakAreas = catPerformance
    .filter((categoryResult) => categoryResult.accuracy < QUESTION_ACCURACY_WEAK_THRESHOLD)
    .sort((a, b) => a.accuracy - b.accuracy);

  const trendData = tests.map((test) => {
    const testResults = results.filter((result) => result.testId === test.id);
    const totalMarks = testTotalMarks(test, questions) || 100;
    const averageScore =
      testResults.length > 0
        ? Math.round(testResults.reduce((scoreTotal, result) => scoreTotal + pct(sumScores(result.scores), totalMarks), 0) / testResults.length)
        : 0;
    return {
      name: test.name.length > 16 ? `${test.name.slice(0, 16)}…` : test.name,
      avg: averageScore,
    };
  });

  const diffData = qbConfig.enabledDifficulties.map((difficulty) => {
    const questionIds = questions.filter((question) => question.difficulty === difficulty).map((question) => question.id);
    let correct = 0;
    let total = 0;
    results.forEach((result) => {
      questionIds.forEach((questionId) => {
        if (result.answers?.[questionId] !== undefined) {
          const question = questions.find((candidateQuestion) => candidateQuestion.id === questionId);
          total++;
          if (result.answers[questionId] === question?.answer) correct++;
        }
      });
    });
    return {
      name: qbConfig.difficultyLabel(difficulty),
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
  });

  const radarData = catPerformance.map((categoryResult) => ({ subject: `${categoryResult.icon} ${categoryResult.name}`, accuracy: categoryResult.accuracy }));

  return (
    <div className="space-y-6">
      {weakAreas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-warning/30 bg-warning/10 p-4"
          role="alert"
        >
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
            <h3 className="text-[13px] font-bold text-warning">{t("questionBank.analytics.weakAreas")}</h3>
          </div>
          <div className="flex flex-wrap gap-2.5" role="list">
            {weakAreas.map((categoryResult) => (
              <div
                key={categoryResult.name}
                className="flex items-center gap-1.5 rounded-lg border border-warning/30 bg-card px-2.5 py-1.5"
                role="listitem"
              >
                <span className="text-base" aria-hidden>{categoryResult.icon}</span>
                <div>
                  <p className="text-[12px] font-bold text-warning">{categoryResult.name}</p>
                  <p className="text-[10px] text-warning/90">
                    {t("questionBank.analytics.accuracy", { percent: categoryResult.accuracy })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard accentColor="primary" title={t("questionBank.analytics.classTrend")}>
          <div className="h-[180px]" aria-hidden>
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

        <SectionCard accentColor="indigo" title={t("questionBank.analytics.categoryAccuracy")}>
          {radarData.length >= 3 ? (
            <div className="h-[180px]" aria-hidden>
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
            <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground" role="status">
              {t("questionBank.analytics.radarInsufficient")}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard accentColor="success" title={t("questionBank.analytics.studentPerformance")}>
          <div className="h-[180px]" aria-hidden>
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
          <div className="h-[180px]" aria-hidden>
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
        <div className="divide-y divide-border/50 pl-6.5" role="list">
          {catPerformance.sort((a, b) => a.accuracy - b.accuracy).map((categoryResult) => (
            <div key={categoryResult.name} className="flex items-center gap-4 px-4 py-3" role="listitem">
              <span className="flex-shrink-0 text-xl" aria-hidden>{categoryResult.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-foreground">{categoryResult.name}</p>
                  <span className={`text-[11px] font-bold ${questionAccuracyTextClass(categoryResult.accuracy)}`}>{categoryResult.accuracy}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-border" aria-hidden>
                  <div
                    className={`h-full rounded-full transition-all ${questionAccuracyBarClass(categoryResult.accuracy)}`}
                    style={{ width: `${categoryResult.accuracy}%` }}
                  />
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
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
                <span className="w-6 flex-shrink-0 text-[12px] font-bold text-muted-foreground">{studentIndex + 1}</span>
                <div className="flex-1">
                  <div className="mb-0.5 flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-foreground">
                      {studentStat.name}{" "}
                      <span className="font-normal text-muted-foreground">· {studentStat.class}</span>
                    </p>
                    <p className="text-[12px] font-bold text-foreground">{studentStat.avg}%</p>
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
