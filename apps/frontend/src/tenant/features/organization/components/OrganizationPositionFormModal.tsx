/**
 * @file OrganizationPositionFormModal.tsx
 * @description Create/edit organization positions (including reparent via parentPositionId).
 */

import { useEffect, useState } from 'react';
import {
  organizationPositionInsertSchema,
  type OrganizationPositionInsert,
  type OrganizationPositionTreeNode,
} from '@mms/shared';
import { FormModal } from '@/components/ui/FormModal';
import { Field } from '@/components/ui/FormPrimitives';
import { FormSelect } from '@/components/ui/FormSelect';
import { Input } from '@/components/ui/input';
import { notify } from '@/lib/notify';
import { useTranslation } from '@/hooks/useTranslation';
import {
  useCreatePosition,
  useOrganizationLocations,
  useOrganizationPositions,
  useUpdatePosition,
} from '@/tenant/hooks/collections/organization';
import {
  useFacultyDepartments,
  useFacultyDesignations,
} from '@/tenant/hooks/collections/faculty';

export interface OrganizationPositionFormModalProps {
  open: boolean;
  onClose: () => void;
  parent?: OrganizationPositionTreeNode | null;
  editNode?: OrganizationPositionTreeNode | null;
}

const EMPTY: OrganizationPositionInsert = {
  code: '',
  name: '',
  departmentId: null,
  designationId: null,
  locationId: null,
  parentPositionId: null,
  capacity: 1,
  sortOrder: 0,
  isActive: true,
};

export function OrganizationPositionFormModal({
  open,
  onClose,
  parent = null,
  editNode = null,
}: OrganizationPositionFormModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<OrganizationPositionInsert>(EMPTY);
  const createMutation = useCreatePosition();
  const updateMutation = useUpdatePosition();
  const { data: departments = [] } = useFacultyDepartments();
  const designationsQuery = useFacultyDesignations();
  const { data: locations = [] } = useOrganizationLocations({ enabled: open });
  const { data: positions = [] } = useOrganizationPositions({ enabled: open });

  useEffect(() => {
    if (!open) return;
    if (editNode) {
      setDraft({
        code: editNode.code,
        name: editNode.name,
        departmentId: editNode.departmentId ?? null,
        designationId: editNode.designationId ?? null,
        locationId: editNode.locationId ?? null,
        parentPositionId: editNode.parentPositionId ?? null,
        capacity: editNode.capacity,
        sortOrder: editNode.sortOrder ?? 0,
        isActive: editNode.isActive ?? true,
      });
      return;
    }
    setDraft({
      ...EMPTY,
      parentPositionId: parent?.id ?? null,
      departmentId: parent?.departmentId ?? null,
      designationId: parent?.designationId ?? null,
      locationId: parent?.locationId ?? null,
    });
  }, [open, editNode, parent]);

  async function handleSave() {
    const parsed = organizationPositionInsertSchema.safeParse(draft);
    if (!parsed.success) {
      notify.error(t('organization.position.validationFailed'));
      return;
    }
    try {
      if (editNode) {
        await updateMutation.mutateAsync({ id: editNode.id, data: parsed.data });
      } else {
        await createMutation.mutateAsync(parsed.data);
      }
      notify.success(t('organization.position.saved'));
      onClose();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t('organization.position.saveFailed'));
    }
  }

  const designationOptions = (designationsQuery.data ?? []).map((d) => ({
    value: d.id,
    label: d.name,
  }));

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={editNode ? t('organization.position.editTitle') : t('organization.position.addTitle')}
      onSave={() => void handleSave()}
      saving={createMutation.isPending || updateMutation.isPending}
    >
      <div className="space-y-3">
        <Field id="pos-code" label={t('organization.position.code')} required>
          <Input
            id="pos-code"
            value={draft.code}
            onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
          />
        </Field>
        <Field id="pos-name" label={t('organization.position.name')} required>
          <Input
            id="pos-name"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </Field>
        <Field id="pos-dept" label={t('faculty.form.department')}>
          <FormSelect
            id="pos-dept"
            value={draft.departmentId ?? ''}
            onChange={(v) => setDraft((d) => ({ ...d, departmentId: v || null }))}
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
            onChange={(v) => setDraft((d) => ({ ...d, designationId: v || null }))}
            options={[
              { value: '', label: t('common.notSpecified') },
              ...designationOptions,
            ]}
          />
        </Field>
        <Field id="pos-loc" label={t('organization.locations')}>
          <FormSelect
            id="pos-loc"
            value={draft.locationId ?? ''}
            onChange={(v) => setDraft((d) => ({ ...d, locationId: v || null }))}
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
            onChange={(v) => setDraft((d) => ({ ...d, parentPositionId: v || null }))}
            options={[
              { value: '', label: t('organization.position.root') },
              ...positions
                .filter((p) => p.id !== editNode?.id)
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
              setDraft((d) => ({
                ...d,
                capacity: Math.max(1, Number.parseInt(e.target.value, 10) || 1),
              }))
            }
          />
        </Field>
      </div>
    </FormModal>
  );
}
