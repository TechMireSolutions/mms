import { useFormContext, Controller } from 'react-hook-form';
import type { CustomFieldConfig, AppTranslationKey } from '@mms/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { FieldErrorMessage } from '@/components/ui/FormField';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';
import { useTranslation } from '@/hooks/useTranslation';

export function FieldRenderer({ field }: { field: CustomFieldConfig }) {
  const { t } = useTranslation();
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();
  const error = errors[field.key];

  const commonProps = {
    id: field.key,
    placeholder: field.placeholder ?? undefined,
    'aria-invalid': !!error,
    'aria-required': field.required,
    'aria-describedby': error ? `${field.key}-error` : undefined,
  };

  const renderInput = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'phone':
        return (
          <Input
            {...commonProps}
            type={field.type === 'phone' ? 'tel' : field.type}
            {...register(field.key)}
            className="min-h-11"
          />
        );

      case 'textarea':
        return <Textarea {...commonProps} {...register(field.key)} rows={3} className="min-h-24" />;

      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            step="any"
            {...register(field.key, {
              setValueAs: (val) =>
                val === '' || val === null || Number.isNaN(Number(val)) ? undefined : Number(val),
            })}
            className="min-h-11"
          />
        );

      case 'currency':
        return (
          <Input
            {...commonProps}
            type="text"
            placeholder="0.00"
            {...register(field.key)}
            className="min-h-11 font-mono"
          />
        );

      case 'date':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: { onChange, value } }) => (
              <DatePicker
                id={field.key}
                value={(value as string) || ''}
                onChange={(isoDate) => onChange(isoDate || null)}
              />
            )}
          />
        );

      case 'datetime':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: { onChange, value } }) => (
              <div className="flex gap-2">
                <DatePicker
                  id={`${field.key}-date`}
                  value={typeof value === 'string' ? value.split('T')[0] : ''}
                  onChange={(isoDate) => {
                    const existingTime = typeof value === 'string' ? value.split('T')[1] || '00:00:00Z' : '00:00:00Z';
                    onChange(`${isoDate}T${existingTime}`);
                  }}
                />
                <TimePicker
                  id={`${field.key}-time`}
                  value={typeof value === 'string' ? value.split('T')[1]?.slice(0, 5) || '' : ''}
                  onChange={(time) => {
                    const existingDate = typeof value === 'string' ? value.split('T')[0] : new Date().toISOString().split('T')[0];
                    onChange(`${existingDate}T${time}:00Z`);
                  }}
                />
              </div>
            )}
          />
        );

      case 'boolean':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: { onChange, value } }) => (
              <div className="flex items-center gap-2 min-h-11">
                <Checkbox
                  id={field.key}
                  checked={!!value}
                  onCheckedChange={(checked) => onChange(checked === true)}
                />
                <Label htmlFor={field.key} className="text-sm font-medium cursor-pointer">
                  {field.label}
                </Label>
              </div>
            )}
          />
        );

      case 'select':
        return (
          <Controller
            name={field.key}
            control={control}
            render={({ field: { onChange, value } }) => (
              <select
                id={field.key}
                value={(value as string) ?? ''}
                onChange={onChange}
                className="w-full min-h-11 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t('common.none' as AppTranslationKey) || 'Select option...'}</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}
          />
        );

      case 'file':
        return (
          <Input
            {...commonProps}
            type="file"
            accept={field.allowedExtensions ? field.allowedExtensions.split(',').map((ext) => `.${ext.trim()}`).join(',') : undefined}
            className="min-h-11"
          />
        );

      default:
        return <Input {...commonProps} type="text" {...register(field.key)} className="min-h-11" />;
    }
  };

  if (field.type === 'boolean') {
    return (
      <div className="flex flex-col gap-1.5">
        {renderInput()}
        {error && <FieldErrorMessage message={error.message?.toString()} id={`${field.key}-error`} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={field.key} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ms-0.5">*</span>}
      </Label>
      {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
      {renderInput()}
      {error && <FieldErrorMessage message={error.message?.toString()} id={`${field.key}-error`} />}
    </div>
  );
}
