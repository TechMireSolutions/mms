import { motion } from "framer-motion";
import { RotateCcw, Trash2 } from "lucide-react";
import { formatDate, formatMoney } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { useTranslation } from "@/hooks/useTranslation";
import type { Session } from "@/lib/data/sessionsData";
import { getSessionEnrollmentTotals } from "@/tenant/features/sessions/components/sessionsWorkListViewsShared";

interface SessionsWorkTableMobileCardsProps {
  sessions: Session[];
  showDeleted: boolean;
  canDelete: boolean;
  canSelectSessions: boolean;
  selectedIds: string[];
  showName: boolean;
  showType: boolean;
  showDuration: boolean;
  showFee: boolean;
  showEnrolled: boolean;
  showStatus: boolean;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  typeConfig: Record<string, StatusBadgeConfigItem>;
  onOpenDetail: (session: Session) => void;
  onToggleSelectedSession: (id: string, checked: boolean) => void;
  onRequestDelete: (id: string) => void;
  onRestore: (id: string) => void;
}

export function SessionsWorkTableMobileCards({
  sessions,
  showDeleted,
  canDelete,
  canSelectSessions,
  selectedIds,
  showName,
  showType,
  showDuration,
  showFee,
  showEnrolled,
  showStatus,
  statusConfig,
  typeConfig,
  onOpenDetail,
  onToggleSelectedSession,
  onRequestDelete,
  onRestore,
}: SessionsWorkTableMobileCardsProps) {
  const { t } = useTranslation();

  const renderSessionListActions = (sessionId: string) => (
    canDelete ? (
      showDeleted ? (
        <Button type="button" variant="ghost" size="icon" aria-label={t("sessions.restore")} onClick={() => onRestore(sessionId)}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      ) : (
        <Button type="button" variant="ghost" size="icon" aria-label={t("common.delete")} onClick={() => onRequestDelete(sessionId)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      )
    ) : null
  );

  return (
    <div className="space-y-3 p-3 md:hidden">
      {sessions.map((sessionItem, index) => {
        const { totalEnrolled, totalCapacity } = getSessionEnrollmentTotals(sessionItem);
        return (
          <motion.article
            key={sessionItem.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.03 }}
            className="space-y-3 rounded-xl border border-border bg-card p-3"
          >
            <Button
              type="button"
              variant="ghost"
              onClick={() => !showDeleted && onOpenDetail(sessionItem)}
              className="h-auto w-full justify-start p-0 text-start font-normal hover:bg-transparent"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  {showName && <h4 className="truncate text-sm font-semibold text-foreground">{sessionItem.name}</h4>}
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {showType && <StatusBadge status={sessionItem.type || "other"} config={typeConfig} size="sm" />}
                    {showStatus && <StatusBadge status={sessionItem.status} config={statusConfig} size="sm" />}
                  </div>
                </div>
                {showFee && (
                  <span className="shrink-0 text-sm font-bold text-foreground">
                    {formatMoney(sessionItem.baseFee, sessionItem.currency)}
                  </span>
                )}
              </div>
            </Button>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {showDuration && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("sessions.columns.duration")}</dt>
                  <dd className="text-foreground">{formatDate(sessionItem.startDate, true)} — {formatDate(sessionItem.endDate, true)}</dd>
                </div>
              )}
              {showEnrolled && (
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">{t("sessions.columns.enrolled")}</dt>
                  <dd className="text-foreground">{totalEnrolled}/{totalCapacity || t("common.notSpecified")}</dd>
                </div>
              )}
            </dl>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
              {canSelectSessions ? (
                <Checkbox
                  checked={selectedIds.includes(sessionItem.id)}
                  onCheckedChange={(checked) => onToggleSelectedSession(sessionItem.id, checked === true)}
                  aria-label={sessionItem.name}
                />
              ) : <span />}
              {renderSessionListActions(sessionItem.id)}
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
