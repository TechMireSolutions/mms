import React, { useId, useState } from 'react';
import { z } from 'zod';
import { FormModal } from '@/components/ui/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldErrorMessage } from '@/components/ui/FormPrimitives';
import { useTranslation } from '@/hooks/useTranslation';

// 1. Strict write schema (aligned 1:1 with the @mms/shared write DTO)
export const templateFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    code: z.string().trim().min(1, 'Code is required'),
    description: z.string().trim().max(500).optional(),
  })
  .strict();

export type TemplateFormData = z.infer<typeof templateFormSchema>;

export interface TemplateFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: TemplateFormData | null;
  onSubmit: (data: TemplateFormData) => Promise<void>;
}

/**
 * Canonical static FormModal template.
 *
 * Uses the shared `FormModal` shell (never a raw Radix Dialog — that is reserved
 * for confirm/preview per `mms-form-architecture.md` §1), React 19 native props,
 * `useId()` for accessible control/label pairs, and awaits the mutation before
 * the modal is dismissed.
 */
export function TemplateFormModal({
  open,
  onClose,
  initialData,
  onSubmit,
}: TemplateFormModalProps) {
  const { t } = useTranslation();
  const nameId = useId();
  const codeId = useId();
  const descId = useId();

  const [formData, setFormData] = useState<TemplateFormData>(() => ({
    name: initialData?.name ?? '',
    code: initialData?.code ?? '',
    description: initialData?.description ?? '',
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // FormModal owns the footer buttons and calls onSave(); validation runs there.
  const handleSave = async () => {
    setErrors({});

    const result = templateFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        if (issue.path[0]) fieldErrors[issue.path[0].toString()] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      // Invariant: await the mutation before the shell closes the dialog.
      await onSubmit(result.data);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={initialData ? t('common.edit') : t('common.create')}
      size="md"
      saving={submitting}
      saveDisabled={submitting}
      onSave={handleSave}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={nameId}>{t('fields.name')}</Label>
          <Input
            id={nameId}
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? `${nameId}-error` : undefined}
          />
          {errors.name && <FieldErrorMessage id={`${nameId}-error`} message={errors.name} />}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={codeId}>{t('fields.code')}</Label>
          <Input
            id={codeId}
            value={formData.code}
            onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
            aria-invalid={errors.code ? true : undefined}
            aria-describedby={errors.code ? `${codeId}-error` : undefined}
          />
          {errors.code && <FieldErrorMessage id={`${codeId}-error`} message={errors.code} />}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={descId}>{t('fields.description')}</Label>
          <Input
            id={descId}
            value={formData.description ?? ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          />
        </div>
      </div>
    </FormModal>
  );
}
