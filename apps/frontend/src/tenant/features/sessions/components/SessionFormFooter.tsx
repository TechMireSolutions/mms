import React, { useMemo } from 'react';
import { toTitleCase, AppTranslationKey } from '@mms/shared';
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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive text-xs font-bold border border-destructive/20">
        {nameRequiredLabel}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5 text-xs">
      <span className="font-bold text-foreground bg-muted/65 px-2.5 py-1 rounded-lg border border-border/60">
        {sessionName}
      </span>
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20 text-xs">
          {sessionType}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-xs border capitalize ${
          sessionStatus === 'active'
            ? 'bg-success/10 text-success border-success/20'
            : sessionStatus === 'completed'
            ? 'bg-info/10 text-info border-info/20'
            : 'bg-muted text-muted-foreground border-border'
        }`}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
