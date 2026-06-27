import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Clock, Award, ChevronDown, ChevronRight } from "lucide-react";
import {
  isQuestionAnswerCorrect,
  splitQuestionCompoundAnswer,
  type QuestionBankQuestion as Question,
  type QuestionBankResult,
  type QuestionBankTest,
} from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";

function pct(obtained: number, total: number): number {
  return total > 0 ? Math.round((obtained / total) * 100) : 0;
}

function sumScores(scores: Record<string, number>): number {
  return Object.values(scores).reduce((sum, value) => sum + value, 0);
}

function testTotalMarks(test: QuestionBankTest, questions: Question[]): number {
  return test.questionIds.reduce((sum, qid) => {
    const q = questions.find((item) => item.id === qid);
    return sum + (q?.marks ?? 0);
  }, 0);
}

interface GradeResult {
  label: string;
  status: string;
}

function grade(p: number): GradeResult {
  if (p >= 90) return { label: "A+", status: "excellent" };
  if (p >= 80) return { label: "A", status: "excellent" };
  if (p >= 70) return { label: "B", status: "good" };
  if (p >= 60) return { label: "C", status: "warning" };
  if (p >= 50) return { label: "D", status: "warning" };
  return { label: "F", status: "failed" };
}

const GRADE_BADGE_CONFIG: Record<string, StatusBadgeConfigItem> = {
  excellent: { label: "", cls: "bg-success/10 text-success border-success/30" },
  good: { label: "", cls: "bg-primary/10 text-primary border-primary/30" },
  warning: { label: "", cls: "bg-warning/10 text-warning border-warning/30" },
  failed: { label: "", cls: "bg-destructive/10 text-destructive border-destructive/30" },
};

interface ResultRowProps {
  result: QuestionBankResult;
  test: QuestionBankTest;
  questions: Question[];
}

