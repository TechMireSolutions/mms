/** Locations list with create/edit/soft-delete for multi-branch sites. */
import { useState } from 'react';
import {
  LOCATION_TYPES,
  organizationLocationInsertSchema,
  type OrganizationLocationInsert,
  type OrganizationLocationRecord,
} from '@mms/shared';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormModal } from '@/components/ui/FormModal';
import { Field } from '@/components/ui/FormPrimitives';
import { FormSelect } from '@/components/ui/FormSelect';
import { Input } from '@/components/ui/input';
import { notify } from '@/lib/notify';
import { useTranslation } from '@/hooks/useTranslation';
import {
  useCreateLocation, useDeleteLocation, useOrganizationLocations, useUpdateLocation,
} from '@/tenant/hooks/collections/organization';

const EMPTY = {
  code: '', name: '', type: 'branch' as const, addressLine1: null, city: null,
  isHeadOffice: false, isActive: true, sortOrder: 0,
} satisfies OrganizationLocationInsert;

export function OrganizationLocationsPanel({ canWrite = true }: { canWrite?: boolean }): React.JSX.Element {
  const { t } = useTranslation();
  const { data: locations = [] } = useOrganizationLocations();
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();
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
      if (edit) {
        await updateMutation.mutateAsync({ id: edit.id, data: parsed.data });
      } else {
        await createMutation.mutateAsync(parsed.data);
      }
      notify.success(t('organization.location.saved'));
      setOpen(false);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t('organization.location.saveFailed'));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      notify.success(t('organization.location.deleted'));
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t('organization.location.deleteFailed'));
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm text-foreground">{t('organization.locations')}</h3>
          <p className="text-xs text-muted-foreground">{t('organization.locationsHint')}</p>
        </div>
        {canWrite ? (
          <Button type="button" size="sm" className="min-h-11 gap-1.5" onClick={openCreate}>
            <Plus className="size-3.5" aria-hidden />
            {t('common.add')}
          </Button>
        ) : null}
      </div>

      {locations.length === 0 ? (
        <EmptyState title={t('organization.locationsEmpty')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="p-3 rounded-md border border-border bg-background space-y-2 text-start"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {loc.code}
                </span>
                <span className="text-[11px] font-medium text-primary">{loc.type}</span>
              </div>
              <h4 className="font-semibold text-sm text-foreground">{loc.name}</h4>
              {loc.city || loc.addressLine1 ? (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {[loc.addressLine1, loc.city, loc.region].filter(Boolean).join(', ')}
                </p>
              ) : null}
              {canWrite ? (
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={() => openEdit(loc)}>
                    {t('common.edit')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="min-h-11 text-destructive"
                    onClick={() => void handleDelete(loc.id)}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <FormModal
        open={open}
        onClose={() => setOpen(false)}
        title={edit ? t('organization.location.editTitle') : t('organization.location.addTitle')}
        onSave={() => void handleSave()}
        saving={createMutation.isPending || updateMutation.isPending}
      >
        <div className="space-y-3">
          <Field id="loc-code" label={t('organization.location.code')} required>
            <Input id="loc-code" value={draft.code} onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))} />
          </Field>
          <Field id="loc-name" label={t('organization.location.name')} required>
            <Input id="loc-name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          </Field>
          <Field id="loc-type" label={t('organization.location.type')}>
            <FormSelect
              id="loc-type"
              value={draft.type}
              onChange={(v) => setDraft((d) => ({ ...d, type: v as typeof draft.type }))}
              options={LOCATION_TYPES.map((type) => ({ value: type, label: type }))}
            />
          </Field>
          <Field id="loc-addr" label={t('organization.location.addressLine1')}>
            <Input
              id="loc-addr"
              value={draft.addressLine1 ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, addressLine1: e.target.value || null }))}
            />
          </Field>
          <Field id="loc-city" label={t('organization.location.city')}>
            <Input
              id="loc-city"
              value={draft.city ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value || null }))}
            />
          </Field>
        </div>
      </FormModal>
    </div>
  );
}
