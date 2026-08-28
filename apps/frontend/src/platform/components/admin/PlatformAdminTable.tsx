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
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { useVerifyPlatformAdminEmail } from '@/platform/hooks/usePlatformAdmins';

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
          {admins.map((admin) => {
            const isDisabled = Boolean(admin.disabledAt);
            return (
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
                  <div className="flex flex-wrap gap-1.5">
                    {isDisabled ? (
                      <StatusBadge
                        status="disabled"
                        config={{
                          disabled: {
                            label: t('platform.adminDisabled'),
                            cls: SEMANTIC_BADGE.destructive,
                          },
                        }}
                        size="sm"
                      />
                    ) : null}
                    <StatusBadge
                      status={admin.role}
                      config={{
                        super_user: {
                          label: t('platform.roleSuperUser'),
                          cls: 'bg-primary/10 text-primary border-primary/20',
                        },
                        admin: { label: t('platform.roleAdmin'), cls: SEMANTIC_BADGE.muted },
                      }}
                      size="sm"
                    />
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 align-top">
                  {admin.role === 'admin' ? (
                    <div className="flex flex-wrap gap-1.5">
                      {admin.permissions?.workspaces ? (
                        <StatusBadge
                          status="workspaces"
                          config={{
                            workspaces: {
                              label: t('platform.permWorkspaces'),
                              cls: 'bg-primary/10 text-primary border-primary/20',
                            },
                          }}
                          size="sm"
                        />
                      ) : null}
                      {admin.permissions?.onboard ? (
                        <StatusBadge
                          status="onboard"
                          config={{
                            onboard: {
                              label: t('platform.permOnboard'),
                              cls: 'bg-primary/10 text-primary border-primary/20',
                            },
                          }}
                          size="sm"
                        />
                      ) : null}
                      {admin.permissions?.settings ? (
                        <StatusBadge
                          status="settings"
                          config={{
                            settings: {
                              label: t('platform.permSettings'),
                              cls: 'bg-primary/10 text-primary border-primary/20',
                            },
                          }}
                          size="sm"
                        />
                      ) : null}
                      {admin.permissions?.admins ? (
                        <StatusBadge
                          status="admins"
                          config={{
                            admins: {
                              label: t('platform.permAdmins'),
                              cls: 'bg-primary/10 text-primary border-primary/20',
                            },
                          }}
                          size="sm"
                        />
                      ) : null}
                      {admin.permissions?.system ? (
                        <StatusBadge
                          status="system"
                          config={{
                            system: {
                              label: t('platform.permSystem'),
                              cls: 'bg-primary/10 text-primary border-primary/20',
                            },
                          }}
                          size="sm"
                        />
                      ) : null}
                      {!admin.permissions?.workspaces &&
                      !admin.permissions?.onboard &&
                      !admin.permissions?.settings &&
                      !admin.permissions?.admins &&
                      !admin.permissions?.system ? (
                        <span className="text-xs text-muted-foreground">{t('platform.adminNoCapabilities')}</span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3 align-top text-end">
                  {admin.role === 'admin' ? (
                    <div className="flex items-center justify-end gap-2">
                      {!admin.emailVerifiedAt ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={verifyEmailMutation.isPending}
                          className="min-h-11 rounded-lg font-bold border-success/40 bg-success/10 text-success hover:bg-success/20 hover:border-success/60"
                          onClick={() => verifyEmailMutation.mutate(admin.id)}
                        >
                          {t('users.actionVerifyEmail')}
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-11 rounded-lg font-bold"
                        onClick={() => onEditAccess(admin)}
                      >
                        {t('platform.editAdminAccess')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-11 rounded-lg font-bold"
                        onClick={() => onToggleStatus(admin, isDisabled ? 'enable' : 'disable')}
                      >
                        {t(isDisabled ? 'platform.enableAdmin' : 'platform.disableAdmin')}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="min-h-11 rounded-lg font-bold"
                        onClick={() => onDelete(admin)}
                      >
                        {t('platform.deleteAdmin')}
                      </Button>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
