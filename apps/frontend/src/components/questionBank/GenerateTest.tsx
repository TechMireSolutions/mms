import React, { useState, useEffect, useMemo } from "react";
import { Sparkles, X, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuestionBankConfig } from "@/hooks/useQuestionBankConfig";
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


interface AIGeneratingProps {
  onDone: () => void;
}

/**
 * Animated step loader for mock AI generation.
 *
 * @returns Component layout.
 */
function AIGenerating({ onDone }: AIGeneratingProps): React.ReactElement {
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
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    steps.forEach((_, index) => {
      timeouts.push(setTimeout(() => setStep(index), 700 * index));
    });
    timeouts.push(setTimeout(onDone, 700 * steps.length + 400));
    return () => timeouts.forEach(clearTimeout);
  }, [onDone, steps]);

  return (
    <div className="py-8 text-center space-y-4" role="status" aria-live="polite">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
        <Sparkles className="w-7 h-7 text-primary animate-pulse" aria-hidden="true" />
      </div>
      <p className="text-sm font-bold text-foreground">{t("questionBank.generatingTitle")}</p>
      <div className="max-w-xs mx-auto space-y-2">
        {steps.map((s, i) => (
          <div key={s} className={`flex items-center gap-2 text-[12px] transition-all ${i <= step ? "text-foreground" : "text-muted-foreground/40"}`}>
            {i < step ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" aria-hidden="true" />
            ) : i === step ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" aria-hidden="true" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full border border-border flex-shrink-0" aria-hidden="true" />
            )}
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TestConfig {
  name: string;
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
  const [step, setStep] = useState<string>("config"); // config | generating | preview | done
  const [config, setConfig] = useState<TestConfig>(() => ({
    name: "",
    categoryIds: [],
    difficulty: qbConfig.enabledDifficulties[0] ?? "medium",
    numQuestions: 10,
    duration: qbConfig.defaultTestDuration,
    shuffle: true,
  }));
  const [generatedQIds, setGeneratedQIds] = useState<string[]>([]);

  const upd = (f: keyof TestConfig, v: TestConfig[keyof TestConfig]) => setConfig((d) => ({ ...d, [f]: v }));
  const toggleCat = (id: string) => setConfig((d) => ({ ...d, categoryIds: d.categoryIds.includes(id) ? d.categoryIds.filter((x) => x !== id) : [...d.categoryIds, id] }));

  const handleGenerate = () => {
    setStep("generating");
  };

  const onGeneratingDone = () => {
    // Pick questions matching criteria
    let pool = questions.filter((q) => {
      const mCat =
        config.categoryIds.length === 0 ||
        getQuestionCategoryIds(q).some((id) => config.categoryIds.includes(id));
      const mDiff = config.difficulty === "any" || q.difficulty === config.difficulty;
      return mCat && mDiff;
    });
    if (config.shuffle) {
      pool = [...pool].sort(() => Math.random() - 0.5);
    }
    const picked = pool.slice(0, config.numQuestions).map((q) => q.id);
    setGeneratedQIds(picked);
    setStep("preview");
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

  const getCat = (id: string) => qbConfig.categories.find((c) => c.id === id);

  const diffSelectOptions = useMemo(() => [
    { value: "any", label: t("questionBank.difficultyAny") },
    ...qbConfig.enabledDifficulties.map((k) => ({ value: k, label: qbConfig.difficultyLabel(k) }))
  ], [qbConfig, t]);

  if (step === "done") {
    return (
      <div className="py-16 text-center space-y-4" role="status" aria-live="polite">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-success" aria-hidden="true" />
        </div>
        <p className="text-base font-bold text-foreground">{t("questionBank.testCreated")}</p>
        <p className="text-sm text-muted-foreground">{t("questionBank.testCreatedDesc")}</p>
        <Button
          type="button"
          onClick={() => setStep("config")}
          className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 h-auto"
        >
          {t("questionBank.generateAnother")}
        </Button>
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

      {step === "generating" && <AIGenerating onDone={onGeneratingDone} />}

      {step === "config" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
          <div>
            <label htmlFor="config-name" className={FORM_LABEL}>{t("questionBank.testName")}</label>
            <Input
              id="config-name"
              className={`${FORM_INPUT} shadow-none`}
              value={config.name}
              onChange={(e) => upd("name", e.target.value)}
              placeholder={t("questionBank.testNamePlaceholder")}
            />
          </div>

          <div>
            <span className={FORM_LABEL}>{t("questionBank.categoriesHint")}</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("questionBank.selectCategoriesAria")}>
              {qbConfig.categories.map((c) => {
                const active = config.categoryIds.includes(c.id);
                return (
                  <Button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCat(c.id)}
                    className={`flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full border transition-all h-auto shadow-none ${active ? "text-white border-transparent" : "border-border bg-muted text-foreground hover:bg-muted/80"}`}
                    style={active ? { background: c.color, borderColor: c.color } : {}}
                  >
                    <span>{c.icon}</span> <span>{c.name}</span>
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
                onChange={(val) => upd("difficulty", val)}
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
                onChange={(e) => upd("numQuestions", +e.target.value)}
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
                onChange={(e) => upd("duration", +e.target.value)}
                min={5}
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <Checkbox
              checked={config.shuffle}
              onCheckedChange={(checked) => upd("shuffle", !!checked)}
            />
            <span className="text-sm text-foreground">{t("questionBank.shuffle")}</span>
          </label>

          {/* Pool preview */}
          {(() => {
            const pool = questions.filter((q) => {
              const mCat =
        config.categoryIds.length === 0 ||
        getQuestionCategoryIds(q).some((id) => config.categoryIds.includes(id));
              const mDiff = config.difficulty === "any" || q.difficulty === config.difficulty;
              return mCat && mDiff;
            });
            const valid = pool.length >= config.numQuestions;
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
                    ? t("questionBank.poolAvailable", { count: pool.length })
                    : t("questionBank.poolInsufficient")}
                </span>
              </div>
            );
          })()}

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!config.numQuestions || questions.filter((q) => {
              const mCat =
        config.categoryIds.length === 0 ||
        getQuestionCategoryIds(q).some((id) => config.categoryIds.includes(id));
              const mDiff = config.difficulty === "any" || q.difficulty === config.difficulty;
              return mCat && mDiff;
            }).length < config.numQuestions}
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
              <h3 className="text-[13px] font-bold text-foreground m-0">
                {t("questionBank.previewTitle", {
                  name: config.name || t("questionBank.previewDefaultName"),
                })}
              </h3>
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
              {generatedQIds.map((id, i) => {
                const q = questions.find((x) => x.id === id);
                if (!q) return null;
                const diffCls = QUESTION_DIFFICULTY_BADGE_CLASSES[q.difficulty] ?? "";
                return (
                  <div key={id} className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3" role="listitem">
                    <span className="mt-0.5 w-5 flex-shrink-0 text-[11px] font-bold text-muted-foreground">
                      {t("questionBank.previewQuestionLabel", { n: i + 1 })}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-foreground leading-snug m-0">{q.text}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {getQuestionCategoryIds(q).map((catId) => {
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
                          {qbConfig.difficultyLabel(q.difficulty)}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setGeneratedQIds((p) => p.filter((x) => x !== id))}
                      aria-label={t("questionBank.removeQuestionAria", { n: i + 1 })}
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
