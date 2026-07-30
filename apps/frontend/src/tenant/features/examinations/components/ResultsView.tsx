import React, { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { StudentResultCard } from "@/tenant/features/examinations/components/StudentResultCard";
import { CertificatePreview } from "@/tenant/features/examinations/components/CertificatePreview";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleColumnCustomizer } from "@/components/ui/ModuleColumnCustomizer";
import { Button } from "@/components/ui/button";
import { type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { useResultsViewData } from "@/tenant/features/examinations/components/useResultsViewData";
import { ResultsViewStats } from "@/tenant/features/examinations/components/ResultsViewStats";
import { ResultsViewRankingsList } from "@/tenant/features/examinations/components/ResultsViewRankingsList";
import type { RankedResult, ResultsViewProps } from "@/tenant/features/examinations/components/resultsViewTypes";

/**
 * Rankings view component summarizing examination results and score distributions.
 */
export function ResultsView({
  exams,
  results,
  onFilteredCountChange,
  isColumnVisible,
  columnCustomizer,
}: ResultsViewProps): React.ReactElement {
  const { t } = useTranslation();
  const [selectedExam, setSelectedExam] = useState<string>(exams[0]?.id || "");
  const [selectedStudent, setSelectedStudent] = useState<RankedResult | null>(null);
  const [certStudent, setCertStudent] = useState<RankedResult | null>(null);

  const passFailConfig = useMemo<Record<string, StatusBadgeConfigItem>>(() => ({
    pass: { label: t("examinations.pass"), cls: SEMANTIC_BADGE.success },
    fail: { label: t("examinations.fail"), cls: SEMANTIC_BADGE.destructive },
  }), [t]);

  const { exam, rankedResults, stats } = useResultsViewData({
    exams,
    results,
    selectedExam,
    onFilteredCountChange,
  });

  const showRank = isColumnVisible ? isColumnVisible("rank") : true;
  const showStudent = isColumnVisible ? isColumnVisible("student") : true;
  const showClassRoll = isColumnVisible ? isColumnVisible("classRoll") : true;
  const showMarks = isColumnVisible ? isColumnVisible("marks") : true;
  const showPercentage = isColumnVisible ? isColumnVisible("percentage") : true;
  const showGrade = isColumnVisible ? isColumnVisible("grade") : true;
  const showPassFail = isColumnVisible ? isColumnVisible("passFail") : true;

  return (
    <section className="space-y-5" aria-labelledby="results-view-title">
      <h2 id="results-view-title" className="sr-only">{t("examinations.results")}</h2>

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("examinations.selectExam")}>
          {exams.map((examOption) => {
            const isSelected = selectedExam === examOption.id;
            return (
              <Button
                key={examOption.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedExam(examOption.id)}
                className={`px-3.5 py-2 rounded-lg border text-sm font-semibold transition-all ${isSelected ? "border-primary bg-primary/5 text-primary" : "border-border bg-card hover:bg-muted text-foreground"}`}
              >
                {examOption.name}
              </Button>
            );
          })}
        </div>
        {columnCustomizer && (
          <ModuleColumnCustomizer
            columnRegistry={columnCustomizer.columnRegistry}
            updateUserColumnLayout={columnCustomizer.updateUserColumnLayout}
            labels={columnCustomizer.labels}
          />
        )}
      </div>

      {exam && (
        <>
          {stats && <ResultsViewStats stats={stats} t={t} />}

          <ResultsViewRankingsList
            exam={exam}
            rankedResults={rankedResults}
            passFailConfig={passFailConfig}
            showRank={showRank}
            showStudent={showStudent}
            showClassRoll={showClassRoll}
            showMarks={showMarks}
            showPercentage={showPercentage}
            showGrade={showGrade}
            showPassFail={showPassFail}
            onSelectResult={setSelectedStudent}
            onCertificate={setCertStudent}
            t={t}
          />
        </>
      )}

      <AnimatePresence>
        {selectedStudent && (
          <StudentResultCard
            result={selectedStudent}
            exam={exam!}
            allResults={rankedResults}
            onClose={() => setSelectedStudent(null)}
            onCertificate={() => { setCertStudent(selectedStudent); setSelectedStudent(null); }}
          />
        )}
        {certStudent && (
          <CertificatePreview
            result={certStudent}
            exam={exam!}
            onClose={() => setCertStudent(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
