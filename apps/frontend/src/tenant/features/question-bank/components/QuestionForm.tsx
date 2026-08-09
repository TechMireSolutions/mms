import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { FormModal } from '@/components/ui/FormModal';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import {
  getLanguageDirection,
  normalizeAppLanguage,
  questionBankQuestionWriteSchema,
  type AppLanguageCode,
  type AppTranslationKey,
  type QuestionDifficulty,
  type QuestionBankQuestion as Question,
} from '@mms/shared';
import { mapZodFormErrors } from '@/lib/forms/mapZodFormErrors';
import { QuestionFormClassificationSection } from "@/tenant/features/question-bank/components/QuestionFormClassificationSection";
import { QuestionFormContentSection } from "@/tenant/features/question-bank/components/QuestionFormContentSection";
import { QuestionFormFooterSummary } from "@/tenant/features/question-bank/components/QuestionFormFooterSummary";
import { QuestionFormSourcesSection } from "@/tenant/features/question-bank/components/QuestionFormSourcesSection";

import type { QuestionFormDraft, QuestionFormProps } from "./questionFormTypes";

export function QuestionForm({
  open,
  question,
  onClose,
  onSave,
}: QuestionFormProps): React.JSX.Element {
  const { t, language } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [questionDraft, setQuestionDraft] = useState<QuestionFormDraft>(() => {
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

  const handleSave = async () => {
    setErrors({});
    const candidate = {
      ...questionDraft,
      id: question?.id || `q${crypto.randomUUID()}`,
    };
    const parsed = questionBankQuestionWriteSchema.safeParse(candidate);
    if (!parsed.success) {
      setErrors(mapZodFormErrors(parsed.error, (message) => t(message as AppTranslationKey)));
      notify.error(t('questionBank.validationFailed'));
      return;
    }

    setSaving(true);
    try {
      await onSave(parsed.data as Question);
      notify.success(question ? t('questionBank.updated') : t('questionBank.saved'));
      onClose();
    } catch (err: unknown) {
      notify.error(t('questionBank.saveFailed'), { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  };

  const footerStart = <QuestionFormFooterSummary questionDraft={questionDraft} />;

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
        <div className="relative z-30">
          <QuestionFormClassificationSection questionDraft={questionDraft} errors={errors} updateDraft={updateDraft} />
        </div>
        <div className="relative z-20">
          <QuestionFormContentSection questionDraft={questionDraft} errors={errors} updateDraft={updateDraft} />
        </div>
        <div className="relative z-10">
          <QuestionFormSourcesSection questionDraft={questionDraft} updateDraft={updateDraft} />
        </div>
      </div>
    </FormModal>
  );
}
