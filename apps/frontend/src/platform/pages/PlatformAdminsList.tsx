import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail } from 'lucide-react';
import { formatDate, type PlatformUserProfile } from '@mms/shared';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import RouteStatusFallback from '@/components/routing/RouteStatusFallback';
import { ErrorState } from '@/components/ui/ErrorState';
import { SEMANTIC_BADGE } from '@/lib/semanticTone';
import { containerVariants, cardVariants } from '@/platform/lib/animations';
import { PlatformEditAdminAccessDialog } from '@/platform/components/PlatformEditAdminAccessDialog';
import { PlatformAdminDangerDialog } from '@/platform/components/PlatformAdminDangerDialog';

interface PlatformAdminsListProps {
  admins: PlatformUserProfile[] | undefined;
  loading: boolean;
  fetchError: boolean;
  onRetry: () => void;
}

type DangerMode = 'disable' | 'enable' | 'delete';

export function PlatformAdminsList({
  admins,
  loading,
  fetchError,
  onRetry,
}: PlatformAdminsListProps): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const [editingAdmin, setEditingAdmin] = useState<PlatformUserProfile | null>(null);
  const [dangerAdmin, setDangerAdmin] = useState<PlatformUserProfile | null>(null);
  const [dangerMode, setDangerMode] = useState<DangerMode>('disable');

  const openDanger = (admin: PlatformUserProfile, mode: DangerMode): void => {
    setDangerAdmin(admin);
    setDangerMode(mode);
  };

  return (
    <div className="lg:col-span-2 space-y-4 text-start">
      <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
        {t('platform.manageAdmins')}
      </h2>

      {loading ? (
        <RouteStatusFallback />
      ) : fetchError ? (
        <ErrorState title={t('apex.loadError')} onRetry={onRetry} compact />
      ) : admins && admins.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial={reducedMotion ? false : 'hidden'}
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {admins.map((admin) => {
              const isDisabled = Boolean(admin.disabledAt);
              return (
                <motion.div key={admin.id} variants={cardVariants} layout={!reducedMotion} className="h-full">
                  <Card
                    accentColor={admin.role === 'super_user' ? 'primary' : undefined}
                    className="p-6 space-y-3.5 text-start hover:border-primary/20 hover:scale-[1.01] h-full flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <p className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{admin.name}</p>
                        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
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
                      </div>
                      <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Mail className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
                        <span className="min-w-0 truncate">{admin.email}</span>
                      </div>
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
                          {!admin.permissions?.workspaces && !admin.permissions?.onboard ? (
                            <span className="text-xs text-muted-foreground">{t('platform.adminNoCapabilities')}</span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 mt-2">
                      {admin.createdAt ? (
                        <p className="text-xs text-muted-foreground/60 font-semibold">
                          {t('platform.profileMemberSince')}: {formatDate(admin.createdAt)}
                        </p>
                      ) : (
                        <span />
                      )}
                      {admin.role === 'admin' ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="min-h-11"
                            onClick={() => setEditingAdmin(admin)}
                          >
                            {t('platform.editAdminAccess')}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="min-h-11"
                            onClick={() => openDanger(admin, isDisabled ? 'enable' : 'disable')}
                          >
                            {t(isDisabled ? 'platform.enableAdmin' : 'platform.disableAdmin')}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="min-h-11"
                            onClick={() => openDanger(admin, 'delete')}
                          >
                            {t('platform.deleteAdmin')}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-border/30 rounded-2xl bg-muted/5">
          <p className="text-sm text-muted-foreground">{t('platform.noAdmins')}</p>
        </div>
      )}

      {editingAdmin ? (
        <PlatformEditAdminAccessDialog
          admin={editingAdmin}
          open={Boolean(editingAdmin)}
          onOpenChange={(open) => {
            if (!open) setEditingAdmin(null);
          }}
        />
      ) : null}

      {dangerAdmin ? (
        <PlatformAdminDangerDialog
          admin={dangerAdmin}
          mode={dangerMode}
          open={Boolean(dangerAdmin)}
          onOpenChange={(open) => {
            if (!open) setDangerAdmin(null);
          }}
        />
      ) : null}
    </div>
  );
}
