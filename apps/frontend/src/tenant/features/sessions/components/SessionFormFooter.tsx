import React, { useMemo } from 'react';
import { toTitleCase, AppTranslationKey } from '@mms/shared';
import {
  FormFooterBadge,
  FormFooterEntityChip,
  FormFooterErrorChip,
  type FormFooterBadgeTone,
} from '@/components/ui/FormFooterChip';
import { useTranslation } from '@/hooks/useTranslation';

export interface SessionFormFooterProps {
  sessionName?: string;
  sessionType?: string;
  sessionStatus?: string;
  nameRequiredLabel: string;
}

export function SessionFormFooter({
  sessionName,
  sessionType,
  sessionStatus,
  nameRequiredLabel,
}: SessionFormFooterProps): React.JSX.Element {
  const { t } = useTranslation();
  const statusLabel = useMemo(() => {
    const status = sessionStatus || 'active';
    const translationKey = `sessions.status.${status}` as AppTranslationKey;
    const translated = t(translationKey);
    return translated === translationKey ? toTitleCase(status) : translated;
  }, [sessionStatus, t]);

  if (!sessionName) {
    return (
      <FormFooterErrorChip>{nameRequiredLabel}</FormFooterErrorChip>
    );
  }

  const statusTone: FormFooterBadgeTone =
    sessionStatus === 'active'
      ? 'success'
      : sessionStatus === 'completed'
        ? 'info'
        : 'muted';

  return (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <FormFooterEntityChip>{sessionName}</FormFooterEntityChip>
      <div className="flex items-center gap-1.5">
        <FormFooterBadge>{sessionType}</FormFooterBadge>
        <FormFooterBadge tone={statusTone}>{statusLabel}</FormFooterBadge>
      </div>
    </div>
  );
}
