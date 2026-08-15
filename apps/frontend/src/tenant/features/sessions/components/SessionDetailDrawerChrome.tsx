/**
 * @file SessionDetailDrawerChrome.tsx
 * @description Header actions, banner, tab-bar, and footer chrome partitions for SessionDetail.
 */
import React from "react";
import type { Session } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { SubTabBar, type SubTab } from "@/components/ui/SubTabBar";
import { DetailDrawerRestoreOrEditAction, DrawerSyncStatusFooter } from "@/components/ui/DetailDrawerArchiveChrome";
import { SessionArchivedBanner } from "@/tenant/features/sessions/components/SessionArchivedBanner";

export interface SessionDetailDrawerHeaderActionsProps {
  canWrite: boolean;
  canDelete: boolean;
  session: Session;
  onEdit: (session: Session) => void;
  onRestore?: (sessionId: string) => void | Promise<void>;
}

export const SessionDetailDrawerHeaderActions = React.memo(function SessionDetailDrawerHeaderActions({
  canWrite,
  canDelete,
  session,
  onEdit,
  onRestore,
}: SessionDetailDrawerHeaderActionsProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const isArchived = Boolean(session.deletedAt);

  return (
    <DetailDrawerRestoreOrEditAction
      isArchived={isArchived}
      canRestore={canDelete}
      canEdit={canWrite}
      restoreLabel={t("sessions.restore")}
      editLabel={t("sessions.detail.editTitle")}
      onRestore={onRestore ? () => onRestore(String(session.id)) : undefined}
      onEdit={() => onEdit(session)}
    />
  );
});

export interface SessionDetailDrawerArchivedBannerProps {
  session: Session;
}

export const SessionDetailDrawerArchivedBanner = React.memo(function SessionDetailDrawerArchivedBanner({
  session,
}: SessionDetailDrawerArchivedBannerProps): React.JSX.Element | null {
  return <SessionArchivedBanner session={session} />;
});

export interface SessionDetailDrawerTabBarProps {
  detailTabs: readonly SubTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const SessionDetailDrawerTabBar = React.memo(function SessionDetailDrawerTabBar({
  detailTabs,
  activeTab,
  onTabChange,
}: SessionDetailDrawerTabBarProps): React.JSX.Element | null {
  return (
    <div className="flex flex-shrink-0 -mx-1 px-1 overflow-x-auto">
      <SubTabBar
        tabs={detailTabs}
        value={activeTab}
        onChange={onTabChange}
        variant="underline"
        panelIdPrefix="session-detail-subtab"
        resetScrollOnChange={false}
      />
    </div>
  );
});

export interface SessionDetailDrawerFooterProps {
  isArchived: boolean;
}

export const SessionDetailDrawerFooter = React.memo(function SessionDetailDrawerFooter({
  isArchived,
}: SessionDetailDrawerFooterProps): React.JSX.Element | null {
  const { t } = useTranslation();
  return (
    <DrawerSyncStatusFooter
      isArchived={isArchived}
      archivedLabel={t("sessions.detail.archivedSubtitle")}
      syncedLabel={t("sessions.detail.synced")}
    />
  );
});
