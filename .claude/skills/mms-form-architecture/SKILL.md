---
name: mms-form-architecture
description: Implements static FormModal forms with shared Zod DTOs, React 19 defaults, decimal-as-string money, tenant RLS saves, and authenticated multipart uploads. Use when building or auditing create/edit forms, FormModal tabs, DatePicker/TimePicker/DateTimePicker/phone fields, or upload flows. Do NOT use for table/card directory views (use mms-module-work), multi-tier module tabs (use mms-module-page), or accessibility audits (use mms-a11y-smoke).
---

# MMS Form Architecture Skill

**Rule (norms SSOT):** `mms-form-architecture.md` · `mms-core.md` · `mms-ui-ux-design.md` §4 · `mms-performance.md` §2.
**Workflows:** `/feature-module` · **Manifest:** `.agent/skills-manifest.json`

## Anti-Patterns & Banned Operations

- ❌ **NEVER use Server Actions or `useActionState`**: All MMS writes run via client-side `apiClient` / `apiContract` with cookie authentication.
- ❌ **NEVER use `forwardRef` in newly authored components**: React 19 supports `ref` directly as a component prop.
- ❌ **NEVER accept client soft-delete fields**: Strip `deletedAt`, `deletedBy`, `deletionReason` on create/update schemas.
- ❌ **NEVER assign soft-deleted foreign keys**: Enforce active foreign key guarding (`deleted_at IS NULL`).
- ❌ **NEVER buffer uploads into memory**: Stream files directly using Fastify `@fastify/multipart`.

## Canonical FormModal Implementation Pattern

```tsx
import { useId, useState } from 'react';
import { FormModal } from '@/components/ui/FormModal';
import { FORM_INPUT, FORM_ERROR } from '@/components/ui/formStyles';
import { FieldErrorMessage } from '@/components/ui/FieldErrorMessage';
import { useTranslation } from '@/lib/i18n';

interface EntityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InsertEntityDto) => Promise<void>;
  initialData?: Partial<InsertEntityDto>;
}

export function EntityFormModal({ isOpen, onClose, onSubmit, initialData }: EntityFormModalProps) {
  const { t } = useTranslation();
  const nameId = useId();
  const [formData, setFormData] = useState(initialData ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData as InsertEntityDto);
      onClose();
    } catch (err: unknown) {
      // Map Zod or backend errors to field state
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('entities.createTitle')}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor={nameId} className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('common.name')}
          </label>
          <input
            id={nameId}
            type="text"
            className={FORM_INPUT}
            value={formData.name ?? ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          {errors.name && <FieldErrorMessage error={errors.name} />}
        </div>
      </div>
    </FormModal>
  );
}
```

## Verification Checklist

```
- [ ] FormModal with React 19 ref-as-prop and useId() accessibility pairs
- [ ] No Server Actions or form action= posts
- [ ] Shared Zod write schema validates inputs strictly (.strict())
- [ ] Dates validated with isoDateSchema / isoDateOrEmptySchema
- [ ] Active foreign keys verified (deleted_at IS NULL)
- [ ] Focus-return restored to opener on dialog close
- [ ] Run: pnpm typecheck && cd apps/frontend && pnpm lint
```
