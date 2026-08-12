import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customFieldConfigSchema, type CustomFieldConfig, FIELD_TYPES_META, type AppTranslationKey } from '@mms/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FieldErrorMessage } from '@/components/ui/FormField';
import { useTranslation } from '@/hooks/useTranslation';

export interface CustomFieldEditorProps {
  initialData?: Partial<CustomFieldConfig>;
  tabId: string;
  onSave: (data: CustomFieldConfig) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function CustomFieldEditor({
  initialData,
  tabId,
  onSave,
  isSubmitting = false,
}: CustomFieldEditorProps) {
  const { t } = useTranslation();

  const methods = useForm<CustomFieldConfig>({
    resolver: zodResolver(customFieldConfigSchema) as any,
    defaultValues: {
      id: initialData?.id || crypto.randomUUID(),
      tabId,
      key: initialData?.key || `cf_${Date.now().toString(36)}`,
      label: initialData?.label || '',
      type: initialData?.type || 'text',
      required: initialData?.required ?? false,
      unique: initialData?.unique ?? false,
      enabled: initialData?.enabled ?? true,
      placeholder: initialData?.placeholder ?? null,
      description: initialData?.description ?? null,
      defaultValue: initialData?.defaultValue ?? null,
      options: initialData?.options ?? [],
      minValue: initialData?.minValue ?? null,
      maxValue: initialData?.maxValue ?? null,
      sortOrder: initialData?.sortOrder ?? 0,
      hasData: initialData?.hasData ?? false,
      isSystem: initialData?.isSystem ?? false,
    },
  });

  const selectedType = methods.watch('type');
  const typeMeta = FIELD_TYPES_META[selectedType];

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit((data) => onSave(data as CustomFieldConfig))} className="space-y-4">
        <div>
          <Label htmlFor="label" className="text-sm font-medium">
            {t('common.label' as AppTranslationKey) || 'Field Label'}
          </Label>
          <Input id="label" {...methods.register('label')} className="min-h-11 mt-1" />
          {methods.formState.errors.label && (
            <FieldErrorMessage message={methods.formState.errors.label.message} />
          )}
        </div>

        <div>
          <Label htmlFor="type" className="text-sm font-medium">
            {t('common.type' as AppTranslationKey) || 'Field Type'}
          </Label>
          <select
            id="type"
            disabled={initialData?.hasData}
            {...methods.register('type')}
            className="w-full min-h-11 mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {Object.keys(FIELD_TYPES_META).map((typeKey) => (
              <option key={typeKey} value={typeKey}>
                {FIELD_TYPES_META[typeKey as keyof typeof FIELD_TYPES_META].displayLabelKey}
              </option>
            ))}
          </select>
          {initialData?.hasData && (
            <p className="text-xs text-amber-600 mt-1">
              Type is locked because field contains active data
            </p>
          )}
        </div>

        {typeMeta?.hasOptions && (
          <div>
            <Label htmlFor="options" className="text-sm font-medium">
              Dropdown Options (comma-separated)
            </Label>
            <Input
              id="options"
              placeholder="Option 1, Option 2, Option 3"
              className="min-h-11 mt-1"
              value={(methods.watch('options') || []).join(', ')}
              onChange={(e) => {
                const opts = e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean);
                methods.setValue('options', opts);
              }}
            />
          </div>
        )}

        <div className="flex items-center gap-4 py-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="required"
              checked={methods.watch('required')}
              onCheckedChange={(c) => methods.setValue('required', c === true)}
            />
            <Label htmlFor="required" className="text-sm cursor-pointer">
              Required Field
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="unique"
              checked={methods.watch('unique')}
              onCheckedChange={(c) => methods.setValue('unique', c === true)}
            />
            <Label htmlFor="unique" className="text-sm cursor-pointer">
              Enforce Uniqueness
            </Label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting} className="min-h-11 min-w-28">
            {isSubmitting ? t('common.save') + '...' : t('common.save')}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
