import { useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { buildDynamicValidationSchema, type TabConfig, type AppTranslationKey } from '@mms/shared';
import { FieldRenderer } from './FieldRenderer';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

export interface DynamicFormProps {
  tabs: TabConfig[];
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  submitLabelKey?: AppTranslationKey;
  isSubmitting?: boolean;
}

export function DynamicForm({
  tabs,
  initialValues = {},
  onSubmit,
  submitLabelKey = 'common.save',
  isSubmitting = false,
}: DynamicFormProps) {
  const { t } = useTranslation();

  const activeFields = useMemo(() => {
    return tabs.filter((t) => t.enabled).flatMap((t) => t.fields).filter((f) => f.enabled);
  }, [tabs]);

  const dynamicSchema = useMemo(() => buildDynamicValidationSchema(activeFields), [activeFields]);

  const methods = useForm<Record<string, unknown>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: initialValues,
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        {tabs
          .filter((t) => t.enabled)
          .map((tab) => (
            <fieldset key={tab.id} className="border border-border p-4 rounded-lg space-y-4">
              <legend className="font-semibold text-sm px-2 text-foreground">{tab.label}</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tab.fields
                  .filter((f) => f.enabled)
                  .map((field) => (
                    <FieldRenderer key={field.key} field={field} />
                  ))}
              </div>
            </fieldset>
          ))}
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting} className="min-h-11 min-w-28">
            {isSubmitting ? t('common.save') + '...' : t(submitLabelKey)}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
