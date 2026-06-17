import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import useTranslation from '@/hooks/useTranslation';
import {
  QUESTION_SOURCE_FIELD_IDS,
  QUESTION_SOURCE_FIELD_TO_KEY,
  type AppTranslationKey,
  type ModuleFieldDef,
  type QuestionSourceReference,
} from '@mms/shared';
import { FORM_INPUT, FORM_LABEL, FORM_TEXTAREA } from '@/components/ui/formStyles';

interface SourceReferencesEditorProps {
  sources: QuestionSourceReference[];
  sourceFields: ModuleFieldDef[];
  onChange: (sources: QuestionSourceReference[]) => void;
  fieldLabel: (fieldId: string, fallback?: string) => string;
  translate?: (key: AppTranslationKey, params?: Record<string, string | number>) => string;
}

export default function SourceReferencesEditor({
  sources,
  sourceFields,
  onChange,
  fieldLabel,
  translate,
}: SourceReferencesEditorProps): React.JSX.Element {
  const { t: globalT } = useTranslation();
  const t = translate ?? globalT;
  const entries = sources.length > 0 ? sources : [{}];

  const updEntry = (index: number, key: keyof QuestionSourceReference, value: string): void => {
    const next = entries.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry));
    onChange(next);
  };

  const addEntry = (): void => onChange([...entries, {}]);

  const removeEntry = (index: number): void => {
    const next = entries.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [{}]);
  };

  const renderField = (index: number, field: ModuleFieldDef): React.ReactNode => {
    if (!QUESTION_SOURCE_FIELD_IDS.includes(field.id as (typeof QUESTION_SOURCE_FIELD_IDS)[number])) {
      return null;
    }
    const sourceKey = QUESTION_SOURCE_FIELD_TO_KEY[field.id as keyof typeof QUESTION_SOURCE_FIELD_TO_KEY];
    const value = entries[index]?.[sourceKey] ?? '';
    const label = fieldLabel(field.id, field.label);
    const requiredMark = field.required ? ' *' : '';
    const inputId = `qb-source-${index}-${field.id}`;

    if (field.type === 'textarea') {
      return (
        <div key={field.id} className="sm:col-span-2">
          <label htmlFor={inputId} className={FORM_LABEL}>
            {label}
            {requiredMark}
          </label>
          <textarea
            id={inputId}
            className={`${FORM_TEXTAREA} resize-none`}
            rows={2}
            value={value}
            onChange={(e) => updEntry(index, sourceKey, e.target.value)}
            placeholder={field.placeholder}
          />
        </div>
      );
    }

    return (
      <div key={field.id}>
        <label htmlFor={inputId} className={FORM_LABEL}>
          {label}
          {requiredMark}
        </label>
        <input
          id={inputId}
          type={field.type === 'date' ? 'date' : 'text'}
          className={FORM_INPUT}
          value={value}
          onChange={(e) => updEntry(index, sourceKey, e.target.value)}
          placeholder={field.placeholder}
        />
      </div>
    );
  };

  if (sourceFields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t('questionBank.sourcesDisabledHint')}</p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-muted-foreground">{t('questionBank.sourcesMultiHint')}</p>
      {entries.map((_, index) => (
        <div
          key={index}
          className="space-y-3 rounded-xl border border-border/70 bg-muted/10 p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-foreground">
              {t('questionBank.sourceEntry', { n: index + 1 })}
            </p>
            {entries.length > 1 && (
              <button
                type="button"
                onClick={() => removeEntry(index)}
                className="flex min-h-8 items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-destructive"
                aria-label={t('questionBank.removeSource', { n: index + 1 })}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                {t('questionBank.removeSource')}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {sourceFields.map((field) => renderField(index, field))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addEntry}
        className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        {t('questionBank.addSource')}
      </button>
    </div>
  );
}
