import React from 'react';
import { MESSAGING_VARIABLE_TOKENS, type VariableToken } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';

export interface MessagingVariableTokensBarProps {
  onSelectToken: (token: string) => void;
  className?: string;
  showLabel?: boolean;
}

/**
 * Reusable variable token selector bar for message templates and campaign composition.
 */
export function MessagingVariableTokensBar({
  onSelectToken,
  className = '',
  showLabel = true,
}: MessagingVariableTokensBarProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {showLabel && (
        <span className="text-[10px] text-muted-foreground font-semibold me-1">
          {t('messaging.insertVariable')}:
        </span>
      )}
      {MESSAGING_VARIABLE_TOKENS.map(({ token, fallbackExample }: VariableToken) => (
        <button
          key={token}
          type="button"
          onClick={() => onSelectToken(token)}
          title={`Example: ${fallbackExample}`}
          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted hover:bg-primary/10 hover:text-primary border border-border/40 transition-colors cursor-pointer"
        >
          {token}
        </button>
      ))}
    </div>
  );
}

export default MessagingVariableTokensBar;
