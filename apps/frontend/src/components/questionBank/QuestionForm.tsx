import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import FormModal, { type FormModalTab } from '@/components/ui/FormModal';
import { FORM_INPUT, FORM_LABEL } from '@/components/ui/formStyles';
import useTranslation from '@/hooks/useTranslation';
import { useQuestionFormTranslation } from '@/hooks/useQuestionFormTranslation';
import { useQuestionBankConfig } from '@/hooks/useQuestionBankConfig';
import { syncTrueFalseLabelsForFormLanguage } from '@/lib/data/questionFormTrueFalse';
import { QUESTION_TYPE_ICONS } from '@/lib/data/questionBankData';
import CategorySelector from './CategorySelector';
import QuestionSourcesTab from './QuestionSourcesTab';
import QuestionTypeAnswerFields from './QuestionTypeAnswerFields';
import {
  APP_LANGUAGES,
  QUESTION_SOURCE_FIELD_IDS,
  QUESTION_SOURCE_FIELD_TO_KEY,
  countFillBlankMarkers,
  getQuestionCategoryIds,
  getLanguageDirection,
  getBookCitationFieldIds,
  getQuestionBookCitations,
  isQuestionSourceFieldId,
  type QuestionBankFormTabId,
  type QuestionSourceFieldId,
  normalizeAppLanguage,
  normalizeQuestionBankQuestion,
  resolveQuestionFormLanguage,
  splitQuestionCompoundAnswer,
  translateQuestionFieldRequired,
  type AppLanguageCode,
  type QuestionType,
  type ModuleFieldDef,
  type QuestionBankQuestion as Question,
} from '@mms/shared';

const INPUT = FORM_INPUT;
const LABEL = FORM_LABEL;

