import { SessionCard } from "@/tenant/features/sessions/components/SessionCard";
import { SessionsWorkTableDesktop } from "@/tenant/features/sessions/components/SessionsWorkTableDesktop";
import type { SessionSortField } from "@/tenant/features/sessions/components/sessionPageTypes";
import type {
  SessionsWorkColumnLayout,
  SessionsWorkViewProps,
} from "@/tenant/features/sessions/components/sessionsWorkListViewsShared";
import { DirectoryCardsGrid } from "@/components/ui/DirectoryCardsGrid";
import { DirectoryCardsSelectAllBar } from "@/components/ui/DirectoryCardsSelectAllBar";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDirectoryPageCountLabel } from "@/lib/formatDirectoryPageCountLabel";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { cn } from "@/lib/utils";

interface SessionsWorkCardGridProps extends SessionsWorkViewProps {
  canSelectSessions: boolean;
  selectedIds: string[];
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectedSession: (id: string, checked: boolean) => void;
}

export function SessionsWorkCardGrid({
  sessions,
  showDeleted,
  canDelete,
  canSelectSessions,
  selectedIds,
  allVisibleSelected,
  someVisibleSelected,
  isColumnVisible,
  columnRegistry,
  statusConfig,
  typeConfig,
  onOpenDetail,
  onRequestDelete,
  onRestore,
  onToggleSelectAll,
  onToggleSelectedSession,
}: SessionsWorkCardGridProps) {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const pageCountLabel = formatDirectoryPageCountLabel(sessions.length, t, {
    singular: "sessions.form.session",
    plural: "sessions.table.sessions",
  });

  return (
    <>
      {canSelectSessions && sessions.length > 0 ? (
        <DirectoryCardsSelectAllBar
          checkboxId="sessions-select-all-cards"
          allSelected={allVisibleSelected}
          someSelected={someVisibleSelected}
          onSelectAll={() => onToggleSelectAll(!allVisibleSelected)}
          selectLabel={t("sessions.table.selectAll")}
          deselectLabel={t("common.deselect")}
          selectedCount={selectedIds.length}
          selectedCountLabel={t("sessions.selectedCount", { count: selectedIds.length })}
          pageCountLabel={pageCountLabel}
        />
      ) : null}

      <DirectoryCardsGrid>
        {sessions.map((sessionItem) => {
          const isSelected = selectedIds.includes(sessionItem.id);
          return (
            <SessionCard
              key={sessionItem.id}
              session={sessionItem}
              isSelected={isSelected}
              canSelectSessions={canSelectSessions}
              showDeleted={showDeleted}
              canDelete={canDelete}
              isColumnVisible={isColumnVisible}
              columnRegistry={columnRegistry}
              statusConfig={statusConfig}
              typeConfig={typeConfig}
              onView={onOpenDetail}
              onToggleSelectedSession={onToggleSelectedSession}
              onRequestDelete={onRequestDelete}
              onRestore={onRestore}
              reducedMotion={reducedMotion}
            />
          );
        })}
      </DirectoryCardsGrid>
    </>
  );
}

interface SessionsWorkTableProps extends SessionsWorkViewProps {
  canSelectSessions: boolean;
  selectedIds: string[];
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  sortField: SessionSortField;
  sortDir: "asc" | "desc";
  columnLayout: SessionsWorkColumnLayout;
  onSort: (field: SessionSortField) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectedSession: (id: string, checked: boolean) => void;
}

export function SessionsWorkTable(props: SessionsWorkTableProps) {
  return (
    <div className={cn(WORK_SURFACE, "overflow-hidden")}>
      <SessionsWorkTableDesktop {...props} />
    </div>
  );
}
