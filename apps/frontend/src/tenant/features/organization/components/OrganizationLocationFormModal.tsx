/** Create/edit form modal for organization locations. */
import {
  LOCATION_TYPES,
  type OrganizationLocationInsert,
} from '@mms/shared';
import { FormModal } from '@/components/ui/FormModal';
import { Field } from '@/components/ui/FormPrimitives';
import { FormSelect } from '@/components/ui/FormSelect';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';

export interface OrganizationLocationFormModalProps {
  open: boolean;
  isEdit: boolean;
  draft: OrganizationLocationInsert;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onDraftChange: (patch: Partial<OrganizationLocationInsert>) => void;
}

export function OrganizationLocationFormModal({
  open,
  isEdit,
  draft,
  saving,
  onClose,
  onSave,
  onDraftChange,
}: OrganizationLocationFormModalProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={isEdit ? t('organization.location.editTitle') : t('organization.location.addTitle')}
      onSave={onSave}
      saving={saving}
    >
      <div className="space-y-3">
        <Field id="loc-code" label={t('organization.location.code')} required>
          <Input
            id="loc-code"
            value={draft.code}
            onChange={(e) => onDraftChange({ code: e.target.value })}
          />
        </Field>
        <Field id="loc-name" label={t('organization.location.name')} required>
          <Input
            id="loc-name"
            value={draft.name}
            onChange={(e) => onDraftChange({ name: e.target.value })}
          />
        </Field>
        <Field id="loc-type" label={t('organization.location.type')}>
          <FormSelect
            id="loc-type"
            value={draft.type}
            onChange={(v) => onDraftChange({ type: v as typeof draft.type })}
            options={LOCATION_TYPES.map((type) => ({ value: type, label: type }))}
          />
        </Field>
        <Field id="loc-addr" label={t('organization.location.addressLine1')}>
          <Input
            id="loc-addr"
            value={draft.addressLine1 ?? ''}
            onChange={(e) => onDraftChange({ addressLine1: e.target.value || null })}
          />
        </Field>
        <Field id="loc-city" label={t('organization.location.city')}>
          <Input
            id="loc-city"
            value={draft.city ?? ''}
            onChange={(e) => onDraftChange({ city: e.target.value || null })}
          />
        </Field>
      </div>
    </FormModal>
  );
}
