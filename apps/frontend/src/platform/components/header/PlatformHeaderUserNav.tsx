import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, ShieldAlert, User, Users, ChevronDown, Search } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { usePlatformAuth } from '@/platform/lib/PlatformAuthContext';
import { usePlatformPermissions } from '@/platform/hooks/usePlatformPermissions';
import { usePlatformWorkspaces } from '@/platform/hooks/usePlatformWorkspaces';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/button';
import { BackgroundJobsTray } from '@/components/ui/BackgroundJobsTray';
import { PlatformLanguagePicker } from '@/platform/components/header/PlatformLanguagePicker';
import { PlatformNotificationsPopover } from '@/platform/components/header/PlatformNotificationsPopover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

export interface PlatformHeaderUserNavProps {
  compact?: boolean;
  onOpenSearch?: () => void;
  searchOpen?: boolean;
  className?: string;
}

export function PlatformHeaderUserNav({
  compact = false,
  onOpenSearch,
  searchOpen = false,
  className,
}: PlatformHeaderUserNavProps): React.JSX.Element {
  const { t } = useTranslation();
  const { platformUser, platformLogout } = usePlatformAuth();
  const { isSuperUser, canAdmins } = usePlatformPermissions();
  const { data: workspaces } = usePlatformWorkspaces();

  return (
    <div className={cn('flex shrink-0 items-center gap-1 sm:gap-2', className)}>
      {onOpenSearch && (
        <Button
          type="button"
          variant="outline"
          onClick={onOpenSearch}
          aria-label={t('platform.openSearchAria')}
          aria-keyshortcuts="Control+K Meta+K"
          aria-pressed={searchOpen}
          className={cn(
            'relative flex items-center gap-2 rounded-xl text-xs text-muted-foreground border-border/80 hover:bg-muted/80 transition-colors cursor-pointer',
            compact ? 'h-11 w-11 p-0 justify-center min-h-11 min-w-11' : 'h-11 px-3 py-1.5 min-h-11',
            searchOpen && 'ring-2 ring-primary/30 bg-muted/60',
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          {!compact && (
            <>
              <span className="hidden md:inline font-normal">{t('platform.searchConsolePlaceholder')}</span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border border-border/80 bg-muted px-1.5 py-0.5 text-2xs font-semibold text-muted-foreground select-none font-mono">
                ⌘K
              </kbd>
            </>
          )}
        </Button>
      )}

      <PlatformNotificationsPopover
        workspaces={workspaces}
        isSuperUser={isSuperUser}
      />

      <BackgroundJobsTray compact={compact} />

      <PlatformLanguagePicker compact={compact} />

      {!compact ? <div className="mx-1 hidden h-6 w-px bg-border sm:block" /> : null}

      {/* User Profile Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className={cn(
              'flex items-center gap-2.5 p-1 rounded-xl hover:bg-muted transition-colors text-start',
              compact && 'p-1',
            )}
          >
            <UserAvatar
              name={platformUser?.name}
              className={compact ? 'h-7 w-7' : 'h-8 w-8 border border-primary/20 shadow-xs'}
              fallbackClassName="bg-primary/10 text-primary text-xs font-bold"
            />
            {!compact ? (
              <>
                <div className="hidden sm:flex flex-col text-start">
                  <span className="text-xs font-bold text-foreground leading-tight truncate max-w-30">
                    {platformUser?.name ?? t('platform.operatorRole')}
                  </span>
                  <span className="text-2xs font-semibold text-muted-foreground flex items-center gap-1 leading-tight">
                    {isSuperUser ? (
                      <>
                        <ShieldAlert className="w-2.5 h-2.5 text-primary shrink-0" aria-hidden />
                        {t('platform.roleSuperUser')}
                      </>
                    ) : (
                      t('platform.roleAdmin')
                    )}
                  </span>
                </div>
                <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
              </>
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60 p-1.5 rounded-2xl surface-overlay text-start">
          <DropdownMenuLabel className="p-2">
            <div className="flex flex-col text-start">
              <p className="text-sm font-black text-foreground">{platformUser?.name}</p>
              <p className="text-xs font-mono text-muted-foreground truncate">{platformUser?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem asChild className="rounded-xl font-bold text-xs gap-2 min-h-10 cursor-pointer">
            <Link to={ROUTES.platformAccount}>
              <User className="h-4 w-4 text-warning" aria-hidden />
              {t('platform.myAccount')}
            </Link>
          </DropdownMenuItem>
          {canAdmins && (
            <DropdownMenuItem asChild className="rounded-xl font-bold text-xs gap-2 min-h-10 cursor-pointer">
              <Link to={ROUTES.platformAdmins}>
                <Users className="h-4 w-4 text-success" aria-hidden />
                {t('platform.adminsTitle')}
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem
            className="rounded-xl font-bold text-xs gap-2 min-h-10 text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
            onClick={() => {
              void platformLogout();
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {t('platform.signOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
