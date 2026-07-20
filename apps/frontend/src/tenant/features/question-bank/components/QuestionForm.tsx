import React, { useMemo, useState, useEffect } from 'react';
import { BookOpen, HelpCircle, Tag } from 'lucide-react';
import { FormModal } from '@/components/ui/FormModal';
import { CategorySelector } from "@/tenant/features/question-bank/components/CategorySelector";
import { QuestionSourcesTab } from "@/tenant/features/question-bank/components/QuestionSourcesTab";
import { QuestionTypeAnswerFields } from "@/tenant/features/question-bank/components/QuestionTypeAnswerFields";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/FormSelect';
import { Card } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { Textarea } from '@/components/ui/textarea';
import { notify } from '@/lib/notify';
import { FORM_INPUT, FORM_SELECT, FORM_LABEL } from '@/components/ui/formStyles';
import { Field } from "@/components/ui/FormPrimitives";
import {
  APP_LANGUAGES,
  formatLanguageSelectLabel,
  getLanguageDirection,
  normalizeAppLanguage,
  type AppLanguageCode,
  type QuestionType,
  type QuestionDifficulty,
  type QuestionSourceFieldId,
  type QuestionSourceBook,
  type QuestionBookCitation,
  type QuestionBankQuestion as Question,
  type AppTranslationKey,
  type ModuleFieldDef,
} from '@mms/shared';

interface QuestionFormProps {
  open: boolean;
  question: Question | null;
  questions?: Question[];
  onClose: () => void;
  onSave: (q: Question) => void;
}

const COMPOUND_ANSWER_TYPES = new Set<QuestionType>([
  'fill_blank',
  'matching',
  'numeric',
  'ordering',
]);

