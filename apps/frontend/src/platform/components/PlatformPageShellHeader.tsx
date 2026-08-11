import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Users, User, ShieldAlert } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { ROUTES } from '@/lib/config/routes';
import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { cn } from '@/lib/utils';

import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';

export function PlatformPageShellHeader(): React.JSX.Element | null {
  const { t } = useTranslation();
  const { platformUser, platformLogout } = usePlatformAuth();
  const { isPlatformAuthenticated, isSuperUser, canWorkspaces } = usePlatformPermissions();
  const location = useLocation();
  const homeNavLabel = canWorkspaces ? t('platform.manageMadrasas') : t('platform.consoleTitle');

  if (!isPlatformAuthenticated) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to={ROUTES.home} className="group flex min-h-11 min-w-11 items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent border border-primary/25 shadow-sm group-hover:scale-105 group-hover:shadow group-hover:border-primary/45 transition-all duration-300">
            <span className="font-display text-lg font-black text-primary transition-transform group-hover:rotate-6">م</span>
          </div>
          <div className="flex flex-col text-start">
            <span className="text-sm font-black tracking-wider uppercase text-foreground leading-none">
              {t('entry.productName')}
            </span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">
              {t('platform.consoleTitle')}
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-2" aria-label={t('platform.navAria')}>
          <Button asChild variant="ghost" size="sm" className={cn(
            'min-h-11 px-3 rounded-lg font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
            location.pathname === ROUTES.home
              ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/40',
          )}>
            <Link to={ROUTES.home}>
              <LayoutDashboard className="w-4 h-4 me-1.5" aria-hidden />
              {homeNavLabel}
            </Link>
          </Button>

          {isSuperUser && (
            <Button asChild variant="ghost" size="sm" className={cn(
              'min-h-11 px-3 rounded-lg font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
              location.pathname === ROUTES.platformAdmins
                ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/40',
            )}>
              <Link to={ROUTES.platformAdmins}>
                <Users className="w-4 h-4 me-1.5" aria-hidden />
                {t('platform.manageAdmins')}
              </Link>
            </Button>
          )}

          <Button asChild variant="ghost" size="sm" className={cn(
            'min-h-11 px-3 rounded-lg font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
            location.pathname === ROUTES.platformAccount
              ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/40',
          )}>
            <Link to={ROUTES.platformAccount}>
              <User className="w-4 h-4 me-1.5" aria-hidden />
              {t('platform.myAccount')}
            </Link>
          </Button>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-end">
            <span className="text-xs font-black text-foreground">{platformUser?.name}</span>
            <SectionLabel tracking="wider" className="flex items-center justify-end gap-1 mt-0.5">
              {isSuperUser ? (
                <>
                  <ShieldAlert className="w-2.5 h-2.5 text-primary shrink-0" aria-hidden />
                  {t('platform.roleSuperUser')}
                </>
              ) : (
                t('platform.roleAdmin')
              )}
            </SectionLabel>
          </div>
          <div className="h-8 w-px bg-border/60 hidden sm:block" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              void platformLogout();
            }}
            className="min-h-11 min-w-11 h-11 w-11 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:scale-105 active:scale-95 transition-all"
            title={t('platform.signOut')}
            aria-label={t('platform.signOut')}
          >
            <LogOut className="w-4 h-4" aria-hidden />
          </Button>
        </div>
      </div>

      <nav
        className="grid w-full auto-cols-fr grid-flow-col border-t border-border/40 bg-card/60 px-2 py-1 backdrop-blur-sm md:hidden"
        aria-label={t('platform.navAria')}
      >
        <Link
          to={ROUTES.home}
          className={cn(
            'flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-center text-xs font-bold leading-tight transition-all active:scale-95',
            location.pathname === ROUTES.home ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <LayoutDashboard className="w-4 h-4" aria-hidden />
          <span className="break-words">{homeNavLabel}</span>
        </Link>
        {isSuperUser && (
          <Link
            to={ROUTES.platformAdmins}
            className={cn(
              'flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-center text-xs font-bold leading-tight transition-all active:scale-95',
              location.pathname === ROUTES.platformAdmins ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Users className="w-4 h-4" aria-hidden />
            <span className="break-words">{t('platform.manageAdmins')}</span>
          </Link>
        )}
        <Link
          to={ROUTES.platformAccount}
          className={cn(
            'flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 text-center text-xs font-bold leading-tight transition-all active:scale-95',
            location.pathname === ROUTES.platformAccount ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <User className="w-4 h-4" aria-hidden />
          <span className="break-words">{t('platform.myAccount')}</span>
        </Link>
      </nav>
    </header>
  );
}
