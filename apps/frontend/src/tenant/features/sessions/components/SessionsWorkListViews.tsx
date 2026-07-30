import { SessionCard } from "@/tenant/features/sessions/components/SessionCard";
import { SessionsWorkTableDesktop } from "@/tenant/features/sessions/components/SessionsWorkTableDesktop";
import { SessionsWorkTableMobileCards } from "@/tenant/features/sessions/components/SessionsWorkTableMobileCards";
import type { SessionSortField } from "@/tenant/features/sessions/components/sessionPageTypes";
import type {
  SessionsWorkColumnLayout,
  SessionsWorkViewProps,
} from "@/tenant/features/sessions/components/sessionsWorkListViewsShared";

export function SessionsWorkCardGrid({
  sessions,
  showDeleted,
  canDelete,
  statusConfig,
  typeConfig,
  onOpenDetail,
  onRequestDelete,
  onRestore,
}: SessionsWorkViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sessions.map((sessionItem) => (
        <SessionCard
          key={sessionItem.id}
          session={sessionItem}
          onClick={() => !showDeleted && onOpenDetail(sessionItem)}
          onDelete={onRequestDelete}
          onRestore={onRestore}
          canDelete={canDelete}
          showDeleted={showDeleted}
          statusConfig={statusConfig}
          typeConfig={typeConfig}
        />
      ))}
    </div>
  );
}

interface SessionsWorkTableProps extends SessionsWorkViewProps {
  canSelectSessions: boolean;
  selectedIds: string[];
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  showName: boolean;
  showType: boolean;
  showDuration: boolean;
  showFee: boolean;
  showEnrolled: boolean;
  showStatus: boolean;
  sortField: SessionSortField;
  sortDir: "asc" | "desc";
  columnLayout: SessionsWorkColumnLayout;
  onSort: (field: SessionSortField) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectedSession: (id: string, checked: boolean) => void;
}

export function SessionsWorkTable(props: SessionsWorkTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/45 shadow-sm backdrop-blur-xl">
      <SessionsWorkTableMobileCards {...props} />
      <SessionsWorkTableDesktop {...props} />
    </div>
  );
}
