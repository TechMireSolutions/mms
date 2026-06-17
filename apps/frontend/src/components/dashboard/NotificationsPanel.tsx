import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertTriangle, Calendar, User, DollarSign, X, ChevronRight } from "lucide-react";
import { notifications as defaultNotifications, UserRole } from '@/lib/data/dashboardData';
import { getObject } from "../../lib/db";
import useTranslation from "@/hooks/useTranslation";

interface NotificationItem {
  id: string | number;
  type: "fee" | "event" | "student" | "attendance" | string;
  title: string;
  desc: string;
  time: string;
  urgent?: boolean;
}

interface NotificationsPanelProps {
  role: string;
}

const ICONS: Record<string, { icon: React.ElementType; bg: string; text: string }> = {
  fee: { icon: DollarSign, bg: "bg-destructive/10", text: "text-destructive" },
  event: { icon: Calendar, bg: "bg-info/10", text: "text-info" },
  student: { icon: User, bg: "bg-success/10", text: "text-success" },
  attendance: { icon: AlertTriangle, bg: "bg-warning/10", text: "text-warning" },
};

/**
 * NotificationsPanel Component
 *
 * Displays a list of recent notifications specific to the user's role.
 * Allows dismissing and restoring notifications.
 *
 * @param {NotificationsPanelProps} props - The component properties.
 * @returns {React.ReactElement} The notifications panel widget.
 */
export default function NotificationsPanel({ role }: NotificationsPanelProps): React.JSX.Element {
  const { t } = useTranslation();
  let items: NotificationItem[] = [];
  try {
    const notifications = getObject("dashboard_notifications", defaultNotifications);
    const r = role as UserRole;
    items = notifications[r] || notifications.admin || [];
  } catch (error) {
    console.error("Failed to load notifications:", error);
    items = defaultNotifications.admin || [];
  }

  const [dismissed, setDismissed] = useState<Array<string | number>>([]);
  const visible = items.filter((n) => !dismissed.includes(n.id));
  const urgent = visible.filter((n) => n.urgent).length;

  return (
    <section aria-labelledby="notifications-heading" className="bg-card rounded-xl border border-border">
      <header className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Bell className="w-4 h-4 text-foreground" aria-hidden="true" />
          <h3 id="notifications-heading" className="text-sm font-semibold text-foreground m-0">{t("notifications.title")}</h3>
          {urgent > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive" aria-label={`${urgent} urgent notifications`}>
              {urgent} {t("notifications.urgent")}
            </span>
          )}
        </div>
        {dismissed.length > 0 && (
          <button
            onClick={() => setDismissed([])}
            className="text-[11px] text-primary font-medium hover:underline"
            aria-label="Restore all dismissed notifications"
          >
            {t("notifications.restoreAll")}
          </button>
        )}
      </header>

      <div className="divide-y divide-border/50 max-h-[340px] overflow-y-auto">
        <AnimatePresence initial={false}>
          {visible.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground m-0">{t("notifications.empty")}</p>
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
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors ${
                    notif.urgent ? "bg-destructive/[0.02]" : ""
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0 mt-0.5`} aria-hidden="true">
                    <Icon className={`w-4 h-4 ${meta.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <p className="text-[13px] font-semibold text-foreground leading-snug flex-1 m-0">
                        {notif.title}
                      </p>
                      {notif.urgent && (
                        <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full flex-shrink-0" aria-label="Urgent">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-0.5 m-0">{notif.desc}</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1 m-0">{notif.time}</p>
                  </div>
                  <button
                    onClick={() => setDismissed((d) => [...d, notif.id])}
                    className="text-muted-foreground/40 hover:text-muted-foreground transition-colors flex-shrink-0 mt-0.5 p-0.5"
                    aria-label={`Dismiss notification: ${notif.title}`}
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </motion.article>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <footer className="px-5 py-3 border-t border-border">
        <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
          {t("notifications.viewAll")} <ChevronRight className="w-3 h-3" aria-hidden="true" />
        </button>
      </footer>
    </section>
  );
}
