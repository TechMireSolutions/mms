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
      const name = toTitleCase(sessionDraft.name?.trim() || '');
      const candidate = {
        ...sessionDraft,
        id: session?.id ?? `sess-${Date.now()}`,
        name,
        baseFee: Number(sessionDraft.baseFee) || 0,
        _blueprintId: '1.0',
      };
      const parsed = SessionSchema.safeParse(candidate);
      if (!parsed.success) {
        setErrors({ schema: t('common.formPleaseFixErrors') });
        notify.error(t('common.formPleaseFixErrors'));
        return;
      }

      await onSave(parsed.data as Session);
      onClose();
    } catch (err: unknown) {
      notify.error(t('sessions.toast.saveFailed'), {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const sessionTypeOptions = useMemo(
    () =>
      typeOptions.map((sessionType) => {
        const translationKey = SESSION_TYPE_LABEL_KEYS[sessionType];
        return {
          value: sessionType,
          label: translationKey ? t(translationKey) : sessionType,
        };
      }),
    [typeOptions, t],
  );

  const statusOptions = useMemo<SessionSelectOption[]>(
    () =>
      statusValues.map((statusOption) => {
        const translationKey = `sessions.status.${statusOption}` as AppTranslationKey;
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
