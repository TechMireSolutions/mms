import React, { useId, useState } from 'react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

// 1. Strict write schema (aligned with @mms/shared)
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
  onOpenChange: (open: boolean) => void;
  initialData?: TemplateFormData | null;
  onSubmit: (data: TemplateFormData) => Promise<void>;
}

/**
 * Canonical static FormModal template.
 * Uses native React 19 prop passing, useId() accessibility, and awaits mutateAsync before closing.
 */
export function TemplateFormModal({
  open,
  onOpenChange,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = templateFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      setSubmitting(true);
      // Invariant: await mutation resolution before dismissing modal dialog
      await onSubmit(result.data);
      onOpenChange(false);
    } catch (err: unknown) {
      // Handled by global toast / mutation boundary
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? t('common.edit') : t('common.create')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor={nameId}>{t('fields.name')}</Label>
            <Input
              id={nameId}
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-destructive text-xs">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={codeId}>{t('fields.code')}</Label>
            <Input
              id={codeId}
              value={formData.code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, code: e.target.value }))
              }
              aria-invalid={!!errors.code}
            />
            {errors.code && (
              <p className="text-destructive text-xs">{errors.code}</p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
