import type { ModuleColumnRegistryEntry } from "@mms/shared";
import { DirectoryCardFooterActions } from "@/components/ui/DirectoryCardFooterActions";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { DirectoryCardMetadata } from "@/components/ui/DirectoryCardMetadata";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS } from "@/components/ui/directoryCardChrome";
import type { StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useWorkCardAction } from "@/hooks/useWorkCardAction";
import { useTranslation } from "@/hooks/useTranslation";
import type { Session } from "@/lib/data/sessionsData";
import { SessionListRowActions } from "@/tenant/features/sessions/components/SessionListRowActions";
import { getSessionVisibleWorkColumns } from "@/tenant/features/sessions/components/sessionListVisibleColumns";
import {
  getSessionCapacityMeta,
  renderSessionWorkColumnValue,
} from "@/tenant/features/sessions/components/sessionWorkColumnCell";

export interface SessionCardProps {
  session: Session;
  isSelected?: boolean;
  selectedIds?: string[];
  canSelectSessions: boolean;
  showDeleted: boolean;
  canDelete: boolean;
  isColumnVisible: (key: string) => boolean;
  columnRegistry: ModuleColumnRegistryEntry[];
  statusConfig: Record<string, StatusBadgeConfigItem>;
  typeConfig: Record<string, StatusBadgeConfigItem>;
  onView: (session: Session) => void;
  onToggleSelectedSession: (id: string, checked: boolean) => void;
  onRequestDelete: (id: string) => void;
  onRestore: (id: string) => void;
  reducedMotion?: boolean;
}

/** Sessions Work directory card — shared DirectoryEntityCard chrome + capacity bar. */
export function SessionCard({
  session,
  isSelected,
  selectedIds = [],
  canSelectSessions,
  showDeleted,
  canDelete,
  isColumnVisible,
  columnRegistry,
  statusConfig,
  typeConfig,
  onView,
  onToggleSelectedSession,
  onRequestDelete,
  onRestore,
  reducedMotion = false,
}: SessionCardProps): React.JSX.Element {
  const { t } = useTranslation();

  const { isSelected: derivedSelected, onSelect, onView: handleView, cardProps } = useWorkCardAction({
    entity: session,
    selectedIds: selectedIds.length > 0 ? selectedIds : (isSelected ? [session.id] : []),
    onToggleSelected: onToggleSelectedSession,
    onView,
    canSelect: canSelectSessions,
  });

  const effectiveSelected = isSelected ?? derivedSelected;
  const { totalCapacity, capacityPercent, classCount } = getSessionCapacityMeta(session);
  const visibleColumns = getSessionVisibleWorkColumns(columnRegistry, isColumnVisible, {
    excludeFace: true,
  });
  const columnOptions = { t, statusConfig, typeConfig };

  return (
    <DirectoryEntityCard isSelected={effectiveSelected} reducedMotion={reducedMotion} {...cardProps}>
      <DirectoryCardHeader
        id={session.id}
        displayName={session.name}
        isSelected={effectiveSelected}
        showSelect={canSelectSessions}
        onSelect={onSelect}
        selectAriaLabel={t("sessions.table.selectSession", { name: session.name })}
        onView={handleView}
        viewAriaLabel={`${t("sessions.table.viewProfile")} - ${session.name}`}
        reducedMotion={reducedMotion}
        subtitle={
          session.description ? (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{session.description}</p>
          ) : undefined
        }
      />

      <DirectoryCardMetadata
        columns={visibleColumns}
        keyFor={(col) => col.key}
        labelFor={(col) => col.label}
        renderValue={(col) =>
          renderSessionWorkColumnValue(session, col.key, { ...columnOptions, emptyFallback: null })
        }
      />

      {totalCapacity > 0 && (
        <div>
          <ProgressBar
            value={Math.min(capacityPercent, 100)}
            fillClassName={capacityPercent >= 100 ? "bg-destructive" : capacityPercent >= 80 ? "bg-warning" : "bg-success"}
            trackClassName="h-1 bg-border"
            aria-hidden="true"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {t("sessions.card.capacityUsed", {
              percent: capacityPercent,
              count: classCount,
              classesLabel: classCount === 1 ? t("sessions.card.classSingular") : t("sessions.card.classPlural"),
            })}
          </p>
        </div>
      )}

      <DirectoryCardFooterActions
        onView={() => onView(session)}
        viewLabel={t("sessions.actionViewShort")}
        viewAriaLabel={`${t("sessions.table.viewProfile")} - ${session.name}`}
        overflowActions={
          canDelete ? (
            <SessionListRowActions
              session={session}
              showDeleted={showDeleted}
              canDelete={canDelete}
              hideViewItem
              onView={onView}
              triggerClassName={DIRECTORY_CARD_OVERFLOW_TRIGGER_CLASS}
              onRequestDelete={onRequestDelete}
              onRestore={onRestore}
            />
          ) : null
        }
      />
    </DirectoryEntityCard>
  );
}
