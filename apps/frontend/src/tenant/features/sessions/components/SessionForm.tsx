import React, { useEffect, useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';
import { FormModal } from '@/components/ui/FormModal';
import { useTranslation } from '@/hooks/useTranslation';
import { useGlobalSettings } from '@/tenant/hooks/useGlobalSettings';
import { useFinanceCurrency } from '@/hooks/useCurrency';
import { useSessionConfig } from '@/hooks/useStandardModuleConfig';
import { notify } from '@/lib/notify';
import { Session, SESSION_TYPES } from '@/lib/data/sessionsData';
import { SessionSchema, toTitleCase, AppTranslationKey } from '@mms/shared';
import {
  SessionDetailsSection,
  SessionFinancialSection,
  type SessionSelectOption,
} from '@/tenant/features/sessions/components/SessionFormSections';
import {
  SESSION_CURRENCIES,
  SESSION_STATUSES,
  SESSION_TYPE_LABEL_KEYS,
  buildSessionDraftFromRecord,
  sessionFormDraftSnapshot,
  type SessionFormDraft,
} from '@/tenant/features/sessions/components/sessionFormShared';
import { SessionFormFooter } from '@/tenant/features/sessions/components/SessionFormFooter';

interface SessionFormProps {
  open?: boolean;
  session?: Session | null;
  onClose: () => void;
  onSave: (session: Session) => void | Promise<void>;
}

export function SessionForm({
  open = true,
  session,
  onClose,
  onSave,
}: SessionFormProps): React.JSX.Element {
  const { t } = useTranslation();
  const { language } = useGlobalSettings();
  const { settings, types, statuses } = useSessionConfig();
  const { activeCurrency } = useFinanceCurrency();
  const defaultCurrency = activeCurrency.code;

  const typeOptions = types.length > 0 ? types : [...SESSION_TYPES];
  const statusValues = statuses.length > 0 ? statuses : [...SESSION_STATUSES];
  const defaultType = typeOptions.includes(settings.defaultSessionType)
    ? settings.defaultSessionType
    : (typeOptions[0] || 'Hifz');

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sessionDraft, setSessionDraft] = useState<SessionFormDraft>(() =>
    buildSessionDraftFromRecord(session, defaultType, defaultCurrency),
  );
  const [baselineSnapshot, setBaselineSnapshot] = useState(() =>
    sessionFormDraftSnapshot(buildSessionDraftFromRecord(session, defaultType, defaultCurrency)),
  );

  useEffect(() => {
    const nextDraft = buildSessionDraftFromRecord(session, defaultType, defaultCurrency);
    setSessionDraft(nextDraft);
    setBaselineSnapshot(sessionFormDraftSnapshot(nextDraft));
    setErrors({});
  }, [session, defaultCurrency, defaultType]);

  const updateDraft = (patch: Partial<SessionFormDraft>) => {
    setSessionDraft((prev) => ({ ...prev, ...patch }));
  };

  const isDirty = sessionFormDraftSnapshot(sessionDraft) !== baselineSnapshot;

  const handleSave = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};

    if (!sessionDraft.name?.trim()) {
      newErrors.name = t('sessions.form.nameRequired');
    }
    if (!sessionDraft.startDate) {
      newErrors.startDate = t('sessions.form.startDateRequired');
    }
    if (!sessionDraft.endDate) {
      newErrors.endDate = t('sessions.form.endDateRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      notify.error(t('common.formPleaseFixErrors'));
      return;
    }

    setSaving(true);
    try {
      const payload: Session = {
        id: session?.id || `ses${crypto.randomUUID()}`,
        name: toTitleCase(sessionDraft.name || ''),
        type: sessionDraft.type || defaultType,
        status: (sessionDraft.status as Session['status']) || 'active',
        startDate: sessionDraft.startDate || '',
        endDate: sessionDraft.endDate || '',
        baseFee: Number(sessionDraft.baseFee || 0),
        currency: sessionDraft.currency || defaultCurrency,
        description: sessionDraft.description || '',
        classes: sessionDraft.classes || [],
        timetable: sessionDraft.timetable || [],
        discounts: sessionDraft.discounts || [],
        budget: sessionDraft.budget || { totalRevenue: 0, collected: 0, expenses: [], incomes: [] },
        events: sessionDraft.events || [],
        tabarruk: sessionDraft.tabarruk || [],
        customData: sessionDraft.customData ?? {},
      };

      const parsed = SessionSchema.safeParse(payload);
      if (!parsed.success) {
        notify.error(t('common.formPleaseFixErrors'));
        return;
      }

      await onSave(payload);
      notify.success(session ? t('sessions.toast.updated') : t('sessions.toast.created'));
      onClose();
    } catch {
      notify.error(t('sessions.toast.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const sessionTypeOptions = useMemo(
    (): SessionSelectOption[] =>
      typeOptions.map((typeOption) => {
        const translationKey = SESSION_TYPE_LABEL_KEYS[typeOption];
        return {
          value: typeOption,
          label: translationKey ? t(translationKey) : typeOption,
        };
      }),
    [typeOptions, t],
  );

  const statusOptions = useMemo(
    (): SessionSelectOption[] =>
      statusValues.map((statusOption) => {
        const translationKey = `sessions.statuses.${statusOption}` as AppTranslationKey;
        const translated = t(translationKey);
        const label = translated === translationKey ? toTitleCase(statusOption) : translated;
        return { value: statusOption, label };
      }),
    [statusValues, t],
  );

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={session ? t('sessions.form.editTitle') : t('sessions.form.addTitle')}
      subtitle={t('sessions.form.subtitle')}
      icon={Calendar}
      lang={language}
      cancelLabel={t('common.cancel')}
      saveLabel={session ? t('sessions.action.update') : t('sessions.action.create')}
      onSave={() => { void handleSave(); }}
      saving={saving}
      saveDisabled={
        !sessionDraft.name?.trim()
        || !sessionDraft.startDate
        || !sessionDraft.endDate
        || (Boolean(session?.id) && !isDirty)
      }
      footerStart={
        <SessionFormFooter
          sessionName={sessionDraft.name}
          sessionType={sessionDraft.type}
          sessionStatus={sessionDraft.status}
          nameRequiredLabel={t('sessions.form.nameRequired')}
        />
      }
    >
      <div className="space-y-4">
        <SessionDetailsSection
          sessionDraft={sessionDraft}
          errors={errors}
          defaultType={defaultType}
          sessionTypeOptions={sessionTypeOptions}
          statusOptions={statusOptions}
          onDraftChange={updateDraft}
        />
        <SessionFinancialSection
          sessionDraft={sessionDraft}
          errors={errors}
          currencyOptions={SESSION_CURRENCIES}
          defaultCurrency={defaultCurrency}
          onDraftChange={updateDraft}
        />
      </div>
    </FormModal>
  );
}
