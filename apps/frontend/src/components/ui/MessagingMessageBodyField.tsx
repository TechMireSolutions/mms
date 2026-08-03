import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { appendVariableToken } from '@mms/shared';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { MessagingVariableTokensBar } from '@/components/ui/MessagingVariableTokensBar';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/useTranslation';

export interface MessagingMessageBodyFieldProps {
  id: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  footer?: ReactNode;
}

/**
 * Shared message-body field for Setup templates and campaign composition:
 * label → variable tokens → textarea → Sparkles fallback hint (+ optional footer).
 */
export function MessagingMessageBodyField({
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  footer,
}: MessagingMessageBodyFieldProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div>
      <label className={FORM_LABEL} htmlFor={id}>{t('messaging.messageBody')}</label>
      <MessagingVariableTokensBar
        onSelectToken={(token) => onChange(appendVariableToken(value, token))}
        className="mb-2"
      />
      <Textarea
        id={id}
        name={name ?? id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        required={required}
      />
      <p className="mt-1 flex items-center gap-1 text-xs italic text-muted-foreground/80">
        <Sparkles className="h-3 w-3 flex-shrink-0 text-primary/70" />
        {t('messaging.fallbackHint')}
      </p>
      {footer}
    </div>
  );
}
