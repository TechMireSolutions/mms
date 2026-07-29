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
  onSave: (q: Question) => void | Promise<void>;
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
      { id: 'quran', name: t('questionBank.sourceBook.nobleQuran'), fieldIds: ['sourceSurah', 'sourceAyah'], metadata: {} },
      { id: 'hadith', name: t('questionBank.sourceBook.sahihBukhari'), fieldIds: ['sourceHadithNumber'], metadata: {} },
      { id: 'fiqh', name: t('questionBank.sourceBook.fiqhBasics'), fieldIds: ['sourceBookName', 'sourcePageNumber'], metadata: {} },
    ];
  }, [t]);

  const handleSave = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!questionDraft.text?.trim()) {
      newErrors.text = t('questionBank.validation.textRequired');
    }
    if (!questionDraft.categoryIds || questionDraft.categoryIds.length === 0) {
      newErrors.categoryIds = t('questionBank.validation.categoryRequired');
    }

    if (questionDraft.type === 'mcq') {
      const options = questionDraft.options || [];
      if (!questionDraft.answer || !options.includes(questionDraft.answer)) {
        newErrors.answer = t('questionBank.validation.answerFromChoices');
      }
    } else if (questionDraft.type === 'true_false') {
      if (!questionDraft.answer) {
        newErrors.answer = t('questionBank.validation.trueFalseRequired');
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error(t('questionBank.validationFailed'));
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...questionDraft,
        id: question?.id || `q${Date.now()}`,
        sourceCitations: questionDraft.sourceCitations,
      } as unknown as Question);
      notify.success(question ? t('questionBank.updated') : t('questionBank.saved'));
      onClose();
    } catch (err: unknown) {
      notify.error(t('questionBank.saveFailed'), { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  };

  const renderCategoriesTab = () => (
    <div className="space-y-5 text-start">
      <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-4">
          <Tag className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t('questionBank.form.classification')}</h3>
        </div>

        <Field label={t('questionBank.form.questionLanguage')}>
          <FormSelect
            id="qb-question-language"
            className={FORM_SELECT}
            value={questionDraft.questionLanguage}
            onChange={(val) => updateDraft({ questionLanguage: val as AppLanguageCode })}
            options={APP_LANGUAGES.map((l) => ({ value: l.code, label: formatLanguageSelectLabel(l) }))}
          />
        </Field>

        <Field label={t('questionBank.form.difficulty')}>
          <FormSelect
            id="qb-difficulty"
            className={FORM_SELECT}
            value={questionDraft.difficulty}
            onChange={(val) => updateDraft({ difficulty: val as QuestionDifficulty })}
            options={[
              { value: 'easy', label: t('questionBank.difficulty.easy') },
              { value: 'medium', label: t('questionBank.difficulty.medium') },
              { value: 'hard', label: t('questionBank.difficulty.hard') },
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
          translate={(key) => t(key as AppTranslationKey)}
        />
        {errors.categoryIds && (
          <p className="text-xs text-destructive font-medium">{errors.categoryIds}</p>
        )}
      </Card>
    </div>
  );

  const renderQuestionTab = () => {
    const trueLabel = t('questionBank.true');
    const falseLabel = t('questionBank.false');
    return (
      <div className="space-y-5 text-start">
        <Card accentColor="info" className="p-5.5 px-6.5 pb-6 space-y-4.5 shadow-sm">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-2">
            <BookOpen className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t('questionBank.form.content')}</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label={t('questionBank.questionText')} required error={errors.text}>
                <Textarea
                  id="qb-text"
                  name="text"
                  value={questionDraft.text || ''}
                  onChange={(e) => updateDraft({ text: e.target.value })}
                  placeholder={t('questionBank.questionTextPlaceholder')}
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Field label={t('questionBank.type')}>
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
                    { value: 'mcq', label: t('questionBank.type.mcq') },
                    { value: 'true_false', label: t('questionBank.type.true_false') },
                    { value: 'short', label: t('questionBank.type.short') },
                    { value: 'fill_blank', label: t('questionBank.type.fill_blank') },
                    { value: 'matching', label: t('questionBank.type.matching') },
                    { value: 'ordering', label: t('questionBank.type.ordering') },
                    { value: 'numeric', label: t('questionBank.type.numeric') },
                  ]}
                />
              </Field>
            </div>

            {questionDraft.type === 'mcq' && (
              <div className="sm:col-span-2">
                <span className={FORM_LABEL}>{t('questionBank.optionsLabel')}</span>
                <div className="space-y-2 mt-1.5" role="radiogroup">
                  {questionDraft.options.slice(0, 4).map((optionValue, optionIndex) => (
                    <div key={optionIndex} className="relative flex items-center group/input w-full gap-2">
                      <label
                        htmlFor={`qb-choice-radio-${optionIndex}`}
                        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center"
                      >
                        <input
                          id={`qb-choice-radio-${optionIndex}`}
                          type="radio"
                          name="answer"
                          value={optionValue}
                          checked={questionDraft.answer === optionValue && !!optionValue}
                          onChange={() => updateDraft({ answer: optionValue })}
                          aria-label={t('questionBank.markChoiceCorrect', { n: optionIndex + 1 })}
                          className="h-4 w-4 shrink-0 accent-primary"
                        />
                      </label>
                      <div className="relative flex items-center w-full">
                        <HelpCircle className="absolute start-3.5 w-4 h-4 text-muted-foreground/60 group-focus-within/input:text-primary transition-colors pointer-events-none" />
                        <Input
                          type="text"
                          className={`${FORM_INPUT} ps-10`}
                          value={optionValue}
                          onChange={(e) => {
                            const nextOptions = [...questionDraft.options];
                            nextOptions[optionIndex] = e.target.value;
                            updateDraft({ options: nextOptions });
                          }}
                          placeholder={t('questionBank.optionN', { n: optionIndex + 1 })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {errors.answer && (
                  <p className="text-xs text-destructive mt-1 font-medium">{errors.answer}</p>
                )}
              </div>
            )}

            {questionDraft.type === 'true_false' && (
              <div className="sm:col-span-2">
                <span className={FORM_LABEL}>{t('questionBank.correctAnswer')} *</span>
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
                  <p className="text-xs text-destructive mt-1 font-medium">{errors.answer}</p>
                )}
              </div>
            )}

            {questionDraft.type === 'short' && (
              <div className="sm:col-span-2">
                <Field label={t('questionBank.modelAnswer')}>
                  <Textarea
                    id="qb-answer"
                    name="answer"
                    value={questionDraft.answer || ''}
                    onChange={(e) => updateDraft({ answer: e.target.value })}
                    placeholder={t('questionBank.modelAnswerPlaceholder')}
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
                t={(key) => t(key as AppTranslationKey)}
              />
            )}
          </div>
        </Card>
      </div>
    );
  };

  const renderSourcesTab = () => {
    const sourceFields = [
      { id: 'sourceSurah', label: t('questionBank.source.surah'), type: 'text', required: false, enabled: true },
      { id: 'sourceAyah', label: t('questionBank.source.ayah'), type: 'text', required: false, enabled: true },
      { id: 'sourceHadithNumber', label: t('questionBank.source.hadithNumber'), type: 'text', required: false, enabled: true },
      { id: 'sourceBookName', label: t('questionBank.source.bookName'), type: 'text', required: false, enabled: true },
      { id: 'sourcePageNumber', label: t('questionBank.source.pageNumber'), type: 'text', required: false, enabled: true },
    ];
    const availableFieldIds = ['sourceSurah', 'sourceAyah', 'sourceHadithNumber', 'sourceBookName', 'sourcePageNumber'] as QuestionSourceFieldId[];

    return (
      <div className="space-y-5 text-start">
        <Card accentColor="primary" className="p-5.5 px-6.5 pb-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5 pb-1.5 border-b border-border/40 mb-4">
            <BookOpen className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{t('questionBank.formTab.sources')}</h3>
          </div>
          <QuestionSourcesTab
            sourceBooks={sourceBooks}
            citations={questionDraft.sourceCitations}
            availableFieldIds={availableFieldIds}
            orderedSourceFields={sourceFields as ModuleFieldDef[]}
            onCitationsChange={(next) => updateDraft({ sourceCitations: next })}
            onBooksUpdated={() => {}}
            fieldLabel={(id, fallback) => fallback ?? String(id)}
            translate={(key) => t(key as AppTranslationKey)}
          />
        </Card>
      </div>
    );
  };

  const footerStart = questionDraft.text ? (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <span className="font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60 truncate max-w-[12.5rem]">
        {questionDraft.text}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20 text-xs capitalize">
          {t(`questionBank.type.${questionDraft.type}` as AppTranslationKey)}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-info/10 text-info font-semibold border border-info/20 text-xs capitalize">
          {t(`questionBank.difficulty.${questionDraft.difficulty}` as AppTranslationKey)}
        </span>
      </div>
    </div>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20">
      {t('questionBank.validation.textRequired')}
    </span>
  );

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={question ? t('questionBank.editQuestion') : t('questionBank.addQuestion')}
      subtitle={t('questionBank.form.subtitle')}
      icon={BookOpen}
      lang={language}
      dir={getLanguageDirection(language)}
      cancelLabel={t('questionBank.cancel')}
      saveLabel={t('questionBank.saveQuestion')}
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
