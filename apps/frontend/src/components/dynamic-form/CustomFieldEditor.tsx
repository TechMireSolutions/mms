import { useForm, FormProvider, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customFieldConfigSchema, type CustomFieldConfig, FIELD_TYPES_META } from '@mms/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/FormSelect';
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
    resolver: zodResolver(customFieldConfigSchema) as unknown as Resolver<CustomFieldConfig>,
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
            {t('dfs.editor.fieldLabel')}
          </Label>
          <Input id="label" {...methods.register('label')} className="min-h-11 mt-1" />
          {methods.formState.errors.label && (
            <FieldErrorMessage message={methods.formState.errors.label.message} />
          )}
        </div>

        <div>
          <Label htmlFor="type" className="text-sm font-medium">
            {t('dfs.editor.fieldType')}
          </Label>
          <Controller
            name="type"
            control={methods.control}
            render={({ field: { onChange, value } }) => (
              <FormSelect
                id="type"
                name="type"
                aria-label={t('dfs.editor.fieldType')}
                value={value ?? 'text'}
                onChange={onChange}
                disabled={!!initialData?.hasData}
                options={Object.keys(FIELD_TYPES_META).map((typeKey) => ({
                  value: typeKey,
                  label: t(FIELD_TYPES_META[typeKey as keyof typeof FIELD_TYPES_META].displayLabelKey),
                }))}
                className="mt-1"
              />
            )}
          />
          {initialData?.hasData && (
            <p className="text-xs text-amber-600 mt-1">
              {t('dfs.editor.typeLocked')}
            </p>
          )}
        </div>

        {typeMeta?.hasOptions && (
          <div>
            <Label htmlFor="options" className="text-sm font-medium">
              {t('dfs.editor.optionsLabel')}
            </Label>
            <Input
              id="options"
              placeholder={t('dfs.editor.optionsPlaceholder')}
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
              {t('dfs.editor.required')}
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="unique"
              checked={methods.watch('unique')}
              onCheckedChange={(c) => methods.setValue('unique', c === true)}
            />
            <Label htmlFor="unique" className="text-sm cursor-pointer">
              {t('dfs.editor.unique')}
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