const EMPTY_Q: Omit<Question, 'id'> & Record<string, unknown> = {
  categoryIds: [],
  type: 'mcq',
  difficulty: 'easy',
  questionLanguage: 'en' as Question['questionLanguage'],
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

function fieldRendersOnForm(field: ModuleFieldDef, questionType: Question['type']): boolean {
  if (
    field.id === 'categoryId' ||
    field.id === 'difficulty' ||
    field.id === 'questionLanguage' ||
    isQuestionSourceFieldId(field.id)
  ) {
    return false;
  }
  if (field.id === 'options') return questionType === 'mcq';
  if (
    field.id === 'answer' &&
    ['mcq', 'fill_blank', 'matching', 'numeric', 'ordering'].includes(questionType)
  ) {
    return false;
  }
  return true;
}

const COMPOUND_ANSWER_TYPES = new Set<QuestionType>([
  'fill_blank',
  'matching',
  'numeric',
  'ordering',
]);

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

interface QuestionFormProps {
  open: boolean;
  question: Question | null;
  questions?: Question[];
  onClose: () => void;
  onSave: (q: Question) => void;
}

export default function QuestionForm({
  open,
  question,
  questions = [],
  onClose,
  onSave,
}: QuestionFormProps): React.JSX.Element {
  const { language } = useTranslation();
  const config = useQuestionBankConfig(questions);
  const defaultQuestionLanguage = normalizeAppLanguage(language);
  const questionLanguageFieldEnabled = config.isFieldEnabled('questionLanguage');
  const [data, setData] = useState<Partial<Question> & Record<string, unknown>>(() => ({
    ...EMPTY_Q,
    questionLanguage: defaultQuestionLanguage,
    ...(question ? normalizeQuestionBankQuestion(question) : {}),
  }));
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<QuestionBankFormTabId>('categories');

  const {
    formLanguage,
    tForm,
    fieldLabel,
    typeLabel,
    difficultyLabel,
    questionLanguageLabel,
  } = useQuestionFormTranslation(
    language,
    data.questionLanguage as string | undefined,
    questionLanguageFieldEnabled,
  );

  const handleQuestionLanguageChange = useCallback(
    (next: string): void => {
      setData((d) => {
        const prevFormLang = resolveQuestionFormLanguage(
          language,
          d.questionLanguage as string | undefined,
          questionLanguageFieldEnabled,
        ) as AppLanguageCode;
        const nextFormLang = resolveQuestionFormLanguage(
          language,
          next,
          questionLanguageFieldEnabled,
        ) as AppLanguageCode;
        let nextData: Partial<Question> & Record<string, unknown> = {
          ...d,
          questionLanguage: normalizeAppLanguage(next),
        };
        if (prevFormLang !== nextFormLang) {
          nextData = syncTrueFalseLabelsForFormLanguage(nextData, prevFormLang, nextFormLang);
          setError('');
        }
        return nextData;
      });
    },
    [language, questionLanguageFieldEnabled],
  );

  const formTabs = useMemo(
    (): FormModalTab<QuestionBankFormTabId>[] => [
      {
        key: 'categories',
        label: tForm('questionBank.formTab.categories'),
        description: tForm('questionBank.formTab.categoriesHint'),
      },
      {
        key: 'question',
        label: tForm('questionBank.formTab.question'),
        description: tForm('questionBank.formTab.questionHint'),
      },
      {
        key: 'sources',
        label: tForm('questionBank.formTab.sources'),
        description: tForm('questionBank.formTab.sourceHint'),
      },
    ],
    [tForm],
  );

  useEffect(() => {
    if (!open) return;
    setActiveTab('categories');
    if (question) {
      const normalized = normalizeQuestionBankQuestion(question);
      const storedLang = normalizeAppLanguage(normalized.questionLanguage);
      const formLang = resolveQuestionFormLanguage(
        language,
        normalized.questionLanguage,
        questionLanguageFieldEnabled,
      ) as AppLanguageCode;
      const synced = syncTrueFalseLabelsForFormLanguage(normalized, storedLang, formLang);
      setData({
        ...synced,
        options: synced.options?.length ? [...synced.options] : ['', '', '', ''],
        sourceCitations: getQuestionBookCitations(synced),
      });
    } else {
      const defaultType = config.enabledQuestionTypes[0] ?? 'mcq';
      const defaultDifficulty = config.enabledDifficulties[0] ?? 'easy';
      const defaultCategory = config.categories[0]?.id;
      setData({
        ...EMPTY_Q,
        type: defaultType,
        difficulty: defaultDifficulty,
        questionLanguage: defaultQuestionLanguage,
        categoryIds: defaultCategory ? [defaultCategory] : [],
      });
    }
    setError('');
  }, [
    open,
    question,
    defaultQuestionLanguage,
    config.enabledQuestionTypes,
    config.enabledDifficulties,
    config.categories,
    language,
    questionLanguageFieldEnabled,
  ]);

  const upd = (f: string, v: unknown): void => setData((d) => ({ ...d, [f]: v }));
  const updOption = (i: number, v: string): void =>
    setData((d) => {
      const opts = Array.isArray(d.options) ? [...d.options] : ['', '', '', ''];
      opts[i] = v;
      return { ...d, options: opts };
    });

  const visibleFields = useMemo(
    () => config.orderedFields.filter((f) => config.isFieldEnabled(f.id)),
    [config.orderedFields, config.isFieldEnabled],
  );

  const questionBodyFields = useMemo(
    () => visibleFields.filter((f) => fieldRendersOnForm(f, (data.type as Question['type']) ?? 'mcq')),
    [visibleFields, data.type],
  );

  const difficultyField = useMemo(
    () => visibleFields.find((f) => f.id === 'difficulty'),
    [visibleFields],
  );

  const questionLanguageField = useMemo(
    () => visibleFields.find((f) => f.id === 'questionLanguage'),
    [visibleFields],
  );

  const sourceFields = useMemo(
    () => visibleFields.filter((f) => isQuestionSourceFieldId(f.id)),
    [visibleFields],
  );

  const categoryIds = useMemo(
    () => getQuestionCategoryIds(data as Question),
    [data],
  );

  const sourceCitations = useMemo(
    () => getQuestionBookCitations(data as Question),
    [data],
  );

  const availableSourceFieldIds = useMemo(
    () =>
      sourceFields
        .map((field) => field.id)
        .filter((id): id is QuestionSourceFieldId => isQuestionSourceFieldId(id)),
    [sourceFields],
  );

  const questionType = (data.type as Question['type']) ?? 'mcq';
  const trueLabel = tForm('questionBank.true');
  const falseLabel = tForm('questionBank.false');
  const categoriesRequired = visibleFields.find((f) => f.id === 'categoryId')?.required ?? false;

  const validate = (): boolean => {
    const validationLanguage = resolveQuestionFormLanguage(
      language,
      data.questionLanguage as string | undefined,
      questionLanguageFieldEnabled,
    );
    const requiredMsg = (fieldId: string, fallback?: string): string =>
      translateQuestionFieldRequired(fieldId, validationLanguage, fallback);

    if (config.isFieldEnabled('categoryId') && categoriesRequired && categoryIds.length === 0) {
      setError(requiredMsg('categoryId'));
      setActiveTab('categories');
      return false;
    }

    if (difficultyField?.required && config.isFieldEnabled('difficulty') && !data.difficulty) {
      setError(requiredMsg('difficulty'));
      setActiveTab('categories');
      return false;
    }

    if (
      questionLanguageField?.required &&
      config.isFieldEnabled('questionLanguage') &&
      !data.questionLanguage
    ) {
      setError(requiredMsg('questionLanguage'));
      setActiveTab('categories');
      return false;
    }

    for (const field of questionBodyFields) {
      if (!field.required) continue;
      const val = data[field.id];
      if (val === undefined || val === '' || (Array.isArray(val) && val.filter(Boolean).length === 0)) {
        setError(requiredMsg(field.id, field.label));
        setActiveTab('question');
        return false;
      }
    }

    if (config.isFieldEnabled('text') && !data.text) {
      setError(requiredMsg('text'));
      setActiveTab('question');
      return false;
    }

    if (questionType === 'fill_blank') {
      const blankCount = countFillBlankMarkers(String(data.text ?? ''));
      const blanks = splitQuestionCompoundAnswer(String(data.answer ?? ''));
      if (blankCount < 1 || blanks.length < blankCount || blanks.some((b) => !b.trim())) {
        setError(requiredMsg('answer'));
        setActiveTab('question');
        return false;
      }
    }

    if (questionType === 'matching') {
      const lefts = (Array.isArray(data.options) ? data.options : []).map((v) => String(v).trim()).filter(Boolean);
      const rights = splitQuestionCompoundAnswer(String(data.answer ?? '')).filter(Boolean);
      if (lefts.length < 2 || rights.length < 2 || lefts.length !== rights.length) {
        setError(requiredMsg('answer'));
        setActiveTab('question');
        return false;
      }
    }

    if (questionType === 'ordering') {
      const items = (Array.isArray(data.options) ? data.options : []).map((v) => String(v).trim()).filter(Boolean);
      if (items.length < 2) {
        setError(requiredMsg('options'));
        setActiveTab('question');
        return false;
      }
    }

    if (questionType === 'numeric' && (data.answer === '' || Number.isNaN(Number(data.answer)))) {
      setError(requiredMsg('answer'));
      setActiveTab('question');
      return false;
    }

    for (const entry of sourceCitations) {
      const book = config.sourceBooks.find((b) => b.id === entry.bookId);
      if (!book) continue;
      for (const fieldId of getBookCitationFieldIds(book)) {
        const field = sourceFields.find((f) => f.id === fieldId);
        if (!field?.required) continue;
        const sourceKey = QUESTION_SOURCE_FIELD_TO_KEY[fieldId];
        const val = entry.citation[sourceKey];
        if (val === undefined || val === '') {
          setError(requiredMsg(field.id, field.label));
          setActiveTab('sources');
          return false;
        }
      }
    }

    return true;
  };

  const handleSave = (): void => {
    if (!validate()) return;
    onSave(
      normalizeQuestionBankQuestion({
        ...data,
        id: question?.id || `q${Date.now()}`,
        categoryIds,
        sourceCitations,
      }),
    );
  };

  const renderSystemField = (field: ModuleFieldDef): React.ReactNode => {
    const requiredMark = field.required ? ' *' : '';
    const label = fieldLabel(field.id, field.label);

    if (field.id === 'text') {
      return (
        <div key="text" className="sm:col-span-2">
          <label htmlFor="qb-text" className={LABEL}>{label}{requiredMark}</label>
          <textarea
            id="qb-text"
            className={`${INPUT} resize-none`}
            rows={3}
            value={(data.text as string) || ''}
            onChange={(e) => upd('text', e.target.value)}
            placeholder={tForm('questionBank.questionTextPlaceholder')}
          />
        </div>
      );
    }

    if (field.id === 'type') {
      return (
        <div key="type">
          <label htmlFor="qb-type" className={LABEL}>{label}{requiredMark}</label>
          <select
            id="qb-type"
            className={`${INPUT} cursor-pointer`}
            value={questionType}
            onChange={(e) => {
              const nextType = e.target.value as QuestionType;
              const payload = defaultPayloadForQuestionType(nextType, trueLabel, falseLabel);
              setData((d) => ({
                ...d,
                type: nextType,
                ...payload,
                text:
                  nextType === 'fill_blank' && !String(d.text ?? '').includes('___')
                    ? tForm('questionBank.fillBlankTemplate')
                    : d.text,
              }));
            }}
          >
            {config.enabledQuestionTypes.map((k) => (
              <option key={k} value={k}>
                {QUESTION_TYPE_ICONS[k]} {typeLabel(k)}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.id === 'difficulty') {
      return (
        <div key="difficulty">
          <label htmlFor="qb-difficulty" className={LABEL}>{label}{requiredMark}</label>
          <select
            id="qb-difficulty"
            className={`${INPUT} cursor-pointer`}
            value={(data.difficulty as string) || 'easy'}
            onChange={(e) => upd('difficulty', e.target.value)}
          >
            {config.enabledDifficulties.map((k) => (
              <option key={k} value={k}>{difficultyLabel(k)}</option>
            ))}
          </select>
        </div>
      );
    }

    if (field.id === 'questionLanguage') {
      const currentLanguage = normalizeAppLanguage(data.questionLanguage as string | undefined);
      return (
        <div key="questionLanguage">
          <label htmlFor="qb-question-language" className={LABEL}>{label}{requiredMark}</label>
          <select
            id="qb-question-language"
            className={`${INPUT} cursor-pointer`}
            value={currentLanguage}
            onChange={(e) => handleQuestionLanguageChange(e.target.value)}
          >
            {APP_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {questionLanguageLabel(lang.code)}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.id === 'options' && questionType === 'mcq') {
      const options = Array.isArray(data.options) ? data.options : ['', '', '', ''];
      return (
        <div key="options" className="sm:col-span-2">
          <span className={LABEL}>{label}{requiredMark}</span>
          <div className="space-y-2" role="radiogroup">
            {options.slice(0, 4).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="answer"
                  value={opt as string}
                  checked={data.answer === opt}
                  onChange={() => upd('answer', opt)}
                  className="h-4 w-4 flex-shrink-0 accent-primary"
                />
                <input
                  type="text"
                  className={INPUT}
                  value={opt as string}
                  onChange={(e) => updOption(i, e.target.value)}
                  placeholder={tForm('questionBank.optionN', { n: i + 1 })}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (field.id === 'answer' && questionType === 'true_false') {
      return (
        <div key="answer" className="sm:col-span-2">
          <span className={LABEL}>{label}{requiredMark}</span>
          <div className="flex gap-3">
            {[trueLabel, falseLabel].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  upd('answer', v);
                  upd('options', [trueLabel, falseLabel]);
                }}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium ${data.answer === v ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (field.id === 'answer' && questionType === 'short') {
      return (
        <div key="answer-short" className="sm:col-span-2">
          <label htmlFor="qb-answer" className={LABEL}>{tForm('questionBank.modelAnswer')}{requiredMark}</label>
          <textarea
            id="qb-answer"
            className={`${INPUT} resize-none`}
            rows={2}
            value={(data.answer as string) || ''}
            onChange={(e) => upd('answer', e.target.value)}
            placeholder={tForm('questionBank.modelAnswerPlaceholder')}
          />
        </div>
      );
    }

    return null;
  };

  const renderCustomField = (field: ModuleFieldDef): React.ReactNode => {
    const val = data[field.id] ?? field.defaultValue ?? '';
    const label = fieldLabel(field.id, field.label);
    const requiredMark = field.required ? ' *' : '';

    if (field.type === 'textarea') {
      return (
        <div key={field.id} className="sm:col-span-2">
          <label className={LABEL}>{label}{requiredMark}</label>
          <textarea
            className={`${INPUT} resize-none`}
            rows={2}
            value={val as string}
            onChange={(e) => upd(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.id}>
          <label className={LABEL}>{label}{requiredMark}</label>
          <select
            className={`${INPUT} cursor-pointer`}
            value={val as string}
            onChange={(e) => upd(field.id, e.target.value)}
          >
            <option value="">{tForm('questionBank.selectCategory')}</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'boolean') {
      return (
        <div key={field.id} className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            checked={!!val}
            onChange={(e) => upd(field.id, e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm font-medium">{label}</span>
        </div>
      );
    }

    if (field.type === 'number') {
      return (
        <div key={field.id}>
          <label className={LABEL}>{label}{requiredMark}</label>
          <input
            type="number"
            className={INPUT}
            value={val as number}
            onChange={(e) => upd(field.id, e.target.value)}
          />
        </div>
      );
    }

    if (field.type === 'tags') {
      return (
        <div key={field.id}>
          <label className={LABEL}>{label}{requiredMark}</label>
          <input
            className={INPUT}
            value={Array.isArray(val) ? val.join(', ') : (val as string)}
            onChange={(e) =>
              upd(
                field.id,
                e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean),
              )
            }
          />
        </div>
      );
    }

    return (
      <div key={field.id}>
        <label className={LABEL}>{label}{requiredMark}</label>
        <input
          type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
          className={INPUT}
          value={val as string}
          onChange={(e) => upd(field.id, e.target.value)}
          placeholder={field.placeholder}
        />
      </div>
    );
  };

  const renderField = (field: ModuleFieldDef): React.ReactNode => {
    const node = SYSTEM_FIELD_IDS.has(field.id)
      ? renderSystemField(field)
      : renderCustomField(field);
    return node ? <React.Fragment key={field.id}>{node}</React.Fragment> : null;
  };

  const renderTabPanel = (tabId: QuestionBankFormTabId): React.ReactNode => {
    if (tabId === 'categories') {
      const categoriesEnabled = config.isFieldEnabled('categoryId');
      const difficultyEnabled = config.isFieldEnabled('difficulty');
      const questionLanguageEnabled = config.isFieldEnabled('questionLanguage');
      if (!categoriesEnabled && !difficultyEnabled && !questionLanguageEnabled) {
        return <p className="text-sm text-muted-foreground">{tForm('questionBank.categoriesDisabledHint')}</p>;
      }
      return (
        <div className="space-y-5">
          {questionLanguageEnabled && questionLanguageField ? renderField(questionLanguageField) : null}
          {difficultyEnabled && difficultyField ? renderField(difficultyField) : null}
          {categoriesEnabled ? (
            <CategorySelector
              multiple
              categories={config.categories}
              value={categoryIds}
              onChange={(ids) => upd('categoryIds', ids)}
              onCategoriesUpdated={() => config.refresh()}
              required={categoriesRequired}
              translate={tForm}
            />
          ) : null}
        </div>
      );
    }

    if (tabId === 'sources') {
      return (
        <QuestionSourcesTab
          sourceBooks={config.sourceBooks}
          citations={sourceCitations}
          availableFieldIds={availableSourceFieldIds}
          orderedSourceFields={sourceFields}
          onCitationsChange={(next) => upd('sourceCitations', next)}
          onBooksUpdated={() => config.refresh()}
          fieldLabel={fieldLabel}
          translate={tForm}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {questionBodyFields.map((field) => renderField(field))}
        {COMPOUND_ANSWER_TYPES.has(questionType) && (
          <QuestionTypeAnswerFields
            questionType={questionType}
            text={String(data.text ?? '')}
            options={Array.isArray(data.options) ? data.options : []}
            answer={String(data.answer ?? '')}
            onOptionsChange={(next) => upd('options', next)}
            onAnswerChange={(next) => upd('answer', next)}
            t={tForm}
          />
        )}
      </div>
    );
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={question ? tForm('questionBank.editQuestion') : tForm('questionBank.addQuestion')}
      icon={BookOpen}
      size="lg"
      tall
      tabs={formTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabPanelIdPrefix="question-form-tab"
      lang={formLanguage}
      dir={getLanguageDirection(formLanguage)}
      error={error}
      cancelLabel={tForm('questionBank.cancel')}
      saveLabel={tForm('questionBank.saveQuestion')}
      onSave={handleSave}
    >
      {renderTabPanel(activeTab)}
    </FormModal>
  );
}
