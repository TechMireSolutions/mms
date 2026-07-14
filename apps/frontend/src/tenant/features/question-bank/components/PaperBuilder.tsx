import React, { useMemo, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { useQuestionBankConfig } from "@/tenant/features/question-bank/hooks/useQuestionBankConfig";
import { type QuestionBankQuestion as Question, type QuestionBankTest } from "@mms/shared";
import { usePaperBuilderState } from "@/tenant/features/question-bank/hooks/usePaperBuilderState";
import { PaperDetailsForm } from "@/tenant/features/question-bank/components/PaperDetailsForm";
import { PaperPreviewPanel } from "@/tenant/features/question-bank/components/PaperPreviewPanel";
import { PaperQuestionPicker } from "@/tenant/features/question-bank/components/PaperQuestionPicker";
import { PaperSectionsEditor } from "@/tenant/features/question-bank/components/PaperSectionsEditor";
import { SavedPapersPanel } from "@/tenant/features/question-bank/components/SavedPapersPanel";
import {
  ALL_FILTER,
  createPaperDraftFromTest,
  getPaperQuestionIds,
  normalizePaperSections,
  openPaperPrintWindow,
} from "@/tenant/features/question-bank/components/paperBuilderUtils";

interface PaperBuilderProps {
  questions: Question[];
  tests: QuestionBankTest[];
  activeTab?: PaperBuilderTab;
  showHeader?: boolean;
  onSaveTest: (test: QuestionBankTest) => Promise<void>;
}

export type PaperBuilderTab = "details" | "saved" | "sections" | "questions" | "preview";

/**
 * Manual paper builder for examination papers.
 */
export function PaperBuilder({ questions, tests, activeTab, showHeader = true, onSaveTest }: PaperBuilderProps): React.ReactElement {
  const { t } = useTranslation();
  const qbConfig = useQuestionBankConfig(questions);
  const printRef = useRef<HTMLDivElement>(null);
  const [activePaperId, setActivePaperId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const {
    activeSection,
    addQuestionToActiveSection,
    addSection,
    categoryFilter,
    config,
    difficultyFilter,
    filteredQuestions,
    loadPaperDraft,
    questionsById,
    removeQuestionFromSection,
    removeSection,
    saved,
    search,
    sections,
    selectedCount,
    selectedQuestionIds,
    setActiveSectionId,
    setCategoryFilter,
    setDifficultyFilter,
    setSaved,
    setSearch,
    updateConfig,
    updateSection,
  } = usePaperBuilderState({
    defaultDuration: qbConfig.defaultTestDuration,
    defaultSectionTitle: (sectionNumber) => t("questionBank.defaultSectionTitle", { n: sectionNumber }),
    questions,
  });

  const categoryById = useMemo(
    () => new Map(qbConfig.categories.map((category) => [category.id, { color: category.color, name: category.name }])),
    [qbConfig.categories],
  );

  const categoryOptions = useMemo(
    () => [
      { value: ALL_FILTER, label: t("questionBank.allCategories") },
      ...qbConfig.categories.map((category) => ({ value: category.id, label: category.name })),
    ],
    [qbConfig.categories, t],
  );

  const difficultyOptions = useMemo(
    () => [
      { value: ALL_FILTER, label: t("questionBank.difficultyAny") },
      ...qbConfig.enabledDifficulties.map((difficulty) => ({ value: difficulty, label: qbConfig.difficultyLabel(difficulty) })),
    ],
    [qbConfig, t],
  );

  const handlePrintPaper = (): void => {
    const content = printRef.current;
    if (!content) return;
    const title = config.name || t("questionBank.previewDefaultName");
    const didOpen = openPaperPrintWindow(content, title);
    if (!didOpen) notify.warning(t("questionBank.printWindowBlocked"));
  };

  const describeError = (caughtError: unknown): string | undefined =>
    caughtError instanceof Error ? caughtError.message : undefined;

  const handleSave = async () => {
    const paperSections = normalizePaperSections(sections);
    const questionIds = getPaperQuestionIds(paperSections);
    if (questionIds.length === 0 || saving) return;
    const currentPaper = activePaperId ? tests.find((paper) => paper.id === activePaperId) : undefined;
    const examClass = config.examClass.trim();
    const instructions = config.instructions.trim();
    const paperName = config.name.trim() || t("questionBank.previewDefaultName");
    const savedPaper = {
      id: activePaperId ?? `paper-${Date.now()}`,
      name: paperName,
      categoryId: null,
      difficulty: "mixed",
      questionIds,
      duration: config.duration,
      createdAt: currentPaper?.createdAt ?? new Date().toISOString(),
      ...(examClass ? { examClass } : {}),
      totalMarks: config.totalMarks,
      ...(instructions ? { instructions } : {}),
      sections: paperSections,
    } satisfies QuestionBankTest;
    setSaving(true);
    try {
      await onSaveTest(savedPaper);
      setActivePaperId(savedPaper.id);
      setSaved(true);
      notify.success(t("questionBank.paperSaved"), { description: t("questionBank.testCreatedDesc") });
    } catch (caughtError: unknown) {
      notify.error(t("questionBank.paperSaveFailed"), { description: describeError(caughtError) });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPaper = (paper: QuestionBankTest): void => {
    const draft = createPaperDraftFromTest(
      paper,
      (sectionNumber) => t("questionBank.defaultSectionTitle", { n: sectionNumber }),
    );
    loadPaperDraft(draft.config, draft.sections);
    setActivePaperId(paper.id);
    notify.success(t("questionBank.paperLoaded"), { description: paper.name });
  };

  return (
    <article className="space-y-3 sm:space-y-4" aria-labelledby={showHeader ? "paper-generator-title" : undefined}>
      {showHeader || saved ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          {showHeader && (
            <div>
              <h2 id="paper-generator-title" className="m-0 text-[15px] font-bold text-foreground">
                {t("questionBank.generatorTitle")}
              </h2>
              <p className="m-0 text-[12px] text-muted-foreground">{t("questionBank.manualPaperGeneratorSubtitle")}</p>
            </div>
          )}
          {saved && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t("questionBank.paperSaved")}
            </span>
          )}
        </div>
      ) : null}

      {(!activeTab || activeTab === "details") && (
        <PaperDetailsForm config={config} onChange={updateConfig} />
      )}

      {(!activeTab || activeTab === "saved") && (
        <SavedPapersPanel
          activePaperId={activePaperId}
          papers={tests}
          onOpenPaper={handleOpenPaper}
        />
      )}

      {!activeTab && (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)] xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.8fr)]">
          <PaperSectionsEditor
            activeSectionId={activeSection?.id ?? ""}
            questionsById={questionsById}
            sections={sections}
            selectedCount={selectedCount}
            onAddSection={addSection}
            onRemoveQuestion={removeQuestionFromSection}
            onRemoveSection={removeSection}
            onSelectSection={setActiveSectionId}
            onUpdateSection={updateSection}
          />

          <PaperQuestionPicker
            activeSection={activeSection}
            categoryById={categoryById}
            categoryFilter={categoryFilter}
            categoryOptions={categoryOptions}
            difficultyFilter={difficultyFilter}
            difficultyLabel={qbConfig.difficultyLabel}
            difficultyOptions={difficultyOptions}
            questions={filteredQuestions}
            search={search}
            selectedQuestionIds={selectedQuestionIds}
            onAddQuestion={addQuestionToActiveSection}
            onCategoryFilterChange={setCategoryFilter}
            onDifficultyFilterChange={setDifficultyFilter}
            onSearchChange={setSearch}
          />
        </div>
      )}

      {activeTab === "sections" && (
        <PaperSectionsEditor
          activeSectionId={activeSection?.id ?? ""}
          questionsById={questionsById}
          sections={sections}
          selectedCount={selectedCount}
          onAddSection={addSection}
          onRemoveQuestion={removeQuestionFromSection}
          onRemoveSection={removeSection}
          onSelectSection={setActiveSectionId}
          onUpdateSection={updateSection}
        />
      )}

      {activeTab === "questions" && (
        <PaperQuestionPicker
          activeSection={activeSection}
          categoryById={categoryById}
          categoryFilter={categoryFilter}
          categoryOptions={categoryOptions}
          difficultyFilter={difficultyFilter}
          difficultyLabel={qbConfig.difficultyLabel}
          difficultyOptions={difficultyOptions}
          questions={filteredQuestions}
          search={search}
          selectedQuestionIds={selectedQuestionIds}
          onAddQuestion={addQuestionToActiveSection}
          onCategoryFilterChange={setCategoryFilter}
          onDifficultyFilterChange={setDifficultyFilter}
          onSearchChange={setSearch}
        />
      )}

      {(!activeTab || activeTab === "preview") && (
        <PaperPreviewPanel
          config={config}
          printRef={printRef}
          questionsById={questionsById}
          sections={sections}
          selectedCount={selectedCount}
          saving={saving}
          onPrint={handlePrintPaper}
          onSave={handleSave}
        />
      )}
    </article>
  );
}
