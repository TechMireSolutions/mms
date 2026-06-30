import React, { useMemo, useState, useTransition, useCallback } from 'react';
import { z } from 'zod';
import { BookOpen } from 'lucide-react';
import { MmsDynamicForm } from '@/components/ui/MmsDynamicForm';
import { useMmsForm } from '@/hooks/useMmsForm';
import { useQuestionFormTranslation } from '@/hooks/useQuestionFormTranslation';
import { useQuestionBankConfig } from '@/hooks/useQuestionBankConfig';
import { QuestionBankSettings } from './QuestionBankSettings';
import { syncTrueFalseLabelsForFormLanguage } from '@/lib/data/questionFormTrueFalse';
import { QUESTION_TYPE_ICONS } from '@/lib/data/questionBankData';
import { CategorySelector } from "./CategorySelector";
import { QuestionSourcesTab } from "./QuestionSourcesTab";
import { QuestionTypeAnswerFields } from "./QuestionTypeAnswerFields";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormSelect } from '@/components/ui/FormSelect';
import { useTranslation } from '@/hooks/useTranslation';
import { useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/hooks/usePermissions';
import { FORM_INPUT, FORM_SELECT, FORM_TEXTAREA, FORM_LABEL } from '@/components/ui/formStyles';
import { Field, CustomFieldInput } from "@/components/ui/FormPrimitives";
import {
  APP_LANGUAGES,
  QUESTION_SOURCE_FIELD_IDS,
  QUESTION_SOURCE_FIELD_TO_KEY,
  countFillBlankMarkers,
  getLanguageDirection,
  getBookCitationFieldIds,
  getQuestionBookCitations,
  isQuestionSourceFieldId,
  type QuestionSourceFieldId,
  normalizeAppLanguage,
  normalizeQuestionBankQuestion,
  resolveQuestionFormLanguage,
  splitQuestionCompoundAnswer,
  translateQuestionFieldRequired,
  type AppLanguageCode,
  type QuestionType,
  type QuestionBankQuestion as Question,
  getDefaultModuleFieldValue,
  type FieldDefinition,
  buildCustomFieldSchema,
  QUESTION_BANK_MODULE_CONTRACT,
} from '@mms/shared';

interface QuestionFormProps {
  open: boolean;
  question: Question | null;
  questions?: Question[];
  onClose: () => void;
  onSave: (q: Question) => void;
}

interface QuestionFormData {
  categoryIds: string[];
  type: QuestionType;
  difficulty: string;
  questionLanguage: string;
  text: string;
  options: string[];
  answer: string;
  sourceCitations: any[];
  [key: string]: unknown;
}

const EMPTY_Q: Omit<Question, 'id'> & Record<string, unknown> = {
  categoryIds: [],
  type: 'mcq',
  difficulty: 'easy',
  questionLanguage: 'en',
  text: '',
  options: ['', '', '', ''],
  answer: '',
  sourceCitations: [],
};

const SYSTEM_FIELD_IDS = new Set([
  'text',
  'categoryId',
  'questionLanguage',
  'type',
  'difficulty',
  'options',
  'answer',
  ...QUESTION_SOURCE_FIELD_IDS,
]);

const COMPOUND_ANSWER_TYPES = new Set<QuestionType>([
  'fill_blank',
  'matching',
  'numeric',
  'ordering',
]);

function fieldRendersOnForm(field: FieldDefinition, questionType: Question['type']): boolean {
  if (
    field.key === 'categoryId' ||
    field.key === 'difficulty' ||
    field.key === 'questionLanguage' ||
    isQuestionSourceFieldId(field.key)
  ) {
    return false;
  }
  if (field.key === 'options') return questionType === 'mcq';
  if (
    field.key === 'answer' &&
    ['mcq', 'fill_blank', 'matching', 'numeric', 'ordering'].includes(questionType)
  ) {
    return false;
  }
  return true;
}

function defaultPayloadForQuestionType(
  type: QuestionType,
  trueLabel: string,
  falseLabel: string,
): Pick<Question, 'options' | 'answer'> {
  switch (type) {
    case 'mcq':
      return { options: ['', '', '', ''], answer: '' };
    case 'true_false':
      return { options: [trueLabel, falseLabel], answer: '' };
    case 'short':
      return { options: [], answer: '' };
    case 'fill_blank':
      return { options: [], answer: '' };
    case 'matching':
      return { options: ['', ''], answer: '' };
    case 'ordering':
      return { options: ['', ''], answer: '' };
    case 'numeric':
      return { options: [], answer: '' };
    default:
      return { options: [], answer: '' };
  }
}

export function QuestionForm({
  open,
  question,
  questions = [],
  onClose,
  onSave,
}: QuestionFormProps): React.JSX.Element {
  const { t, language } = useTranslation();
  const { can } = usePermissions();
  const canEditSetup = can(QUESTION_BANK_MODULE_CONTRACT.permissions.setupWrite);
  const queryClient = useQueryClient();
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [, startTransition] = useTransition();

  const config = useQuestionBankConfig(questions);
  const defaultQuestionLanguage = normalizeAppLanguage(language);
  const questionLanguageFieldEnabled = config.isFieldEnabled('questionLanguage');

  // Fields By Tab definition
  const fieldsByTab = useMemo<Record<string, FieldDefinition[]>>(() => {
    const mapped: Record<string, FieldDefinition[]> = {
      categories: [],
      question: [],
      sources: [],
    };

    config.orderedFields.forEach((field, index) => {
      const fDef: FieldDefinition = {
        key: field.id,
        label: config.fieldLabel(field.id, field.label),
        type: (field.type || "text") as any,
        required: !!field.required,
        enabled: config.isFieldEnabled(field.id),
        order: index,
        placeholder: field.placeholder,
        options: field.options,
      };

      if (field.id === 'categoryId' || field.id === 'difficulty' || field.id === 'questionLanguage') {
        mapped.categories.push(fDef);
      } else if (isQuestionSourceFieldId(field.id)) {
        mapped.sources.push(fDef);
      } else {
        mapped.question.push(fDef);
      }
    });

    return mapped;
  }, [config.orderedFields, config.isFieldEnabled, config.fieldLabel]);

  // Initial Form Data Conformance
  const initialValues = useMemo<QuestionFormData>(() => {
    const initial: any = {
      ...EMPTY_Q,
      questionLanguage: defaultQuestionLanguage,
    };

    config.orderedFields.forEach((f) => {
      if (!SYSTEM_FIELD_IDS.has(f.id)) {
        initial[f.id] = getDefaultModuleFieldValue(f) ?? "";
      }
    });

    const draft = queryClient.getQueryData<QuestionFormData>(['builder_draft', 'question', question?.id || 'new']);
    const target = (draft || (question ? normalizeQuestionBankQuestion(question) : {})) as any;

    const nextData = {
      ...initial,
      ...target,
      options: target.options?.length ? [...target.options] : ['', '', '', ''],
      sourceCitations: target.sourceCitations ? [...target.sourceCitations] : getQuestionBookCitations(target as any),
    };

    if (question) {
      const formLang = resolveQuestionFormLanguage(
        language,
        target.questionLanguage,
        questionLanguageFieldEnabled,
      ) as AppLanguageCode;
      return syncTrueFalseLabelsForFormLanguage(nextData, target.questionLanguage, formLang) as QuestionFormData;
    } else {
      const defaultType = config.enabledQuestionTypes[0] ?? 'mcq';
      const defaultDifficulty = config.enabledDifficulties[0] ?? 'easy';
      const defaultCategory = config.categories[0]?.id;

      return {
        ...nextData,
        type: defaultType,
        difficulty: defaultDifficulty,
        categoryIds: defaultCategory ? [defaultCategory] : [],
      } as QuestionFormData;
    }
  }, [question, queryClient, defaultQuestionLanguage, config.orderedFields, config.enabledQuestionTypes, config.enabledDifficulties, config.categories, language, questionLanguageFieldEnabled]);

  const categoriesRequired = useMemo(
    () => config.orderedFields.find((f) => f.id === 'categoryId')?.required ?? false,
    [config.orderedFields]
  );

  const {
    formLanguage,
    tForm,
    fieldLabel: translateFieldLabel,
    typeLabel,
    difficultyLabel,
    questionLanguageLabel,
  } = useQuestionFormTranslation(
    language,
    initialValues.questionLanguage,
    questionLanguageFieldEnabled,
  );

  // Zod schema with superRefine
  const schema = useMemo(() => {
    const validationLanguage = resolveQuestionFormLanguage(
      language,
      initialValues.questionLanguage,
      questionLanguageFieldEnabled,
    );

    const requiredMsg = (fieldId: string, fallback?: string): string =>
      translateQuestionFieldRequired(fieldId, validationLanguage, fallback);

    const shape: Record<string, z.ZodTypeAny> = {
      id: z.string().optional(),
      categoryIds: z.array(z.string()).min(categoriesRequired ? 1 : 0, requiredMsg('categoryId')),
      type: z.string().min(1),
      difficulty: z.string().min(1),
      questionLanguage: z.string().min(1),
      text: z.string().min(1, requiredMsg('text')),
      options: z.array(z.string()).default([]),
      answer: z.string().optional(),
      sourceCitations: z.array(z.any()).default([]),
    };

    const questionFields = fieldsByTab.question || [];
    questionFields.forEach((field) => {
      if (!SYSTEM_FIELD_IDS.has(field.key)) {
        shape[field.key] = buildCustomFieldSchema(field);
      }
    });

    return z.object(shape).passthrough().superRefine((data: any, ctx) => {
      const qType = data.type;
      
      // MCQ answer validation
      if (qType === 'mcq') {
        const opts = (data.options || []) as string[];
        const ans = data.answer;
        if (!ans || !opts.includes(ans)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['answer'],
            message: requiredMsg('answer', tForm('questionBank.answer' as any)),
          });
        }
      }

      // True/False answer validation
      if (qType === 'true_false') {
        if (!data.answer) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['answer'],
            message: requiredMsg('answer', tForm('questionBank.answer' as any)),
          });
        }
      }

      // Fill in blank validation
      if (qType === 'fill_blank') {
        const blankCount = countFillBlankMarkers(String(data.text ?? ''));
        const blanks = splitQuestionCompoundAnswer(String(data.answer ?? ''));
        if (blankCount < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['text'],
            message: tForm('questionBank.errorFillBlankMarkerMissing' as any),
          });
        } else if (blanks.length < blankCount || blanks.some((b) => !b.trim())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['answer'],
            message: tForm('questionBank.errorFillBlankAnswerRequired' as any),
          });
        }
      }

      // Matching validation
      if (qType === 'matching') {
        const lefts = ((data.options || []) as string[]).map((v) => String(v).trim()).filter(Boolean);
        const rights = splitQuestionCompoundAnswer(String(data.answer ?? '')).filter(Boolean);
        if (lefts.length < 2 || rights.length < 2 || lefts.length !== rights.length) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['answer'],
            message: tForm('questionBank.errorMatchingPairRequired' as any),
          });
        }
      }

      // Ordering validation
      if (qType === 'ordering') {
        const items = ((data.options || []) as string[]).map((v) => String(v).trim()).filter(Boolean);
        if (items.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['options'],
            message: tForm('questionBank.errorOrderingItemRequired' as any),
          });
        }
      }

      // Numeric validation
      if (qType === 'numeric') {
        if (data.answer === undefined || data.answer === '' || Number.isNaN(Number(data.answer))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['answer'],
            message: tForm('questionBank.errorNumericAnswerRequired' as any),
          });
        }
      }

      // Citation fields validation
      const citations = (data.sourceCitations || []) as any[];
      const sourceFields = config.orderedFields.filter((field) => isQuestionSourceFieldId(field.id));
      for (const entry of citations) {
        const book = config.sourceBooks.find((b) => b.id === entry.bookId);
        if (!book) continue;
        for (const fieldId of getBookCitationFieldIds(book)) {
          const field = sourceFields.find((sourceField) => sourceField.id === fieldId);
          if (!field?.required) continue;
          const sourceKey = QUESTION_SOURCE_FIELD_TO_KEY[fieldId as QuestionSourceFieldId];
          const citationValue = entry.citation[sourceKey];
          if (citationValue === undefined || citationValue === '') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['sourceCitations'],
              message: requiredMsg(field.id, field.label),
            });
          }
        }
      }
    });
  }, [config.orderedFields, categoriesRequired, tForm, language, initialValues.questionLanguage, questionLanguageFieldEnabled, config.sourceBooks, fieldsByTab.question]);

  const {
    form,
    tab,
    setTab,
    saving,
    errors,
    handleSave,
  } = useMmsForm<QuestionFormData>({
    schema,
    fields: fieldsByTab,
    initialData: initialValues,
    t,
  });

  const data = form.watch();
  const setValue = form.setValue;

  const handleQuestionLanguageChange = useCallback(
    (next: string): void => {
      const prevFormLang = resolveQuestionFormLanguage(
        language,
        data.questionLanguage as string | undefined,
        questionLanguageFieldEnabled,
      ) as AppLanguageCode;
      const nextFormLang = resolveQuestionFormLanguage(
        language,
        next,
        questionLanguageFieldEnabled,
      ) as AppLanguageCode;

      setValue('questionLanguage', normalizeAppLanguage(next));
      
      if (prevFormLang !== nextFormLang) {
        const synced = syncTrueFalseLabelsForFormLanguage(data as any, prevFormLang, nextFormLang);
        setValue('options', synced.options || []);
        setValue('answer', synced.answer || '');
      }
    },
    [language, questionLanguageFieldEnabled, data, setValue]
  );

  const handleToggleBuilderMode = useCallback((active: boolean) => {
    if (active) {
      queryClient.setQueryData(['builder_draft', 'question', question?.id || 'new'], form.getValues());
    }
    startTransition(() => {
      setIsBuilderMode(active);
    });
  }, [queryClient, question?.id, form]);

  const completeness = useMemo(() => {
    let totalRequired = 0;
    let filledRequired = 0;
    let totalOptional = 0;
    let filledOptional = 0;

    // Categories tab
    if (config.isFieldEnabled('categoryId')) {
      totalRequired++;
      if (data.categoryIds && data.categoryIds.length > 0) filledRequired++;
    }
    if (config.isFieldEnabled('difficulty')) {
      totalRequired++;
      if (data.difficulty) filledRequired++;
    }
    if (config.isFieldEnabled('questionLanguage')) {
      totalRequired++;
      if (data.questionLanguage) filledRequired++;
    }

    // Question content tab
    if (config.isFieldEnabled('text')) {
      totalRequired++;
      if (data.text) filledRequired++;
    }
    
    // Core question type answers
    if (data.type === 'mcq' || data.type === 'true_false' || data.type === 'numeric' || data.type === 'fill_blank') {
      totalRequired++;
      if (data.answer) filledRequired++;
    }

    // Other registry fields
    Object.keys(fieldsByTab).forEach((tabId) => {
      const tabFields = fieldsByTab[tabId] || [];
      tabFields.forEach((field) => {
        // Skip already calculated core fields
        if (field.key === 'categoryId' || field.key === 'difficulty' || field.key === 'questionLanguage' || field.key === 'text' || field.key === 'options' || field.key === 'answer') {
          return;
        }

        if (!field.enabled) return;
        
        // Skip booleans and ai_summary fields from completeness score
        if (field.type === "boolean" || field.type === "ai_summary") {
          return;
        }

        const isRequired = !!field.required;
        const fieldValue = data[field.key];
        const isFilled = fieldValue !== undefined && fieldValue !== null && fieldValue !== "";

        if (isRequired) {
          totalRequired++;
          if (isFilled) filledRequired++;
        } else {
          totalOptional++;
          if (isFilled) filledOptional++;
        }
      });
    });

    const reqRatio = totalRequired === 0 ? 0 : filledRequired / totalRequired;
    const optRatio = totalOptional === 0 ? 0 : filledOptional / totalOptional;
    const progress = (reqRatio * 0.7) + (optRatio * 0.3);

    return Math.round(progress * 100);
  }, [data, fieldsByTab, config]);

  const formTabs = useMemo(() => {
    return [
      {
        key: 'categories',
        label: tForm('questionBank.formTab.categories'),
      },
      {
        key: 'question',
        label: tForm('questionBank.formTab.question'),
      },
      {
        key: 'sources',
        label: tForm('questionBank.formTab.sources'),
      },
    ];
  }, [tForm]);

  const onSubmit = useCallback((formData: QuestionFormData) => {
    onSave(
      normalizeQuestionBankQuestion({
        ...formData,
        id: question?.id || `q${Date.now()}`,
        categoryIds: formData.categoryIds,
        sourceCitations: formData.sourceCitations,
      } as unknown as Question),
    );
    onClose();
  }, [question, onSave, onClose]);

  const onInvalid = useCallback((formErrors: any) => {
    if (formErrors.categoryIds || formErrors.difficulty || formErrors.questionLanguage) {
      setTab('categories');
    } else if (formErrors.sourceCitations) {
      setTab('sources');
    } else {
      setTab('question');
    }
  }, [setTab]);

  const renderFieldByKey = (field: FieldDefinition): React.ReactNode => {
    if (!field.enabled) return null;

    const value = data[field.key] ?? getDefaultModuleFieldValue(field as any);
    const fieldError = errors.find((e) => e.fieldId === field.key);
    return (
      <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
        <Field label={field.label} required={field.required} hint={field.description} error={fieldError?.message}>
          <CustomFieldInput
            field={field}
            value={value}
            onChange={(next) => setValue(field.key as any, next, { shouldValidate: true, shouldDirty: true })}
            error={!!fieldError}
          />
        </Field>
      </div>
    );
  };

  const renderSystemField = (field: FieldDefinition): React.ReactNode => {
    const requiredMark = field.required ? ' *' : '';
    const label = translateFieldLabel(field.key, field.label);
    const fieldError = errors.find((e) => e.fieldId === field.key);

    if (field.key === 'text') {
      return (
        <div key="text" className="sm:col-span-2">
          <Field label={label} required={field.required} error={fieldError?.message}>
            <textarea
              id="qb-text"
              className={FORM_TEXTAREA}
              rows={3}
              value={(data.text as string) || ''}
              onChange={(e) => setValue('text', e.target.value, { shouldValidate: true, shouldDirty: true })}
              placeholder={tForm('questionBank.questionTextPlaceholder')}
            />
          </Field>
        </div>
      );
    }

    if (field.key === 'type') {
      return (
        <div key="type">
          <Field label={label} required={field.required} error={fieldError?.message}>
            <FormSelect
              id="qb-type"
              className={FORM_SELECT}
              value={data.type}
              onChange={(val: any) => {
                const nextType = val as QuestionType;
                const trueLabel = tForm('questionBank.true');
                const falseLabel = tForm('questionBank.false');
                const payload = defaultPayloadForQuestionType(nextType, trueLabel, falseLabel);
                
                setValue('type', nextType, { shouldValidate: true, shouldDirty: true });
                setValue('options', payload.options);
                setValue('answer', payload.answer);

                if (nextType === 'fill_blank' && !String(data.text ?? '').includes('___')) {
                  setValue('text', tForm('questionBank.fillBlankTemplate'));
                }
              }}
              options={config.enabledQuestionTypes.map((k) => ({
                value: k,
                label: `${QUESTION_TYPE_ICONS[k]} ${typeLabel(k)}`,
              }))}
            />
          </Field>
        </div>
      );
    }

    if (field.key === 'difficulty') {
      return (
        <div key="difficulty">
          <Field label={label} required={field.required} error={fieldError?.message}>
            <FormSelect
              id="qb-difficulty"
              className={FORM_SELECT}
              value={(data.difficulty as string) || 'easy'}
              onChange={(val: any) => setValue('difficulty', val, { shouldValidate: true, shouldDirty: true })}
              options={config.enabledDifficulties.map((k) => ({
                value: k,
                label: difficultyLabel(k),
              }))}
            />
          </Field>
        </div>
      );
    }

    if (field.key === 'questionLanguage') {
      const currentLanguage = normalizeAppLanguage(data.questionLanguage as string | undefined);
      return (
        <div key="questionLanguage">
          <Field label={label} required={field.required} error={fieldError?.message}>
            <FormSelect
              id="qb-question-language"
              className={FORM_SELECT}
              value={currentLanguage}
              onChange={handleQuestionLanguageChange}
              options={APP_LANGUAGES.map((lang) => ({
                value: lang.code,
                label: questionLanguageLabel(lang.code),
              }))}
            />
          </Field>
        </div>
      );
    }

    if (field.key === 'options' && data.type === 'mcq') {
      const options = Array.isArray(data.options) ? data.options : ['', '', '', ''];
      const optError = errors.find((e) => e.fieldId === 'options');
      return (
        <div key="options" className="sm:col-span-2">
          <span className={FORM_LABEL}>{label}{requiredMark}</span>
          <div className="space-y-2 mt-1.5" role="radiogroup">
            {options.slice(0, 4).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="answer"
                  value={opt as string}
                  checked={data.answer === opt}
                  onChange={() => setValue('answer', opt, { shouldValidate: true, shouldDirty: true })}
                  className="h-4 w-4 flex-shrink-0 accent-primary"
                />
                <Input
                  type="text"
                  className={FORM_INPUT}
                  value={opt as string}
                  onChange={(e) => {
                    const nextOpts = [...options];
                    nextOpts[i] = e.target.value;
                    setValue('options', nextOpts, { shouldValidate: true, shouldDirty: true });
                  }}
                  placeholder={tForm('questionBank.optionN', { n: i + 1 })}
                />
              </div>
            ))}
          </div>
          {optError && <p className="text-[10px] text-destructive mt-1 font-medium">{optError.message}</p>}
        </div>
      );
    }

    if (field.key === 'answer' && data.type === 'true_false') {
      const trueLabel = tForm('questionBank.true');
      const falseLabel = tForm('questionBank.false');
      const ansError = errors.find((e) => e.fieldId === 'answer');
      return (
        <div key="answer" className="sm:col-span-2">
          <span className={FORM_LABEL}>{label}{requiredMark}</span>
          <div className="flex gap-3 mt-1.5">
            {[trueLabel, falseLabel].map((v) => (
              <Button
                key={v}
                type="button"
                variant="outline"
                onClick={() => {
                  setValue('answer', v, { shouldValidate: true, shouldDirty: true });
                  setValue('options', [trueLabel, falseLabel]);
                }}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium ${data.answer === v ? 'border-primary bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
              >
                {v}
              </Button>
            ))}
          </div>
          {ansError && <p className="text-[10px] text-destructive mt-1 font-medium">{ansError.message}</p>}
        </div>
      );
    }

    if (field.key === 'answer' && data.type === 'short') {
      return (
        <div key="answer-short" className="sm:col-span-2">
          <Field label={tForm('questionBank.modelAnswer')} required={field.required} error={fieldError?.message}>
            <textarea
              id="qb-answer"
              className={FORM_TEXTAREA}
              rows={2}
              value={(data.answer as string) || ''}
              onChange={(e) => setValue('answer', e.target.value, { shouldValidate: true, shouldDirty: true })}
              placeholder={tForm('questionBank.modelAnswerPlaceholder')}
            />
          </Field>
        </div>
      );
    }

    return null;
  };

  const renderField = (field: FieldDefinition): React.ReactNode => {
    const node = SYSTEM_FIELD_IDS.has(field.key)
      ? renderSystemField(field)
      : renderFieldByKey(field);
    return node ? <React.Fragment key={field.key}>{node}</React.Fragment> : null;
  };

  const renderBasicContent = () => {
    if (tab === 'categories') {
      const categoriesEnabled = config.isFieldEnabled('categoryId');
      const difficultyEnabled = config.isFieldEnabled('difficulty');
      const questionLanguageEnabled = config.isFieldEnabled('questionLanguage');
      const qLangField = fieldsByTab.categories.find((f) => f.key === 'questionLanguage');
      const diffField = fieldsByTab.categories.find((f) => f.key === 'difficulty');

      if (!categoriesEnabled && !difficultyEnabled && !questionLanguageEnabled) {
        return <p className="text-sm text-muted-foreground">{tForm('questionBank.categoriesDisabledHint' as any)}</p>;
      }
      return (
        <div className="space-y-5 text-left">
          <section className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
            {questionLanguageEnabled && qLangField ? renderField(qLangField) : null}
            {difficultyEnabled && diffField ? renderField(diffField) : null}
            {categoriesEnabled ? (
              <CategorySelector
                multiple
                categories={config.categories}
                value={data.categoryIds as string[]}
                onChange={(ids) => {
                  const arr = Array.isArray(ids) ? ids : [ids].filter(Boolean);
                  setValue('categoryIds', arr, { shouldValidate: true, shouldDirty: true });
                }}
                onCategoriesUpdated={() => config.refresh()}
                required={categoriesRequired}
                translate={tForm as any}
              />
            ) : null}
          </section>
        </div>
      );
    }

    if (tab === 'sources') {
      const sourceFields = config.orderedFields.filter((field) => isQuestionSourceFieldId(field.id));
      const availableSourceFieldIds = sourceFields
        .map((field) => field.id)
        .filter((id): id is QuestionSourceFieldId => isQuestionSourceFieldId(id));

      return (
        <div className="space-y-5 text-left">
          <QuestionSourcesTab
            sourceBooks={config.sourceBooks}
            citations={data.sourceCitations}
            availableFieldIds={availableSourceFieldIds}
            orderedSourceFields={sourceFields}
            onCitationsChange={(next) => setValue('sourceCitations', next, { shouldValidate: true, shouldDirty: true })}
            onBooksUpdated={() => config.refresh()}
            fieldLabel={config.fieldLabel}
            translate={tForm as any}
          />
        </div>
      );
    }

    if (tab === 'question') {
      const bodyFields = fieldsByTab.question || [];
      return (
        <div className="space-y-5 text-left">
          <section className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {bodyFields.map((field) => {
                if (fieldRendersOnForm(field, data.type)) {
                  return renderField(field);
                }
                return null;
              })}
              {COMPOUND_ANSWER_TYPES.has(data.type) && (
                <QuestionTypeAnswerFields
                  questionType={data.type}
                  text={String(data.text ?? '')}
                  options={Array.isArray(data.options) ? data.options : []}
                  answer={String(data.answer ?? '')}
                  onOptionsChange={(next) => setValue('options', next as any, { shouldValidate: true, shouldDirty: true })}
                  onAnswerChange={(next) => setValue('answer', next, { shouldValidate: true, shouldDirty: true })}
                  t={tForm as any}
                />
              )}
            </div>
          </section>
        </div>
      );
    }

    return null;
  };

  const footerStart = data.text ? (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground truncate max-w-[200px]">{data.text}</span>
      <div className="flex items-center gap-2 border-s border-border ps-3">
        <span className="capitalize">{data.type}</span>
        <span className="border-s border-border ps-2 capitalize">{data.difficulty}</span>
      </div>
    </div>
  ) : (
    <span className="text-xs text-destructive">Question Text is required</span>
  );

  return (
    <MmsDynamicForm
      open={open}
      onClose={onClose}
      title={question ? tForm('questionBank.editQuestion' as any) : tForm('questionBank.addQuestion' as any)}
      subtitle={tForm('questionBank.formTab.categoriesHint' as any)}
      icon={BookOpen}
      tall
      progress={completeness}
      progressLabel={tForm('common.formProgress' as any)}
      showBuilderToggle={canEditSetup}
      isBuilderMode={isBuilderMode}
      onBuilderModeChange={handleToggleBuilderMode}
      tabs={formTabs}
      activeTab={tab}
      onTabChange={setTab}
      tabPanelIdPrefix="question-form-tab"
      lang={formLanguage}
      dir={getLanguageDirection(formLanguage)}
      error={errors.map(e => e.message)}
      cancelLabel={tForm('questionBank.cancel' as any)}
      saveLabel={tForm('questionBank.saveQuestion' as any)}
      onSave={() => void form.handleSubmit(onSubmit, onInvalid)()}
      saving={saving}
      saveDisabled={!data.text?.trim() || (categoriesRequired && data.categoryIds.length === 0)}
      footerStart={footerStart}
      fields={fieldsByTab[tab] || []}
      data={data}
      setValue={(key, val, opts) => setValue(key as any, val, opts)}
      errors={errors}
      renderField={renderField}
      renderBasicContent={renderBasicContent}
      builderPanel={
        <QuestionBankSettings mode="fields" />
      }
    />
  );
}
