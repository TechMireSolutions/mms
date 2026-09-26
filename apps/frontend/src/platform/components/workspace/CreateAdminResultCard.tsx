import React from 'react';
import { Check } from 'lucide-react';
import { CopyBtn } from '@/components/ui/CopyBtn';
import { useTranslation } from '@/hooks/useTranslation';

export interface CreateAdminResultCardProps {
  name: string;
  adminEmail: string;
  initialPassword: string;
}

export function CreateAdminResultCard({
  name,
  adminEmail,
  initialPassword,
}: CreateAdminResultCardProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 py-2 animate-in fade-in-50 duration-200 text-start">
      <div className="rounded-xl border border-success/30 bg-success/10 p-4 space-y-3">
        <div className="flex items-center gap-2 text-success font-bold text-sm">
          <Check className="w-4 h-4 shrink-0" aria-hidden />
          {t('platform.adminCreatedSuccess')}
        </div>

        <div className="space-y-2 text-xs text-foreground">
          <div>
            <span className="text-muted-foreground">{t('platform.adminNameValue')}</span>{' '}
            <span className="font-semibold text-foreground">{name}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('platform.adminEmailValue')}</span>{' '}
            <span className="font-semibold text-foreground">{adminEmail}</span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="min-w-0">
              <span className="text-muted-foreground block text-2xs mb-0.5">{t('platform.initialPasswordValue')}</span>
              <code className="font-mono font-bold bg-background px-2.5 py-1 rounded-md border border-border text-sm text-primary inline-block">
                {initialPassword}
              </code>
            </div>
            <CopyBtn
              text={`Name: ${name}\nEmail: ${adminEmail}\nPassword: ${initialPassword}`}
              label={t('platform.copyAll')}
              className="min-h-11 h-11 px-3 text-xs"
              showToast
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        {t('platform.provideCredentialsHint')}
      </p>
    </div>
  );
}
