/**
 * @file useOrganizationLocationsPanel.ts
 * @description State + mutations for Organization locations panel.
 */

import { useState } from 'react';
import {
  organizationLocationInsertSchema,
  type OrganizationLocationInsert,
  type OrganizationLocationRecord,
} from '@mms/shared';
import { notify } from '@/lib/notify';
import { useTranslation } from '@/hooks/useTranslation';
import {
  useCreateLocation,
  useDeleteLocation,
  useOrganizationLocations,
  useRestoreLocation,
  useUpdateLocation,
} from '@/tenant/hooks/collections/organization';

const EMPTY = {
  code: '', name: '', type: 'branch' as const, addressLine1: null, city: null,
  isHeadOffice: false, isActive: true, sortOrder: 0,
} satisfies OrganizationLocationInsert;

export function useOrganizationLocationsPanel(viewingDeleted: boolean) {
  const { t } = useTranslation();
  const { data: locations = [] } = useOrganizationLocations({ includeDeleted: viewingDeleted });
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();
  const restoreMutation = useRestoreLocation();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<OrganizationLocationRecord | null>(null);
  const [draft, setDraft] = useState<OrganizationLocationInsert>(EMPTY);

  function openCreate() {
    setEdit(null);
    setDraft(EMPTY);
    setOpen(true);
  }

  function openEdit(loc: OrganizationLocationRecord) {
    setEdit(loc);
    setDraft({
      code: loc.code,
      name: loc.name,
      type: loc.type,
      parentLocationId: loc.parentLocationId ?? null,
      addressLine1: loc.addressLine1 ?? null,
      addressLine2: loc.addressLine2 ?? null,
      city: loc.city ?? null,
      region: loc.region ?? null,
      country: loc.country ?? null,
      postalCode: loc.postalCode ?? null,
      timezone: loc.timezone ?? null,
      isHeadOffice: loc.isHeadOffice ?? false,
      isActive: loc.isActive ?? true,
      sortOrder: loc.sortOrder ?? 0,
    });
    setOpen(true);
  }

  async function handleSave() {
    const parsed = organizationLocationInsertSchema.safeParse(draft);
    if (!parsed.success) {
      notify.error(t('organization.location.validationFailed'));
      return;
    }
    try {
      if (edit) await updateMutation.mutateAsync({ id: edit.id, data: parsed.data });
      else await createMutation.mutateAsync(parsed.data);
      notify.success(t('organization.location.saved'));
      setOpen(false);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t('organization.location.saveFailed'));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      notify.archivedWithUndo(t('organization.location.deleted'), () => {
        void restoreMutation.mutateAsync(id);
      });
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t('organization.location.deleteFailed'));
    }
  }

  async function handleRestore(id: string) {
    try {
      await restoreMutation.mutateAsync(id);
      notify.success(t('organization.location.restored'));
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t('organization.location.restoreFailed'));
    }
  }

  return {
    locations,
    open,
    draft,
    isEdit: Boolean(edit),
    saving: createMutation.isPending || updateMutation.isPending,
    setOpen,
    setDraft,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
    handleRestore,
  };
}
