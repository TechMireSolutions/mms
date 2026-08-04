import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, Calendar, User, DollarSign, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { DashboardNotificationItem } from '@/lib/buildDashboardNotifications';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { WidgetCard } from '@/components/ui/WidgetCard';

interface NotificationsPanelProps {
  items: DashboardNotificationItem[];
}

const ICONS: Record<string, { icon: React.ElementType; bg: string; text: string }> = {
  fee: { icon: DollarSign, bg: 'bg-destructive/10', text: 'text-destructive' },
  event: { icon: Calendar, bg: 'bg-info/10', text: 'text-info' },
  student: { icon: User, bg: 'bg-success/10', text: 'text-success' },
  attendance: { icon: AlertTriangle, bg: 'bg-warning/10', text: 'text-warning' },
};

export default function NotificationsPanel({ items }: NotificationsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState<Array<string | number>>([]);
  const visible = items.filter((n) => !dismissed.includes(n.id));
  const urgent = visible.filter((n) => n.urgent).length;

  return (
    <WidgetCard ariaLabelledby="notifications-heading" accentColor="warning">
      <header className="px-5 py-4 border-b border-border/45 flex flex-wrap items-center justify-between gap-2 select-none ps-6.5">

        <div className="flex min-w-0 items-center gap-2.5">
          <Bell className={`w-4 h-4 text-warning/70 group-hover:text-warning transition-colors shrink-0 ${urgent > 0 ? "animate-pulse" : ""}`} aria-hidden="true" />
          <h3 id="notifications-heading" className="min-w-0 truncate text-sm font-bold text-foreground m-0">
            {t('notifications.title')}
          </h3>
          {urgent > 0 && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-destructive/10 text-destructive font-black border border-destructive/20 text-xs shrink-0 uppercase tracking-wider"
              aria-label={t('notifications.urgentCount', { count: urgent })}
            >
              {urgent} {t('notifications.urgent')}
            </span>
          )}
        </div>
        {dismissed.length > 0 && (
          <Button
            variant="link"
            onClick={() => setDismissed([])}
            className="text-xs font-bold shrink-0 min-h-11 px-2 text-primary hover:text-primary/80 transition-colors"
          >
            {t('notifications.restoreAll')}
          </Button>
        )}
      </header>

      <div className="divide-y divide-border/40 max-h-[21.25rem] overflow-y-auto">
        <AnimatePresence initial={false}>
          {visible.length === 0 ? (
            <EmptyState
              title={t('notifications.empty')}
              description={t('notifications.emptyHint')}
              icon={Bell}
              compact
              className="select-none px-5"
            />
          ) : (
            visible.map((notif) => {
              const meta = ICONS[notif.type] || ICONS.event;
              const Icon = meta.icon;
              return (
                <motion.article
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors ${
                    notif.urgent ? 'bg-destructive/[0.03]' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}
                    aria-hidden="true"
                  >
                    <Icon className={`w-4 h-4 ${meta.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <p className="text-sm font-bold text-foreground leading-snug flex-1 m-0">
                        {notif.title}
                      </p>
                      {notif.urgent && (
                        <span className="text-xs font-bold uppercase tracking-wider text-destructive bg-destructive/10 border border-destructive/20 px-1.5 py-0.5 rounded-full flex-shrink-0 select-none">
                          {t('notifications.urgentLabel')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground/90 mt-0.5 m-0 leading-normal">{notif.desc}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1 m-0 font-medium">{notif.time}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDismissed((d) => [...d, notif.id])}
                    className="text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted/50 rounded-lg transition-colors flex-shrink-0 mt-0.5 shadow-none"
                    aria-label={t('notifications.dismiss', { title: notif.title })}
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </Button>
                </motion.article>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </WidgetCard>
  );
}
