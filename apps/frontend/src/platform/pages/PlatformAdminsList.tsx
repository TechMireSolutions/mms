import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail } from 'lucide-react';
import { formatDate } from '@mms/shared';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useTranslation } from '@/hooks/useTranslation';
import RouteStatusFallback from '@/components/routing/RouteStatusFallback';
import { ErrorState } from '@/components/ui/ErrorState';
import { containerVariants, cardVariants } from '@/platform/lib/animations';
import type { PlatformUserProfile } from '@mms/shared';

interface PlatformAdminsListProps {
  admins: PlatformUserProfile[] | undefined;
  loading: boolean;
  fetchError: boolean;
  onRetry: () => void;
}

export function PlatformAdminsList({
  admins,
  loading,
  fetchError,
  onRetry,
}: PlatformAdminsListProps): React.JSX.Element {
  const { t } = useTranslation();

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
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {admins.map((admin) => (
              <motion.div key={admin.id} variants={cardVariants} layout className="h-full">
                <Card
                  accentColor={admin.role === 'super_user' ? 'primary' : undefined}
                  className="p-6 space-y-3.5 text-start hover:border-primary/20 hover:scale-[1.01] h-full flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <p className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{admin.name}</p>
                      <StatusBadge
                        status={admin.role}
                        config={{
                          super_user: { label: t('platform.roleSuperUser'), cls: 'bg-primary/10 text-primary border-primary/20' },
                          admin: { label: t('platform.roleAdmin'), cls: 'bg-muted text-muted-foreground border-border' },
                        }}
                        size="sm"
                      />
                    </div>
                    <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Mail className="w-4 h-4 shrink-0 opacity-80" aria-hidden />
                      <span className="min-w-0 truncate">{admin.email}</span>
                    </div>
                  </div>
                  {admin.createdAt ? (
                    <p className="text-xs text-muted-foreground/60 font-semibold pt-2 border-t border-border/40 mt-2">
                      {t('platform.profileMemberSince')}: {formatDate(admin.createdAt)}
                    </p>
                  ) : null}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-border/30 rounded-2xl bg-muted/5">
          <p className="text-sm text-muted-foreground">{t('platform.noAdmins')}</p>
        </div>
      )}
    </div>
  );
}
