import React from 'react';
import { Mail } from 'lucide-react';
import type { PlatformUserProfile } from '@mms/shared';
import { formatDate } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ModuleWorkTableHeader } from '@/components/ui/ModuleWorkTableHeader';
import { PlatformAdminStatusBadges, PlatformAdminPermissionsBadges } from '@/platform/components/admin/PlatformAdminBadges';
import { PlatformAdminActionButtons } from '@/platform/components/admin/PlatformAdminActionButtons';
import type { usePlatformUserDescriptor } from '@/platform/hooks/usePlatformUserDescriptor';

export type DangerMode = 'disable' | 'enable' | 'delete';

export interface PlatformAdminsTableViewProps {
  admins: PlatformUserProfile[];
  descriptor: ReturnType<typeof usePlatformUserDescriptor>;
  onInspect: (admin: PlatformUserProfile) => void;
  onEditAccess: (admin: PlatformUserProfile) => void;
  onToggleStatus: (admin: PlatformUserProfile, mode: DangerMode) => void;
  onDelete: (admin: PlatformUserProfile) => void;
  verifyPending: boolean;
  onVerifyEmail: (adminId: string) => void;
}

export function PlatformAdminsTableView({
  admins,
  descriptor,
  onInspect,
  onEditAccess,
  onToggleStatus,
  onDelete,
  verifyPending,
  onVerifyEmail,
}: PlatformAdminsTableViewProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <ModuleWorkTableHeader
            columns={descriptor.getTableColumns().map((col) => ({
              id: col.id,
              label: col.label,
              sortField: col.id,
              headerClassName: col.id === 'name' ? '' : 'w-40',
            }))}
            getColumnWidth={() => undefined}
            setColumnWidth={() => {}}
            actionsLabel={t('common.actions')}
          />
          <TableBody className="divide-y divide-border/50">
            {admins.map((admin) => (
              <TableRow
                key={admin.id}
                className="group hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => onInspect(admin)}
              >
                <TableCell className="px-4 py-3 align-top">
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">{admin.name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" aria-hidden />
                      <span dir="ltr">{admin.email}</span>
                    </div>
                    {admin.createdAt ? (
                      <p className="text-2xs text-muted-foreground font-semibold mt-1">
                        {t('platform.profileMemberSince')}: {formatDate(admin.createdAt)}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 align-top">
                  <PlatformAdminStatusBadges admin={admin} />
                </TableCell>
                <TableCell className="px-4 py-3 align-top">
                  <PlatformAdminPermissionsBadges admin={admin} />
                </TableCell>
                <TableCell className="px-4 py-3 align-top text-end" onClick={(e) => e.stopPropagation()}>
                  <PlatformAdminActionButtons
                    admin={admin}
                    onEditAccess={onEditAccess}
                    onToggleStatus={onToggleStatus}
                    onDelete={onDelete}
                    verifyPending={verifyPending}
                    onVerifyEmail={onVerifyEmail}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
