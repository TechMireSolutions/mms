import { useState, type ReactNode } from 'react';
import {
  organizationLocationInsertSchema,
  type OrganizationLocationInsert,
} from '@mms/shared';
import { notify } from '@/lib/notify';
import { useTranslation } from '@/hooks/useTranslation';
import { useCreateLocation } from '@/tenant/hooks/collections/organization';
import { FacultyCatalogCreateOverlays } from '@/tenant/features/faculty/components/FacultyCatalogCreateOverlays';
import { useFacultyFormCatalogQuickCreate } from '@/tenant/features/faculty/hooks/useFacultyFormCatalogQuickCreate';
import { OrganizationLocationFormModal } from '@/tenant/features/organization/components/OrganizationLocationFormModal';

const EMPTY_LOCATION: OrganizationLocationInsert = {
  code: '',
  name: '',
  type: 'branch',
  addressLine1: null,
  city: null,
  isHeadOffice: false,
  isActive: true,
  sortOrder: 0,
};

export interface OrganizationPositionCatalogOverlaysProps {
  onSelectDepartment: (departmentId: string) => void;
  onSelectDesignation: (designationId: string) => void;
  onSelectLocation: (locationId: string) => void;
  children: (api: {
    childOpen: boolean;
    openAddDepartment: () => void;
    openAddDesignation: () => void;
    openAddLocation: () => void;
  }) => ReactNode;
}

/** Nested catalog create chrome for position form department/designation/location FKs. */
export function OrganizationPositionCatalogOverlays({
  onSelectDepartment,
  onSelectDesignation,
  onSelectLocation,
  children,
}: OrganizationPositionCatalogOverlaysProps): React.JSX.Element {
  const { t } = useTranslation();
  const catalogCreate = useFacultyFormCatalogQuickCreate();
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationDraft, setLocationDraft] = useState<OrganizationLocationInsert>(EMPTY_LOCATION);
  const createLocation = useCreateLocation();
  const childOpen = catalogCreate.createDepartmentOpen
    || catalogCreate.createDesignationOpen
    || locationOpen;

  async function handleSaveLocation() {
    const parsed = organizationLocationInsertSchema.safeParse(locationDraft);
    if (!parsed.success) {
      notify.error(t('organization.location.validationFailed'));
      return;
    }
    try {
      const created = await createLocation.mutateAsync(parsed.data);
      onSelectLocation(created.id);
      notify.success(t('organization.location.saved'));
      setLocationOpen(false);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : t('organization.location.saveFailed'));
    }
  }

  return (
    <>
      {children({
        childOpen,
        openAddDepartment: () => catalogCreate.openCreateDepartment(null),
        openAddDesignation: () => catalogCreate.openCreateDesignation(null),
        openAddLocation: () => {
          setLocationDraft(EMPTY_LOCATION);
          setLocationOpen(true);
        },
      })}

      <FacultyCatalogCreateOverlays
        createDepartmentOpen={catalogCreate.createDepartmentOpen}
        onCloseDepartment={catalogCreate.closeDepartment}
        createDesignationOpen={catalogCreate.createDesignationOpen}
        onCloseDesignation={catalogCreate.closeDesignation}
        onDepartmentCreated={(department) => {
          catalogCreate.applyDepartmentCreated(department, (_rowKey, patch) => {
            onSelectDepartment(patch.departmentId);
          });
        }}
        onDesignationCreated={(designation) => {
          catalogCreate.applyDesignationCreated(designation, (_rowKey, patch) => {
            onSelectDesignation(patch.designationId);
          });
        }}
      />

      <OrganizationLocationFormModal
        open={locationOpen}
        isEdit={false}
        draft={locationDraft}
        saving={createLocation.isPending}
        onClose={() => setLocationOpen(false)}
        onSave={() => void handleSaveLocation()}
        onDraftChange={(patch) => setLocationDraft((d) => ({ ...d, ...patch }))}
      />
    </>
  );
}