export function QuestionForm({
  open,
  question,
  onClose,
  onSave,
}: QuestionFormProps): React.JSX.Element {
  const { t, language } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [questionDraft, setQuestionDraft] = useState<{
    categoryIds: string[];
    type: QuestionType;
    difficulty: QuestionDifficulty;
    questionLanguage: AppLanguageCode;
    text: string;
    options: string[];
    answer: string;
    sourceCitations: QuestionBookCitation[];
  }>(() => {
    const defaultLang = normalizeAppLanguage(language);
    return {
      categoryIds: question?.categoryIds ?? [],
      type: question?.type ?? 'mcq',
      difficulty: (question?.difficulty as QuestionDifficulty) ?? 'easy',
      questionLanguage: (question?.questionLanguage as AppLanguageCode) ?? defaultLang,
      text: question?.text ?? '',
      options: question?.options ? [...question.options] : ['', '', '', ''],
      answer: question?.answer ?? '',
      sourceCitations: question?.sourceCitations ? [...question.sourceCitations] : [],
    };
  });

  // Re-sync draft when editing another question record
  useEffect(() => {
    if (!open) return;
    const defaultLang = normalizeAppLanguage(language);
    setQuestionDraft({
      categoryIds: question?.categoryIds ?? [],
      type: question?.type ?? 'mcq',
      difficulty: (question?.difficulty as QuestionDifficulty) ?? 'easy',
      questionLanguage: (question?.questionLanguage as AppLanguageCode) ?? defaultLang,
      text: question?.text ?? '',
      options: question?.options ? [...question.options] : ['', '', '', ''],
      answer: question?.answer ?? '',
      sourceCitations: question?.sourceCitations ? [...question.sourceCitations] : [],
    });
    setErrors({});
  }, [open, question, language]);

  const updateDraft = (patch: Partial<typeof questionDraft>) => {
    setQuestionDraft((prev) => ({ ...prev, ...patch }));
  };

  const sourceBooks = useMemo<QuestionSourceBook[]>(() => {
    return [
      { id: 'quran', name: 'Noble Quran', fieldIds: ['sourceSurah', 'sourceAyah'], metadata: {} },
      { id: 'hadith', name: 'Sahih Bukhari', fieldIds: ['sourceHadithNumber'], metadata: {} },
      { id: 'fiqh', name: 'Fiqh basics', fieldIds: ['sourceBookName', 'sourcePageNumber'], metadata: {} },
    ];
  }, []);

  const handleSave = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!questionDraft.text?.trim()) {
      newErrors.text = "Question text is required";
    }
    if (!questionDraft.categoryIds || questionDraft.categoryIds.length === 0) {
      newErrors.categoryIds = "At least one category is required";
    }

    if (questionDraft.type === 'mcq') {
      const options = questionDraft.options || [];
      if (!questionDraft.answer || !options.includes(questionDraft.answer)) {
        newErrors.answer = "An answer must be selected from the choices.";
      }
    } else if (questionDraft.type === 'true_false') {
      if (!questionDraft.answer) {
        newErrors.answer = "An answer (True or False) is required.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error("Please fix validation errors");
      return;
    }

    setSaving(true);
    try {
      onSave({
        ...questionDraft,
        id: question?.id || `q${Date.now()}`,
        sourceCitations: questionDraft.sourceCitations,
      } as unknown as Question);
      notify.success(question ? "Question updated successfully" : "Question created successfully");
      onClose();
    } catch (err: unknown) {
      notify.error("Failed to save question", { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  };

  const renderCategoriesTab = () => (
    <div className="space-y-5 text-left">
      <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-4">
          <Tag className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Classification & Tags</h3>
        </div>

        <Field label="Question Language">
          <FormSelect
            id="qb-question-language"
            className={FORM_SELECT}
            value={questionDraft.questionLanguage}
            onChange={(val) => updateDraft({ questionLanguage: val as AppLanguageCode })}
            options={APP_LANGUAGES.map((l) => ({ value: l.code, label: formatLanguageSelectLabel(l) }))}
          />
        </Field>

        <Field label="Difficulty">
          <FormSelect
            id="qb-difficulty"
            className={FORM_SELECT}
            value={questionDraft.difficulty}
            onChange={(val) => updateDraft({ difficulty: val as QuestionDifficulty })}
            options={[
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' },
            ]}
          />
        </Field>

        <CategorySelector
          multiple
          categories={[]}
          value={questionDraft.categoryIds}
          onChange={(ids) => {
            const list = Array.isArray(ids) ? ids : [ids].filter(Boolean);
            updateDraft({ categoryIds: list });
          }}
          required
          translate={(key) => t(key as AppTranslationKey) || String(key)}
        />
        {errors.categoryIds && (
          <p className="text-[10px] text-destructive font-medium">{errors.categoryIds}</p>
        )}
      </Card>
    </div>
  );

  const renderQuestionTab = () => {
    const trueLabel = 'True';
    const falseLabel = 'False';
    return (
      <div className="space-y-5 text-left">
        <Card accentColor="indigo" className="p-5.5 px-6.5 pb-6 space-y-4.5 shadow-sm">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-2">
            <BookOpen className="w-4 h-4 text-indigo-500/70 group-hover:text-indigo-500 transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Question Content</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Question Text" required error={errors.text}>
                <Textarea
                  id="qb-text"
                  name="text"
                  value={questionDraft.text || ''}
                  onChange={(e) => updateDraft({ text: e.target.value })}
                  placeholder="Type the question content..."
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label="Question Type">
                <FormSelect
                  id="qb-type"
                  className={FORM_SELECT}
                  value={questionDraft.type}
                  onChange={(val) => {
                    const nextType = val as QuestionType;
                    const options = nextType === 'mcq' ? ['', '', '', ''] : nextType === 'true_false' ? [trueLabel, falseLabel] : [];
                    updateDraft({ type: nextType, options, answer: '' });
                  }}
                  options={[
                    { value: 'mcq', label: '📝 Multiple Choice (MCQ)' },
                    { value: 'true_false', label: '⚖️ True / False' },
                    { value: 'short', label: '✍️ Short Answer' },
                    { value: 'fill_blank', label: '🕳️ Fill in the Blanks' },
                    { value: 'matching', label: '🧩 Matching Pairs' },
                    { value: 'ordering', label: '🔢 Ordering Items' },
                    { value: 'numeric', label: '🧮 Numeric Answer' },
                  ]}
                />
              </Field>
            </div>

            {questionDraft.type === 'mcq' && (
              <div className="sm:col-span-2">
                <span className={FORM_LABEL}>Choices * (Select the radio of the correct choice)</span>
                <div className="space-y-2 mt-1.5" role="radiogroup">
                  {questionDraft.options.slice(0, 4).map((optionValue, optionIndex) => (
                    <div key={optionIndex} className="relative flex items-center group/input w-full gap-2">
                      <input
                        id={`qb-choice-radio-${optionIndex}`}
                        type="radio"
                        name="answer"
                        value={optionValue}
                        checked={questionDraft.answer === optionValue && !!optionValue}
                        onChange={() => updateDraft({ answer: optionValue })}
                        aria-label={`Mark choice ${optionIndex + 1} as correct`}
                        className="h-4 w-4 flex-shrink-0 accent-primary"
                      />
                      <div className="relative flex items-center w-full">
                        <HelpCircle className="absolute left-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                        <Input
                          type="text"
                          className={`${FORM_INPUT} pl-10`}
                          value={optionValue}
                          onChange={(e) => {
                            const nextOptions = [...questionDraft.options];
                            nextOptions[optionIndex] = e.target.value;
                            updateDraft({ options: nextOptions });
                          }}
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {errors.answer && (
                  <p className="text-[10px] text-destructive mt-1 font-medium">{errors.answer}</p>
                )}
              </div>
            )}

            {questionDraft.type === 'true_false' && (
              <div className="sm:col-span-2">
                <span className={FORM_LABEL}>Correct Answer *</span>
                <div className="flex gap-3 mt-1.5">
                  {[trueLabel, falseLabel].map((answerValue) => (
                    <Button
                      key={answerValue}
                      type="button"
                      variant="outline"
                      onClick={() => updateDraft({ answer: answerValue })}
                      className={`flex-1 rounded-lg border py-2 text-sm font-medium ${questionDraft.answer === answerValue ? 'border-primary bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                    >
                      {answerValue}
                    </Button>
                  ))}
                </div>
                {errors.answer && (
                  <p className="text-[10px] text-destructive mt-1 font-medium">{errors.answer}</p>
                )}
              </div>
            )}

            {questionDraft.type === 'short' && (
              <div className="sm:col-span-2">
                <Field label="Model Answer">
                  <Textarea
                    id="qb-answer"
                    name="answer"
                    value={questionDraft.answer || ''}
                    onChange={(e) => updateDraft({ answer: e.target.value })}
                    placeholder="Enter the correct standard answer key..."
                  />
                </Field>
              </div>
            )}

            {COMPOUND_ANSWER_TYPES.has(questionDraft.type) && (
              <QuestionTypeAnswerFields
                questionType={questionDraft.type}
                text={String(questionDraft.text ?? '')}
                options={questionDraft.options}
                answer={String(questionDraft.answer ?? '')}
                onOptionsChange={(next) => updateDraft({ options: next })}
                onAnswerChange={(next) => updateDraft({ answer: next })}
                t={(key) => t(key as AppTranslationKey) || String(key)}
              />
            )}
          </div>
        </Card>
      </div>
    );
  };

  const renderSourcesTab = () => {
    const sourceFields = [
      { id: 'sourceSurah', label: 'Surah', type: 'text', required: false, enabled: true },
      { id: 'sourceAyah', label: 'Ayah', type: 'text', required: false, enabled: true },
      { id: 'sourceHadithNumber', label: 'Hadith Number', type: 'text', required: false, enabled: true },
      { id: 'sourceBookName', label: 'Reference Book', type: 'text', required: false, enabled: true },
      { id: 'sourcePageNumber', label: 'Page Number', type: 'text', required: false, enabled: true },
    ];
    const availableFieldIds = ['sourceSurah', 'sourceAyah', 'sourceHadithNumber', 'sourceBookName', 'sourcePageNumber'] as QuestionSourceFieldId[];

    return (
      <div className="space-y-5 text-left">
        <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-4">
            <BookOpen className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Source Citations</h3>
          </div>
          <QuestionSourcesTab
            sourceBooks={sourceBooks}
            citations={questionDraft.sourceCitations}
            availableFieldIds={availableFieldIds}
            orderedSourceFields={sourceFields as ModuleFieldDef[]}
            onCitationsChange={(next) => updateDraft({ sourceCitations: next })}
            onBooksUpdated={() => {}}
            fieldLabel={(id, fallback) => fallback || String(id)}
            translate={(key) => t(key as AppTranslationKey) || String(key)}
          />
        </Card>
      </div>
    );
  };

  const footerStart = questionDraft.text ? (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <span className="font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60 truncate max-w-[200px]">
        {questionDraft.text}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20 text-[10px] capitalize">
          {questionDraft.type.replace('_', ' ')}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-info/10 text-info font-semibold border border-info/20 text-[10px] capitalize">
          {questionDraft.difficulty}
        </span>
      </div>
    </div>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-[11px] font-bold border border-destructive/20">
      Question Text is required
    </span>
  );

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={question ? "Edit Question" : "Add Question"}
      subtitle="Define question tags, choices, and answers"
      icon={BookOpen}
      lang={language}
      dir={getLanguageDirection(language)}
      cancelLabel="Cancel"
      saveLabel="Save Question"
      onSave={handleSave}
      saving={saving}
      saveDisabled={!questionDraft.text?.trim() || questionDraft.categoryIds.length === 0}
      footerStart={footerStart}
    >
      <div className="space-y-5 pb-6">
        <div className="relative z-30">{renderCategoriesTab()}</div>
        <div className="relative z-20">{renderQuestionTab()}</div>
        <div className="relative z-10">{renderSourcesTab()}</div>
      </div>
    </FormModal>
  );
}
