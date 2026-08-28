import React from 'react';
import { Mail } from 'lucide-react';
import { formatDate, type PlatformUserProfile } from '@mms/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ModuleTableHeaderCell } from '@/components/ui/ModuleTableHeaderCell';
import { useTranslation } from '@/hooks/useTranslation';
import { useVerifyPlatformAdminEmail } from '@/platform/hooks/usePlatformAdmins';
import {
  PlatformAdminStatusBadges,
  PlatformAdminPermissionsBadges,
} from '@/platform/components/admin/PlatformAdminBadges';
import { PlatformAdminActionButtons } from '@/platform/components/admin/PlatformAdminActionButtons';

interface PlatformAdminTableProps {
  admins: PlatformUserProfile[];
  onEditAccess: (admin: PlatformUserProfile) => void;
  onToggleStatus: (admin: PlatformUserProfile, mode: 'disable' | 'enable') => void;
  onDelete: (admin: PlatformUserProfile) => void;
}

export function PlatformAdminTable({
  admins,
  onEditAccess,
  onToggleStatus,
  onDelete,
}: PlatformAdminTableProps): React.JSX.Element {
  const { t } = useTranslation();
  const verifyEmailMutation = useVerifyPlatformAdminEmail();

  return (
    <div className="rounded-xl border border-border/40 overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/30 hover:bg-muted/30">
            <ModuleTableHeaderCell columnKey="admin" className="px-4 py-3">
              {t('platform.manageAdmins')}
            </ModuleTableHeaderCell>
            <ModuleTableHeaderCell columnKey="role" className="px-4 py-3 w-40">
              {t('platform.roleAdmin')}
            </ModuleTableHeaderCell>
            <ModuleTableHeaderCell columnKey="permissions" className="px-4 py-3 w-48">
              {t('platform.adminPermissionsLabel')}
            </ModuleTableHeaderCell>
            <ModuleTableHeaderCell columnKey="actions" className="px-4 py-3 w-32 text-end">
              {t('common.actions')}
            </ModuleTableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/50">
          {admins.map((admin) => (
            <TableRow
              key={admin.id}
              className="group hover:bg-muted/30 transition-colors"
            >
              <TableCell className="px-4 py-3 align-top">
                <div className="space-y-1">
                  <p className="font-bold text-foreground">{admin.name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" aria-hidden />
                    {admin.email}
                  </div>
                  {admin.createdAt ? (
                    <p className="text-2xs text-muted-foreground/60 font-semibold mt-1">
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
              <TableCell className="px-4 py-3 align-top text-end">
                <PlatformAdminActionButtons
                  admin={admin}
                  onEditAccess={onEditAccess}
                  onToggleStatus={onToggleStatus}
                  onDelete={onDelete}
                  verifyPending={verifyEmailMutation.isPending}
                  onVerifyEmail={(adminId) => verifyEmailMutation.mutate(adminId)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

