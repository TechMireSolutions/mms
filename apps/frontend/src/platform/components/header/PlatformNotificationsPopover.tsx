import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import type { PlatformWorkspaceRow } from '@mms/shared';
import { useTranslation } from '@/hooks/useTranslation';
import { buildPlatformNotifications } from '@/platform/lib/buildPlatformNotifications';
import { usePlatformNotificationAck } from '@/platform/hooks/usePlatformNotificationAck';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

export interface PlatformNotificationsPopoverProps {
  workspaces: PlatformWorkspaceRow[] | undefined;
  isSuperUser: boolean;
}

export function PlatformNotificationsPopover({
  workspaces,
  isSuperUser,
}: PlatformNotificationsPopoverProps): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { ackedIds, ackAll } = usePlatformNotificationAck();

  const notifications = buildPlatformNotifications(workspaces, isSuperUser, t);
  const unreadCount = notifications.filter((n) => !ackedIds.has(n.id)).length;

  return (
    <Popover
      open={popoverOpen}
      onOpenChange={(open) => {
        setPopoverOpen(open);
        if (!open) ackAll(notifications.map((n) => n.id));
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t('platform.notificationsAria')}
          className="relative min-h-11 min-w-11 h-11 w-11 rounded-xl hover:bg-muted transition-colors cursor-pointer"
        >
          <Bell className="h-4.5 w-4.5 text-muted-foreground" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 end-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-popover-menu max-w-full p-0 rounded-2xl surface-overlay text-start">
        {popoverOpen && (
          <>
            <div className="border-b border-border px-4 py-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-foreground text-balance">{t('platform.notificationsTitle')}</h3>
                {unreadCount > 0 && (
                  <Badge tone="primary" size="sm" className="font-bold">
                    {t('platform.notificationsNewBadge', { count: String(unreadCount) })}
                  </Badge>
                )}
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <EmptyState
                  title={t('platform.notificationsAllCaughtUp')}
                  compact
                  className="py-6"
                />
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => {
                      setPopoverOpen(false);
                      if (notification.href) {
                        navigate(notification.href);
                      } else {
                        navigate(ROUTES.platformReports);
                      }
                    }}
                    className="w-full min-h-11 text-start border-b border-border/50 px-4 py-3 last:border-0 hover:bg-muted/60 transition-colors bg-primary/5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus:bg-muted/80 block"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          notification.urgent ? 'bg-destructive animate-pulse' : 'bg-primary',
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground truncate">{notification.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{notification.desc}</p>
                        <p className="mt-1 text-2xs font-mono text-muted-foreground">{notification.time}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-border px-4 py-2.5">
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setPopoverOpen(false);
                  navigate(ROUTES.platformReports);
                }}
                className="text-xs font-bold text-primary hover:underline min-h-11 p-0 cursor-pointer"
              >
                {t('platform.notificationsViewAllReports')}
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
