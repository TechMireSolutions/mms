import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, Calendar, User, DollarSign, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { DashboardNotificationItem } from '@/lib/buildDashboardNotifications';
import { Button } from '@/components/ui/button';

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
    <section aria-labelledby="notifications-heading" className="bg-card rounded-xl border border-border">
      <header className="px-5 py-4 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Bell className="w-4 h-4 text-foreground shrink-0" aria-hidden="true" />
          <h3 id="notifications-heading" className="text-sm font-semibold text-foreground m-0 truncate">
            {t('notifications.title')}
          </h3>
          {urgent > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive shrink-0"
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
            className="text-[11px] font-medium shrink-0 h-auto p-0 text-primary hover:underline"
          >
            {t('notifications.restoreAll')}
          </Button>
        )}
      </header>

      <div className="divide-y divide-border/50 max-h-[340px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {visible.length === 0 ? (
            <div className="py-10 text-center px-5">
              <p className="text-sm text-muted-foreground m-0">{t('notifications.empty')}</p>
              <p className="text-xs text-muted-foreground/80 mt-1 m-0">{t('notifications.emptyHint')}</p>
            </div>
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
                    notif.urgent ? 'bg-destructive/[0.02]' : ''
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
                      <p className="text-[13px] font-semibold text-foreground leading-snug flex-1 m-0">
                        {notif.title}
                      </p>
                      {notif.urgent && (
                        <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {t('notifications.urgentLabel')}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-0.5 m-0">{notif.desc}</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1 m-0">{notif.time}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDismissed((d) => [...d, notif.id])}
                    className="text-muted-foreground/40 hover:text-muted-foreground transition-colors flex-shrink-0 mt-0.5 p-0.5 w-6 h-6"
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
    </section>
  );
}
