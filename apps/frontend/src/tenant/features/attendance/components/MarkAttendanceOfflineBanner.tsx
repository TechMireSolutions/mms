import { AnimatePresence, motion } from "framer-motion";
import { UploadCloud, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { useTranslation } from "@/hooks/useTranslation";
import type { OfflinePayload } from "@/tenant/features/attendance/components/markAttendanceTypes";

interface MarkAttendanceOfflineBannerProps {
  offline: boolean;
  queue: OfflinePayload[];
  onSync: () => void;
}

export function MarkAttendanceOfflineBanner({ offline, queue, onSync }: MarkAttendanceOfflineBannerProps) {
  const { t } = useTranslation();
  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
          <WarningCallout
            icon={WifiOff}
            density="banner"
            role="status"
            className="flex-wrap py-2.5 font-semibold"
            description={
              <span className="inline-flex min-w-0 flex-wrap items-center gap-2">
                <span className="min-w-0">{t("attendance.mark.offlineBannerOffline")}</span>
                {queue.length > 0 && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-warning/30 text-xs font-bold">
                    {queue.length} {t("attendance.mark.pending")}
                  </span>
                )}
              </span>
            }
            action={
              <Button
                onClick={onSync}
                variant="ghost"
                size="sm"
                className="text-xs font-bold px-2.5 py-2 rounded-lg bg-warning/30 hover:bg-warning/40 hover:text-warning transition-colors flex min-h-11 shrink-0 items-center gap-1"
              >
                <UploadCloud className="w-3 h-3" aria-hidden="true" /> {t("attendance.mark.syncNow")}
              </Button>
            }
          />
        </motion.div>
      )}
      {!offline && queue.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-success/10 border border-success/30 text-success"
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold">
            <Wifi className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0">{t("attendance.mark.offlineBannerOnline", { count: queue.length })}</span>
          </div>
          <Button
            onClick={onSync}
            variant="ghost"
            size="sm"
            className="text-xs font-bold px-2.5 py-2 rounded-lg bg-success/30 hover:bg-success/40 hover:text-success transition-colors flex min-h-11 shrink-0 items-center gap-1"
          >
            <UploadCloud className="w-3 h-3" aria-hidden="true" /> {t("attendance.mark.syncNow")}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