function ResultRow({ result, test, questions }: ResultRowProps): React.ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const totalMarks = testTotalMarks(test, questions) || 100;
  const marksObtained = sumScores(result.scores);
  const p = pct(marksObtained, totalMarks);
  const g = grade(p);

  return (
    <div className="border-b border-border/50 last:border-0">
      <Button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={t("questionBank.grading.showDetailAria", { name: result.studentName })}
        variant="ghost"
        className="flex w-full items-center justify-between gap-3 h-auto px-4 py-3 text-left transition-colors hover:bg-muted/20 shadow-none rounded-none"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground">
            {result.studentName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <p className="text-[13px] font-semibold text-foreground m-0">{result.studentName}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-4">
          <div className="text-right">
            <p className="text-[13px] font-bold text-foreground m-0">{marksObtained}/{totalMarks}</p>
            <p className="text-[10px] text-muted-foreground m-0">{p}%</p>
          </div>
          <StatusBadge
            status={g.status}
            config={{ [g.status]: { ...GRADE_BADGE_CONFIG[g.status], label: g.label } }}
          />
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          )}
        </div>
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 px-4 pb-3" role="list">
              {test.questionIds.map((qid, i) => {
                const q = questions.find((x) => x.id === qid);
                if (!q) return null;
                const studentAns = result.answers?.[qid];
                const correct =
                  q.type === "short"
                    ? studentAns === q.answer
                    : isQuestionAnswerCorrect(q, studentAns);
                const correctDisplay =
                  q.type === "matching" || q.type === "fill_blank" || q.type === "ordering"
                    ? splitQuestionCompoundAnswer(q.answer).join(", ")
                    : q.answer;
                return (
                  <div
                    key={qid}
                    className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-[11px] ${correct ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10"}`}
                    role="listitem"
                  >
                    {correct ? (
                      <CheckCircle2
                        className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-success"
                        aria-label={t("questionBank.grading.correctAnswer")}
                      />
                    ) : (
                      <XCircle
                        className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-destructive"
                        aria-label={t("questionBank.grading.incorrectAnswer")}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold m-0 ${correct ? "text-success" : "text-destructive"}`}>
                        {t("questionBank.grading.questionLabel", { n: i + 1, text: q.text })}
                      </p>
                      {!correct && q.type !== "short" && (
                        <p className="mt-0.5 text-destructive m-0">
                          {t("questionBank.grading.studentAnswer", { answer: studentAns || "—" })}{" "}
                          · {t("questionBank.grading.correctLabel", { answer: correctDisplay })}
                        </p>
                      )}
                      {q.type === "short" && (
                        <p className="mt-0.5 italic text-muted-foreground m-0">
                          {t("questionBank.grading.shortAnswerManual")}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-bold">
                      {correct ? `+${q.marks}` : "0"}/{q.marks}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AutoGradingProps {
  tests: QuestionBankTest[];
  results: QuestionBankResult[];
  questions: Question[];
}

interface StatsSummary {
  avg: number;
  highest: number;
  lowest: number;
}

export function AutoGrading({ tests, results, questions }: AutoGradingProps): React.ReactElement {
  const { t } = useTranslation();
  const [selectedTest, setSelectedTest] = useState<string>(tests[0]?.id || "");
  const test = tests.find((item) => item.id === selectedTest);
  const testResults = results.filter((r) => r.testId === selectedTest);

  const stats = useMemo<StatsSummary | null>(() => {
    if (!test || testResults.length === 0) return null;
    const totalMarks = testTotalMarks(test, questions) || 100;
    const avg = Math.round(
      testResults.reduce((s, r) => s + pct(sumScores(r.scores), totalMarks), 0) / testResults.length,
    );
    const highest = Math.max(...testResults.map((r) => sumScores(r.scores)));
    const lowest = Math.min(...testResults.map((r) => sumScores(r.scores)));
    return { avg, highest, lowest };
  }, [test, testResults, questions]);

  return (
    <section className="space-y-5" aria-labelledby="auto-grading-title">
      <div>
        <span id="auto-grading-title" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("questionBank.grading.selectTest")}
        </span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("questionBank.grading.selectTestAria")}>
          {tests.map((item) => {
            const isSelected = selectedTest === item.id;
            const count = results.filter((r) => r.testId === item.id).length;
            return (
              <Button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedTest(item.id)}
                className={`rounded-lg border px-3.5 py-2 text-[12px] font-semibold transition-all h-auto shadow-none ${isSelected ? "border-primary bg-primary/5 text-primary hover:bg-primary/10" : "border-border bg-card text-foreground hover:bg-muted"}`}
              >
                {item.name}
                <span className="ml-1.5 text-[10px] text-muted-foreground">
                  ({t("questionBank.grading.resultsCount", { count })})
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {test && (
        <>
          {stats && (
            <div className="grid grid-cols-4 gap-3" role="status">
              {[
                { label: t("questionBank.grading.submitted"), value: testResults.length, icon: Clock, cls: "text-primary" },
                { label: t("questionBank.grading.classAvg"), value: `${stats.avg}%`, icon: Award, cls: "text-warning" },
                {
                  label: t("questionBank.grading.highest"),
                  value: `${stats.highest}/${testTotalMarks(test, questions) || 100}`,
                  icon: CheckCircle2,
                  cls: "text-success",
                },
                {
                  label: t("questionBank.grading.lowest"),
                  value: `${stats.lowest}/${testTotalMarks(test, questions) || 100}`,
                  icon: XCircle,
                  cls: "text-destructive",
                },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="rounded-xl border border-border bg-card p-3.5">
                    <Icon className={`mb-1.5 h-4 w-4 ${s.cls}`} aria-hidden />
                    <p className="text-[18px] font-bold text-foreground m-0">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground m-0">{s.label}</p>
                  </div>
                );
              })}
            </div>
          )}

          <section className="overflow-hidden rounded-xl border border-border bg-card" aria-label={t("questionBank.grading.resultsTitle", { name: test.name })}>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-[13px] font-bold text-foreground m-0">
                {t("questionBank.grading.resultsTitle", { name: test.name })}
              </h3>
              <span className="text-[11px] text-muted-foreground">
                {t("questionBank.grading.submissionsCount", { count: testResults.length })}
              </span>
            </div>
            {testResults.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground" role="status">
                {t("questionBank.grading.noResults")}
              </div>
            ) : (
              <div role="list">
                {testResults
                  .sort((a, b) => sumScores(b.scores) - sumScores(a.scores))
                  .map((r) => (
                    <ResultRow key={r.id} result={r} test={test} questions={questions} />
                  ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
