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
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notify';
import { useTranslation } from '@/hooks/useTranslation';
import {
  useCreatePosition,
  useDeletePosition,
  useOrganizationLocations,
  useOrganizationPositions,
  useRestorePosition,
  useUpdatePosition,
} from '@/tenant/hooks/collections/organization';
import {
  useFacultyDepartments,
  useFacultyDesignations,
} from '@/tenant/hooks/collections/faculty';
import { OrganizationPositionFormFields } from './OrganizationPositionFormFields';

export interface OrganizationPositionFormModalProps {
  open: boolean;
  onClose: () => void;
  parent?: OrganizationPositionTreeNode | null;
  editNode?: OrganizationPositionTreeNode | null;
  canDelete?: boolean;
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
  canDelete = false,
}: OrganizationPositionFormModalProps): React.JSX.Element {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<OrganizationPositionInsert>(EMPTY);
  const createMutation = useCreatePosition();
  const updateMutation = useUpdatePosition();
  const deleteMutation = useDeletePosition();
  const restoreMutation = useRestorePosition();
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

  async function handleArchive() {
    if (!editNode) return;
    try {
      await deleteMutation.mutateAsync(editNode.id);
      notify.archivedWithUndo(t('organization.position.deleted'), () => {
        void restoreMutation.mutateAsync(editNode.id);
      });
      onClose();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t('organization.position.deleteFailed'));
    }
  }

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={editNode ? t('organization.position.editTitle') : t('organization.position.addTitle')}
      onSave={() => void handleSave()}
      saving={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
      footerStart={
        editNode && canDelete ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 text-destructive"
            onClick={() => void handleArchive()}
          >
            {t('common.delete')}
          </Button>
        ) : undefined
      }
    >
      <OrganizationPositionFormFields
        draft={draft}
        editId={editNode?.id}
        departments={departments}
        designations={designationsQuery.data ?? []}
        locations={locations}
        positions={positions}
        onDraftChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
      />
    </FormModal>
  );
}
