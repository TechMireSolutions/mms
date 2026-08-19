import React from 'react';
import { estimatePasswordStrength } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

export interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
  showChecks?: boolean;
}

export function PasswordStrengthMeter({
  password,
  className,
  showChecks = false,
}: PasswordStrengthMeterProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (!password) return null;

  const { score: rawScore } = estimatePasswordStrength(password);
  const score = rawScore === 0 ? 0 : Math.min(4, rawScore);

  const checks = [
    { label: t('auth.passwordCheckLength'), pass: password.length >= 8 },
    { label: t('auth.passwordCheckUpper'), pass: /[A-Z]/.test(password) },
    { label: t('auth.passwordCheckNumber'), pass: /[0-9]/.test(password) },
    { label: t('auth.passwordCheckSymbol'), pass: /[^A-Za-z0-9]/.test(password) },
  ];

  const strengthColorCls =
    score <= 1
      ? 'bg-destructive text-destructive'
      : score === 2
        ? 'bg-warning text-warning'
        : score === 3
          ? 'bg-primary text-primary'
          : 'bg-success text-success';

  const strengthLabel =
    score <= 1
      ? t('auth.passwordStrengthWeak')
      : score === 2
        ? t('auth.passwordStrengthFair')
        : score === 3
          ? t('auth.passwordStrengthGood')
          : t('auth.passwordStrengthStrong');

  return (
    <div className={cn('space-y-2 pt-1', className)} aria-live="polite">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">{t('auth.passwordStrength')}</span>
        <span className="font-semibold text-xs capitalize">{strengthLabel}</span>
      </div>

      <div
        className="grid grid-cols-4 gap-1.5 h-1.5 rounded-full overflow-hidden bg-muted"
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-label={strengthLabel}
      >
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              'h-full transition-all duration-300',
              score >= step ? strengthColorCls.split(' ')[0] : 'bg-transparent',
            )}
          />
        ))}
      </div>

      {showChecks ? (
        <div className="grid grid-cols-2 gap-1 pt-1">
          {checks.map((item) => (
            <div
              key={item.label}
              className={cn(
                'flex items-center gap-1.5 text-3xs transition-colors',
                item.pass ? 'text-success font-semibold' : 'text-muted-foreground/75',
              )}
            >
              <span>{item.pass ? '✓' : '○'}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
