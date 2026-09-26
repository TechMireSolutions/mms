import React from 'react';
import type { PlatformUserProfile } from '@mms/shared';
import { DetailSheet } from '@/components/common/DetailSheet';
import { PlatformEditAdminAccessDialog } from '@/platform/components/PlatformEditAdminAccessDialog';
import { PlatformAdminDangerDialog } from '@/platform/components/PlatformAdminDangerDialog';
import type { DangerMode } from '@/platform/components/admin/PlatformAdminsTableView';
import type { usePlatformUserDescriptor } from '@/platform/hooks/usePlatformUserDescriptor';

export interface PlatformAdminsDialogsProps {
  editingAdmin: PlatformUserProfile | null;
  onCloseEditing: () => void;
  dangerAdmin: PlatformUserProfile | null;
  dangerMode: DangerMode;
  onCloseDanger: () => void;
  inspectAdmin: PlatformUserProfile | null;
  onCloseInspect: () => void;
  descriptor: ReturnType<typeof usePlatformUserDescriptor>;
}

export function PlatformAdminsDialogs({
  editingAdmin,
  onCloseEditing,
  dangerAdmin,
  dangerMode,
  onCloseDanger,
  inspectAdmin,
  onCloseInspect,
  descriptor,
}: PlatformAdminsDialogsProps): React.JSX.Element {
  return (
    <>
      {editingAdmin ? (
        <PlatformEditAdminAccessDialog
          admin={editingAdmin}
          open={Boolean(editingAdmin)}
          onOpenChange={(open) => {
            if (!open) onCloseEditing();
          }}
        />
      ) : null}

      {dangerAdmin ? (
        <PlatformAdminDangerDialog
          admin={dangerAdmin}
          mode={dangerMode}
          open={Boolean(dangerAdmin)}
          onOpenChange={(open) => {
            if (!open) onCloseDanger();
          }}
        />
      ) : null}

      <DetailSheet<PlatformUserProfile>
        open={Boolean(inspectAdmin)}
        onClose={onCloseInspect}
        entityType="platformUsers"
        descriptor={descriptor}
        entity={inspectAdmin ?? undefined}
        title={inspectAdmin?.name ?? 'Admin'}
      />
    </>
  );
}
