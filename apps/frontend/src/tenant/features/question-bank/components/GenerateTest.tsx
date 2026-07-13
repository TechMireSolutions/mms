import React, { useState, useEffect, useMemo, useRef } from "react";
import { Sparkles, X, Save, CheckCircle2, AlertCircle, Printer } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuestionBankConfig } from "@/tenant/features/question-bank/hooks/useQuestionBankConfig";
import {
  getQuestionCategoryIds,
  QUESTION_DIFFICULTY_BADGE_CLASSES,
  type QuestionBankQuestion as Question,
  type QuestionBankTest,
} from "@mms/shared";
import { FORM_INPUT, FORM_LABEL } from "@/components/ui/formStyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/FormSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/lib/notify";
import { generateQuestionBankTestSelection } from "@/tenant/features/question-bank/hooks/useQuestionBankApi";

const PAPER_PRINT_STYLES = `
  .qpaper { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; color: #111827; font-family: Inter, Arial, sans-serif; padding: 18mm; box-sizing: border-box; }
  .qpaper-header { text-align: center; border-bottom: 2px solid #111827; padding-bottom: 10px; margin-bottom: 14px; }
  .qpaper-title { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0; }
  .qpaper-subtitle { margin: 6px 0 0; font-size: 12px; color: #374151; }
  .qpaper-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0 14px; font-size: 11px; }
  .qpaper-meta-cell { border: 1px solid #d1d5db; padding: 7px 8px; min-height: 30px; }
  .qpaper-meta-label { display: block; color: #6b7280; font-size: 9px; text-transform: uppercase; margin-bottom: 2px; }
  .qpaper-instructions { border: 1px solid #d1d5db; padding: 8px 10px; margin-bottom: 14px; font-size: 11px; line-height: 1.45; }
  .qpaper-section-title { font-size: 13px; font-weight: 800; margin: 0 0 10px; }
  .qpaper-question { break-inside: avoid; page-break-inside: avoid; margin-bottom: 15px; }
  .qpaper-question-text { display: flex; gap: 8px; font-size: 13px; font-weight: 700; line-height: 1.5; margin-bottom: 8px; }
  .qpaper-question-number { min-width: 24px; font-weight: 800; }
  .qpaper-options { display: grid; grid-template-columns: 1fr 1fr; gap: 7px 12px; margin-left: 32px; font-size: 12px; }
  .qpaper-option { display: flex; gap: 6px; align-items: flex-start; }
  .qpaper-lines { margin-left: 32px; padding-top: 4px; }
  .qpaper-line { border-bottom: 1px solid #9ca3af; height: 20px; margin-bottom: 8px; }
  .qpaper-matching { margin-left: 32px; width: calc(100% - 32px); border-collapse: collapse; font-size: 12px; }
  .qpaper-matching td { border: 1px solid #d1d5db; padding: 7px 8px; vertical-align: top; }
  .qpaper-footer { margin-top: 18px; display: flex; justify-content: space-between; color: #6b7280; font-size: 10px; }
  @page { size: A4; margin: 0; }
  @media print {
    html, body { background: #fff; margin: 0; }
    .qpaper { width: 210mm; min-height: 297mm; margin: 0; box-shadow: none; }
  }
`;

const ANSWER_LINE_COUNT_BY_TYPE: Record<Question["type"], number> = {
  mcq: 0,
  true_false: 1,
  short: 3,
  fill_blank: 2,
  matching: 0,
  numeric: 2,
  ordering: 2,
};

interface AIGeneratingProps {
  active: boolean;
}

/**
 * Animated step loader for mock AI generation.
 *
 * @returns Component layout.
 */
