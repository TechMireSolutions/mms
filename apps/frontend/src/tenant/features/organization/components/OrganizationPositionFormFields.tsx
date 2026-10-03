/** Shared fields for organization position create/edit modal. */
import type { OrganizationPositionInsert, OrganizationPositionRecord } from '@mms/shared';
import { Field } from '@/components/ui/FormPrimitives';
import { FormSelect } from '@/components/ui/FormSelect';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';
import { useIndustryTerminology } from '@/tenant/hooks/useIndustryTerminology';

export interface OrganizationPositionFormFieldsProps {
  draft: OrganizationPositionInsert;
  editId?: string | null;
  departments: Array<{ id: string; name: string }>;
  designations: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; name: string }>;
  positions: OrganizationPositionRecord[];
  onDraftChange: (patch: Partial<OrganizationPositionInsert>) => void;
}

export function OrganizationPositionFormFields({
  draft,
  editId,
  departments,
  designations,
  locations,
  positions,
  onDraftChange,
}: OrganizationPositionFormFieldsProps): React.JSX.Element {
  const { t } = useTranslation();
  const terminology = useIndustryTerminology();

  return (
    <div className="space-y-3">
      <Field id="pos-code" label={t('organization.position.code')} required>
        <Input
          id="pos-code"
          value={draft.code}
          onChange={(e) => onDraftChange({ code: e.target.value })}
        />
      </Field>
      <Field id="pos-name" label={t('organization.position.name')} required>
        <Input
          id="pos-name"
          value={draft.name}
          onChange={(e) => onDraftChange({ name: e.target.value })}
        />
      </Field>
      <Field id="pos-dept" label={t('faculty.form.department')}>
        <FormSelect
          id="pos-dept"
          value={draft.departmentId ?? ''}
          onChange={(v) => onDraftChange({ departmentId: v || null })}
          options={[
            { value: '', label: t('common.notSpecified') },
            ...departments.map((d) => ({ value: d.id, label: d.name })),
          ]}
        />
      </Field>
      <Field id="pos-desig" label={t('faculty.designations.name')}>
        <FormSelect
          id="pos-desig"
          value={draft.designationId ?? ''}
          onChange={(v) => onDraftChange({ designationId: v || null })}
          options={[
            { value: '', label: t('common.notSpecified') },
            ...designations.map((d) => ({ value: d.id, label: d.name })),
          ]}
        />
      </Field>
      <Field id="pos-loc" label={terminology.locationLabel}>
        <FormSelect
          id="pos-loc"
          value={draft.locationId ?? ''}
          onChange={(v) => onDraftChange({ locationId: v || null })}
          options={[
            { value: '', label: t('common.notSpecified') },
            ...locations.map((l) => ({ value: l.id, label: l.name })),
          ]}
        />
      </Field>
      <Field id="pos-parent" label={t('organization.position.parent')}>
        <FormSelect
          id="pos-parent"
          value={draft.parentPositionId ?? ''}
          onChange={(v) => onDraftChange({ parentPositionId: v || null })}
          options={[
            { value: '', label: t('organization.position.root') },
            ...positions
              .filter((p) => p.id !== editId)
              .map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })),
          ]}
        />
      </Field>
      <Field id="pos-cap" label={t('organization.capacity')}>
        <Input
          id="pos-cap"
          inputMode="numeric"
          value={String(draft.capacity ?? 1)}
          onChange={(e) =>
            onDraftChange({
              capacity: Math.max(1, Number.parseInt(e.target.value, 10) || 1),
            })
          }
        />
      </Field>
    </div>
  );
}
