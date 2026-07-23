import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FORM_LABEL } from '@/components/ui/formStyles';
import { useTranslation } from '@/hooks/useTranslation';

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  id: string;
  label?: string;
  showToggle?: boolean;
  minPasswordLength?: number;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  label,
  showToggle = true,
  minPasswordLength,
  value,
  onChange,
  disabled,
  autoComplete = 'current-password',
  required = true,
  className = '',
  ...rest
}) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5 text-start">
      {label ? (
        <label htmlFor={id} className={FORM_LABEL}>
          {label}
        </label>
      ) : null}
      <div className="relative">
        <Lock
          className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80 pointer-events-none"
          aria-hidden
        />
        <Input
          id={id}
          type={showToggle && showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          minLength={minPasswordLength}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`ps-9 ${showToggle ? 'pe-11' : ''} ${className}`}
          {...rest}
        />
        {showToggle ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute end-0.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground cursor-pointer"
            aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default PasswordInput;
