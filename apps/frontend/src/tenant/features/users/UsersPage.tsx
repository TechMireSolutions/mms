import React from 'react';
import { UserCog, UserPlus } from 'lucide-react';
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { Button } from '@/components/ui/button';
import { UsersModalLayer } from '@/tenant/features/users/components/UsersModalLayer';
import { UsersReportsTier } from '@/tenant/features/users/components/UsersReportsTier';
import { UsersSetupTier } from '@/tenant/features/users/components/UsersSetupTier';
import { UsersWorkTier } from '@/tenant/features/users/components/UsersWorkTier';
import { UsersCommandMetrics } from '@/tenant/features/users/components/UsersCommandMetrics';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useUsersPageController } from '@/tenant/features/users/hooks/useUsersPageController';

/**
 * Users and roles — Work | Reports | Setup.
 */
export default function Users(): React.JSX.Element {
  const controller = useUsersPageController();

  return (
    <ModulePageShell
      seoTitle={`MMS - ${controller.t('page.users.title')}`}
      seoDescription={controller.t('page.users.subtitle')}
      headerIcon={UserCog}
      headerTitle={controller.t('page.users.title')}
      headerSubtitle={controller.t('page.users.subtitle')}
      headerActions={
        controller.canWrite && !controller.showDeleted ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => controller.setShowInvite(true)}>
              <UserPlus className="h-3.5 w-3.5" />
              {controller.t('users.invite')}
            </Button>
            <Button type="button" size="sm" onClick={() => controller.setShowAddUser(true)}>
              <UserPlus className="h-3.5 w-3.5" />
              {controller.t('users.add')}
            </Button>
          </div>
        ) : undefined
      }
      metricsStrip={
        <UsersCommandMetrics users={controller.users} shown={controller.users.length} />
      }
    >
      <ResponsiveAccordionTabs
        tabs={controller.visibleTopTabs}
        activeTab={controller.effectiveTab}
        onTabChange={controller.setActiveTab}
        hideWhenSingle
        panelIdPrefix="users-tab"
      >
        <ErrorBoundary>
          {controller.effectiveTab === 'reports' && <UsersReportsTier />}
          {controller.effectiveTab === 'setup' && (
            <UsersSetupTier
              tabs={controller.USERS_CONFIG_TABS}
              activeTab={controller.effectiveConfigTab}
              canEditSetup={controller.canEditSetup}
              onTabChange={controller.setConfigSubTab}
            />
          )}
          {controller.effectiveTab === 'work' && (
            <UsersWorkTier
              tabs={controller.SUB_TABS}
              activeSubTab={controller.effectiveSubTab}
              users={controller.users}
              logs={controller.logs}
              listLoadFailed={controller.listLoadFailed}
              logsLoadFailed={controller.logsLoadFailed}
              canWrite={controller.canWrite}
              canDelete={controller.canDelete}
              showDeleted={controller.showDeleted}
              getUserColumnWidth={controller.getUserColumnWidth}
              setUserColumnWidth={controller.setUserColumnWidth}
              getActivityColumnWidth={controller.getActivityColumnWidth}
              setActivityColumnWidth={controller.setActivityColumnWidth}
              onSubTabChange={controller.setActiveSubTab}
              onRetryUsers={controller.refetchUsers}
              onRetryLogs={controller.refetchLogs}
              onViewUser={controller.setViewing}
              onEditUser={controller.setEditing}
              onDeleteUser={(id) => { void controller.handleDeleteUser(id); }}
              onRestoreUser={(id) => { void controller.handleRestoreUser(id); }}
              onBulkDeleteUsers={(ids) => { void controller.handleBulkDelete(ids); }}
              onBulkRestoreUsers={(ids) => { void controller.handleBulkRestore(ids); }}
              onResetPassword={controller.handleResetPassword}
              onAddUser={() => controller.setShowAddUser(true)}
              onMessageUsers={controller.handleMessageUsers}
              onToggleDeleted={controller.setShowDeleted}
            />
          )}
        </ErrorBoundary>
      </ResponsiveAccordionTabs>

      <UsersModalLayer
        viewing={controller.viewing}
        editing={controller.editing}
        showAddUser={controller.showAddUser}
        showInvite={controller.showInvite}
        canWrite={controller.canWrite}
        users={controller.users}
        messagingTarget={controller.messagingTarget}
        onCloseViewing={() => controller.setViewing(null)}
        onCloseEditing={() => controller.setEditing(null)}
        onCloseAddUser={() => controller.setShowAddUser(false)}
        onCloseInvite={() => controller.setShowInvite(false)}
        onSaveEdit={controller.handleSaveEdit}
        onAddUser={controller.handleAddUser}
        onInvite={controller.handleInvite}
        onCloseComposer={controller.closeComposer}
      />
    </ModulePageShell>
  );
}
