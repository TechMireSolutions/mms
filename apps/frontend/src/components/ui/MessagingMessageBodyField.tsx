import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { appendVariableToken } from '@mms/shared';
import { Field } from '@/components/ui/FormPrimitives';
import { FORM_INPUT_ERROR } from '@/components/ui/formStyles';
import { MessagingVariableTokensBar } from '@/components/ui/MessagingVariableTokensBar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

export interface MessagingMessageBodyFieldProps {
  id: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  error?: string;
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
  error,
  footer,
}: MessagingMessageBodyFieldProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <Field id={id} label={t('messaging.messageBody')} required={required} error={error}>
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
        aria-invalid={Boolean(error)}
        className={cn(error && FORM_INPUT_ERROR)}
      />
      <p className="mt-1 flex items-center gap-1 text-xs italic text-muted-foreground/80">
        <Sparkles className="h-3 w-3 flex-shrink-0 text-primary/70" />
        {t('messaging.fallbackHint')}
      </p>
      {footer}
    </Field>
  );
}