function AIGenerating({ active }: AIGeneratingProps): React.ReactElement {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const steps = useMemo(
    () => [
      t("questionBank.generatingStep1"),
      t("questionBank.generatingStep2"),
      t("questionBank.generatingStep3"),
      t("questionBank.generatingStep4"),
    ],
    [t],
  );

  useEffect(() => {
    if (!active) return undefined;
    setStep(0);
    const intervalId = window.setInterval(() => {
      setStep((currentStep) => Math.min(currentStep + 1, steps.length - 1));
    }, 700);
    return () => window.clearInterval(intervalId);
  }, [active, steps.length]);

  return (
    <div className="py-8 text-center space-y-4" role="status" aria-live="polite">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
        <Sparkles className="w-7 h-7 text-primary animate-pulse" aria-hidden="true" />
      </div>
      <p className="text-sm font-bold text-foreground">{t("questionBank.generatingTitle")}</p>
      <div className="max-w-xs mx-auto space-y-2">
        {steps.map((stepLabel, stepIndex) => (
          <div key={stepLabel} className={`flex items-center gap-2 text-[12px] transition-all ${stepIndex <= step ? "text-foreground" : "text-muted-foreground/40"}`}>
            {stepIndex < step ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" aria-hidden="true" />
            ) : stepIndex === step ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" aria-hidden="true" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-border flex-shrink-0" aria-hidden="true" />
            )}
            <span>{stepLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TestConfig {
  name: string;
  examClass: string;
  totalMarks: number;
  instructions: string;
  categoryIds: string[];
  difficulty: "easy" | "medium" | "hard" | "any";
  numQuestions: number;
  duration: number;
  shuffle: boolean;
}

interface GenerateTestProps {
  questions: Question[];
  tests: QuestionBankTest[];
  onCreateTest: (test: QuestionBankTest) => void;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderAnswerLines(question: Question): React.ReactElement | null {
  const lineCount = ANSWER_LINE_COUNT_BY_TYPE[question.type] ?? 2;
  if (lineCount === 0) return null;
  return (
    <div className="qpaper-lines" aria-hidden="true">
      {Array.from({ length: lineCount }, (_, lineIndex) => (
        <div key={lineIndex} className="qpaper-line" />
      ))}
    </div>
  );
}

function PaperQuestion({ question, index }: { question: Question; index: number }): React.ReactElement {
  const { t } = useTranslation();
  const optionLabels = ["A", "B", "C", "D", "E", "F"];
  const options = question.options.filter(Boolean);

  return (
    <div className="qpaper-question">
      <div className="qpaper-question-text">
        <span className="qpaper-question-number">{index + 1}.</span>
        <span>{question.text}</span>
      </div>

      {question.type === "mcq" && options.length > 0 && (
        <div className="qpaper-options">
          {options.map((option, optionIndex) => (
            <div key={`${question.id}-${option}`} className="qpaper-option">
              <strong>{optionLabels[optionIndex] ?? `${optionIndex + 1}`}.</strong>
              <span>{option}</span>
            </div>
          ))}
        </div>
      )}

      {question.type === "true_false" && (
        <div className="qpaper-options">
          <div className="qpaper-option"><strong>A.</strong><span>{t("questionBank.true")}</span></div>
          <div className="qpaper-option"><strong>B.</strong><span>{t("questionBank.false")}</span></div>
        </div>
      )}

      {question.type === "matching" && options.length > 0 && (
        <table className="qpaper-matching">
          <tbody>
            {options.map((option, optionIndex) => (
              <tr key={`${question.id}-${option}`}>
                <td>{optionIndex + 1}. {option}</td>
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {question.type === "ordering" && options.length > 0 && (
        <div className="qpaper-options">
          {options.map((option, optionIndex) => (
            <div key={`${question.id}-${option}`} className="qpaper-option">
              <strong>{optionIndex + 1}.</strong>
              <span>{option}</span>
            </div>
          ))}
        </div>
      )}

      {renderAnswerLines(question)}
    </div>
  );
}

interface PrintablePaperProps {
  config: TestConfig;
  questions: Question[];
}

function PrintablePaper({ config, questions }: PrintablePaperProps): React.ReactElement {
  const { t } = useTranslation();
  const title = config.name || t("questionBank.previewDefaultName");
  const instructions = config.instructions.trim() || t("questionBank.paperDefaultInstructions");

  return (
    <>
      <style>{PAPER_PRINT_STYLES}</style>
      <article className="qpaper" aria-label={t("questionBank.paperPreview")}>
        <header className="qpaper-header">
          <h1 className="qpaper-title">{title}</h1>
          <p className="qpaper-subtitle">{t("questionBank.paperSubtitle")}</p>
        </header>

        <section className="qpaper-meta" aria-label={t("questionBank.paperDetails")}>
          <div className="qpaper-meta-cell">
            <span className="qpaper-meta-label">{t("questionBank.paperStudentName")}</span>
            &nbsp;
          </div>
          <div className="qpaper-meta-cell">
            <span className="qpaper-meta-label">{t("questionBank.paperRollNo")}</span>
            &nbsp;
          </div>
          <div className="qpaper-meta-cell">
            <span className="qpaper-meta-label">{t("questionBank.paperClass")}</span>
            {config.examClass || " "}
          </div>
          <div className="qpaper-meta-cell">
            <span className="qpaper-meta-label">{t("questionBank.paperDate")}</span>
            &nbsp;
          </div>
          <div className="qpaper-meta-cell">
            <span className="qpaper-meta-label">{t("questionBank.paperDuration")}</span>
            {t("questionBank.previewDuration", { minutes: config.duration })}
          </div>
          <div className="qpaper-meta-cell">
            <span className="qpaper-meta-label">{t("questionBank.paperTotalMarks")}</span>
            {config.totalMarks}
          </div>
          <div className="qpaper-meta-cell">
            <span className="qpaper-meta-label">{t("questionBank.paperQuestionsCount")}</span>
            {questions.length}
          </div>
          <div className="qpaper-meta-cell">
            <span className="qpaper-meta-label">{t("questionBank.paperSignature")}</span>
            &nbsp;
          </div>
        </section>

        <section className="qpaper-instructions">
          <strong>{t("questionBank.paperInstructions")}:</strong> {instructions}
        </section>

        <section>
          <h2 className="qpaper-section-title">{t("questionBank.paperQuestions")}</h2>
          {questions.map((question, index) => (
            <PaperQuestion key={question.id} question={question} index={index} />
          ))}
        </section>

        <footer className="qpaper-footer">
          <span>{t("questionBank.paperGeneratedFromBank")}</span>
          <span>{title}</span>
        </footer>
      </article>
    </>
  );
}

/**
 * AI-driven test paper generator component.
 *
 * @param props - Component props.
 * @param props.questions - Currently registered questions in bank.
 * @param props.categories - Categories details.
 * @param props.tests - Existing tests.
 * @param props.onCreateTest - Callback when test is generated and saved.
 * @returns The GenerateTest component.
 */
export function GenerateTest({ questions, onCreateTest }: GenerateTestProps): React.ReactElement {
  const { t } = useTranslation();
  const qbConfig = useQuestionBankConfig(questions);
  const printRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<string>("config"); // config | generating | preview | done
  const [config, setConfig] = useState<TestConfig>(() => ({
    name: "",
    examClass: "",
    totalMarks: 100,
    instructions: "",
    categoryIds: [],
    difficulty: qbConfig.enabledDifficulties[0] ?? "medium",
    numQuestions: 10,
    duration: qbConfig.defaultTestDuration,
    shuffle: true,
  }));
  const [generatedQIds, setGeneratedQIds] = useState<string[]>([]);
  const [generationMode, setGenerationMode] = useState<'ai' | 'fallback' | null>(null);

  const updateTestConfig = (field: keyof TestConfig, value: TestConfig[keyof TestConfig]) => setConfig((draftConfig) => ({ ...draftConfig, [field]: value }));
  const toggleCategory = (id: string) => setConfig((draftConfig) => ({ ...draftConfig, categoryIds: draftConfig.categoryIds.includes(id) ? draftConfig.categoryIds.filter((categoryId) => categoryId !== id) : [...draftConfig.categoryIds, id] }));

  const eligiblePool = useMemo(() => {
    return questions.filter((question) => {
      const mCat =
        config.categoryIds.length === 0 ||
        getQuestionCategoryIds(question).some((categoryId) => config.categoryIds.includes(categoryId));
      const mDiff = config.difficulty === "any" || question.difficulty === config.difficulty;
      return mCat && mDiff;
    });
  }, [config.categoryIds, config.difficulty, questions]);

  const generatedQuestions = useMemo(
    () =>
      generatedQIds
        .map((questionId) => questions.find((candidateQuestion) => candidateQuestion.id === questionId))
        .filter((question): question is Question => Boolean(question)),
    [generatedQIds, questions],
  );

  const handlePrintPaper = (): void => {
    const content = printRef.current;
    if (!content) return;
    const title = config.name || t("questionBank.previewDefaultName");
    const printWindow = window.open("", "_blank", "width=900,height=800");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>${escapeHtml(title)}</title>
        <style>${PAPER_PRINT_STYLES}</style>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" />
      </head>
      <body>
        ${content.innerHTML}
        <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleGenerate = async (): Promise<void> => {
    setStep("generating");
    setGenerationMode(null);
    try {
      const result = await generateQuestionBankTestSelection({
        categoryIds: config.categoryIds,
        difficulty: config.difficulty,
        numQuestions: config.numQuestions,
        shuffle: config.shuffle,
      });
      setGeneratedQIds(result.questionIds);
      setGenerationMode(result.mode);
      if (result.mode === 'fallback') {
        notify.warning(t('questionBank.aiFallbackTitle'), {
          description: result.message || t('questionBank.aiFallbackDesc'),
        });
      }
      setStep("preview");
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : t('questionBank.aiGenerationFailedDesc');
      notify.error(t('questionBank.aiGenerationFailed'), { description: message });
      setStep("config");
    }
  };

  const handleSave = () => {
    const diffVal: "easy" | "medium" | "hard" | "mixed" = 
      config.difficulty === "any" ? "mixed" : (config.difficulty as "easy" | "medium" | "hard");

    onCreateTest({
      id: `test${Date.now()}`,
      name: config.name || t("questionBank.previewDefaultName"),
      categoryId: config.categoryIds.length === 1 ? config.categoryIds[0] : null,
      difficulty: diffVal,
      questionIds: generatedQIds,
      duration: config.duration,
      createdAt: new Date().toISOString(),
    });
    setStep("done");
  };

  const getCat = (categoryId: string) => qbConfig.categories.find((category) => category.id === categoryId);

  const diffSelectOptions = useMemo(() => [
    { value: "any", label: t("questionBank.difficultyAny") },
    ...qbConfig.enabledDifficulties.map((difficulty) => ({ value: difficulty, label: qbConfig.difficultyLabel(difficulty) }))
  ], [qbConfig, t]);

  if (step === "done") {
    return (
      <div className="py-16 text-center space-y-4" role="status" aria-live="polite">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-success" aria-hidden="true" />
        </div>
        <p className="text-base font-bold text-foreground">{t("questionBank.testCreated")}</p>
        <p className="text-sm text-muted-foreground">{t("questionBank.testCreatedDesc")}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            onClick={handlePrintPaper}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 h-auto"
          >
            <Printer className="w-4 h-4" aria-hidden="true" /> {t("questionBank.printPaper")}
          </Button>
          <Button
            type="button"
            onClick={() => setStep("config")}
            variant="outline"
            className="px-5 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-muted h-auto shadow-none"
          >
            {t("questionBank.generateAnother")}
          </Button>
        </div>
        <div ref={printRef} className="sr-only" aria-hidden="true">
          <PrintablePaper config={config} questions={generatedQuestions} />
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-2xl mx-auto space-y-5" aria-labelledby="ai-generator-title">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h2 id="ai-generator-title" className="text-[15px] font-bold text-foreground">{t("questionBank.generatorTitle")}</h2>
          <p className="text-[12px] text-muted-foreground">{t("questionBank.generatorSubtitle")}</p>
        </div>
      </div>

      {step === "generating" && <AIGenerating active />}

      {step === "config" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
          <div>
            <label htmlFor="config-name" className={FORM_LABEL}>{t("questionBank.testName")}</label>
            <Input
              id="config-name"
              className={`${FORM_INPUT} shadow-none`}
              value={config.name}
              onChange={(event) => updateTestConfig("name", event.target.value)}
              placeholder={t("questionBank.testNamePlaceholder")}
            />
          </div>

          <div>
            <span className={FORM_LABEL}>{t("questionBank.categoriesHint")}</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("questionBank.selectCategoriesAria")}>
              {qbConfig.categories.map((category) => {
                const active = config.categoryIds.includes(category.id);
                return (
                  <Button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-all h-auto shadow-none ${active ? "text-white border-transparent" : "border-border bg-muted text-foreground hover:bg-muted/80"}`}
                    style={active ? { background: category.color, borderColor: category.color } : {}}
                  >
                    <span>{category.icon}</span> <span>{category.name}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="config-difficulty" className={FORM_LABEL}>{t("questionBank.difficulty")}</label>
              <FormSelect
                id="config-difficulty"
                value={config.difficulty}
                onChange={(difficulty) => updateTestConfig("difficulty", difficulty)}
                options={diffSelectOptions}
              />
            </div>
            <div>
              <label htmlFor="config-num" className={FORM_LABEL}>{t("questionBank.numQuestions")}</label>
              <Input
                id="config-num"
                type="number"
                className={`${FORM_INPUT} shadow-none`}
                value={config.numQuestions}
                onChange={(event) => updateTestConfig("numQuestions", +event.target.value)}
                min={1}
                max={questions.length}
              />
            </div>
            <div>
              <label htmlFor="config-duration" className={FORM_LABEL}>{t("questionBank.durationMin")}</label>
              <Input
                id="config-duration"
                type="number"
                className={`${FORM_INPUT} shadow-none`}
                value={config.duration}
                onChange={(event) => updateTestConfig("duration", +event.target.value)}
                min={5}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="config-class" className={FORM_LABEL}>{t("questionBank.paperClass")}</label>
              <Input
                id="config-class"
                className={`${FORM_INPUT} shadow-none`}
                value={config.examClass}
                onChange={(event) => updateTestConfig("examClass", event.target.value)}
                placeholder={t("questionBank.paperClassPlaceholder")}
              />
            </div>
            <div>
              <label htmlFor="config-marks" className={FORM_LABEL}>{t("questionBank.paperTotalMarks")}</label>
              <Input
                id="config-marks"
                type="number"
                className={`${FORM_INPUT} shadow-none`}
                value={config.totalMarks}
                onChange={(event) => updateTestConfig("totalMarks", +event.target.value)}
                min={1}
              />
            </div>
          </div>

          <div>
            <label htmlFor="config-instructions" className={FORM_LABEL}>{t("questionBank.paperInstructions")}</label>
            <Textarea
              id="config-instructions"
              className={`${FORM_INPUT} min-h-20 shadow-none`}
              value={config.instructions}
              onChange={(event) => updateTestConfig("instructions", event.target.value)}
              placeholder={t("questionBank.paperInstructionsPlaceholder")}
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <Checkbox
              checked={config.shuffle}
              onCheckedChange={(checked) => updateTestConfig("shuffle", !!checked)}
            />
            <span className="text-sm text-foreground">{t("questionBank.shuffle")}</span>
          </label>

          {/* Pool preview */}
          {(() => {
            const valid = eligiblePool.length >= config.numQuestions;
            return (
              <div
                className={`flex items-center gap-2 text-[12px] rounded-lg border px-3 py-2 ${valid ? "border-success/30 bg-success/10 text-success" : "border-warning/30 bg-warning/10 text-warning"}`}
                role="status"
              >
                {valid ? (
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>
                  {valid
                    ? t("questionBank.poolAvailable", { count: eligiblePool.length })
                    : t("questionBank.poolInsufficient")}
                </span>
              </div>
            );
          })()}

          <Button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={!config.numQuestions || eligiblePool.length < config.numQuestions}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-60 h-auto"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" /> {t("questionBank.generateTest")}
          </Button>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-4" aria-label={t("questionBank.previewTest")}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-bold text-foreground m-0">
                  {t("questionBank.previewTitle", {
                    name: config.name || t("questionBank.previewDefaultName"),
                  })}
                </h3>
                {generationMode ? (
                  <p className="text-[11px] text-muted-foreground m-0">
                    {generationMode === 'ai' ? t('questionBank.aiGeneratedSelection') : t('questionBank.fallbackGeneratedSelection')}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {t("questionBank.previewQuestionCount", { count: generatedQIds.length })}
                </span>
                <span className="text-[11px] text-muted-foreground" aria-hidden>·</span>
                <span className="text-[11px] text-muted-foreground">
                  {t("questionBank.previewDuration", { minutes: config.duration })}
                </span>
              </div>
            </div>
            <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1" role="list" aria-label={t("questionBank.previewTest")}>
              {generatedQIds.map((questionId, questionIndex) => {
                const question = questions.find((candidateQuestion) => candidateQuestion.id === questionId);
                if (!question) return null;
                const diffCls = QUESTION_DIFFICULTY_BADGE_CLASSES[question.difficulty] ?? "";
                return (
                  <div key={questionId} className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3" role="listitem">
                    <span className="mt-0.5 w-5 flex-shrink-0 text-[11px] font-bold text-muted-foreground">
                      {t("questionBank.previewQuestionLabel", { n: questionIndex + 1 })}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-foreground leading-snug m-0">{question.text}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {getQuestionCategoryIds(question).map((catId) => {
                          const cat = getCat(catId);
                          if (!cat) return null;
                          return (
                            <span
                              key={catId}
                              className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
                              style={{ background: cat.color }}
                            >
                              {cat.name}
                            </span>
                          );
                        })}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${diffCls}`}>
                          {qbConfig.difficultyLabel(question.difficulty)}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setGeneratedQIds((previousQuestionIds) => previousQuestionIds.filter((generatedQuestionId) => generatedQuestionId !== questionId))}
                      aria-label={t("questionBank.removeQuestionAria", { n: questionIndex + 1 })}
                      variant="ghost"
                      className="p-1 rounded hover:bg-muted text-muted-foreground flex-shrink-0 h-auto shadow-none"
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="rounded-xl border border-border bg-muted/20 p-4" aria-label={t("questionBank.paperPreview")}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="m-0 text-[13px] font-bold text-foreground">{t("questionBank.paperPreview")}</h3>
                <p className="m-0 text-[11px] text-muted-foreground">{t("questionBank.paperPreviewDesc")}</p>
              </div>
              <Button
                type="button"
                onClick={handlePrintPaper}
                variant="outline"
                className="inline-flex items-center gap-2 px-3 py-2 h-auto rounded-lg border border-border text-xs font-semibold hover:bg-muted shadow-none"
              >
                <Printer className="w-3.5 h-3.5" aria-hidden="true" /> {t("questionBank.printPaper")}
              </Button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-border bg-white p-3">
              <div ref={printRef} className="origin-top scale-[0.58] sm:scale-[0.7] md:scale-[0.78]" style={{ width: "210mm", height: "210mm" }}>
                <PrintablePaper config={config} questions={generatedQuestions} />
              </div>
            </div>
          </section>
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => setStep("config")}
              variant="outline"
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted h-auto shadow-none"
            >
              {t("questionBank.back")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 h-auto"
            >
              <Save className="w-4 h-4" aria-hidden="true" /> {t("questionBank.saveTest")}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
