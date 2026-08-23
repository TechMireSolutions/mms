import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { Mail, MessageCircle, MessageSquare, Send } from 'lucide-react';
import {
  mergeMessageTemplates,
  MESSAGING_MODULE_MANIFEST,
  type Message,
  type StandardMessagingRecipient as MessagingRecipient,
} from '@mms/shared';
import { ActionButton } from '@/components/ui/ActionButton';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';
import { ErrorState } from '@/components/ui/ErrorState';
import { ModuleCommandMetricsGrid } from '@/components/ui/ModuleCommandMetricsGrid';
import { ModulePageShell } from '@/components/ui/ModulePageShell';
import { ResponsiveAccordionTabs } from '@/components/ui/ResponsiveAccordionTabs';
import { useMessageComposerState } from '@/hooks/useMessageComposerState';
import { useModuleShortcuts } from '@/hooks/useModuleShortcuts';
import { usePersistedTabState } from '@/hooks/usePersistedTabState';
import { useTranslation } from '@/hooks/useTranslation';
import { notify } from '@/lib/notify';
import { useFilteredModuleTierTabs } from '@/tenant/hooks/useModuleTierTabs';
import { useModulePermissions } from '@/tenant/hooks/usePermissions';
import { MessagingReportsPanel } from './components/MessagingReportsPanel';
import { MessagingSetupPanel } from './components/MessagingSetupPanel';
import { MessagingWorkPanel, type MessagingSelectedMap } from './components/MessagingWorkPanel';
import {
  useMessageTemplates,
  useMessagingMetrics,
  useMessagingMutations,
} from './hooks/useMessaging';

const MessageComposer = lazy(() => import('@/components/ui/MessageComposer'));
export default function MessagingPage(): React.JSX.Element {
  const { t } = useTranslation();
  const { canRead, canWrite, canViewSetup, canEditSetup, canClearLogs } = useModulePermissions(MESSAGING_MODULE_MANIFEST);
  const [activeTab, setActiveTab] = usePersistedTabState<'work' | 'reports' | 'setup'>('messaging_active_tab', 'work');
  const [selectedById, setSelectedById] = useState<MessagingSelectedMap>({});
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [confirmClearLogsOpen, setConfirmClearLogsOpen] = useState(false);
  const { messagingTarget, openComposer, closeComposer } = useMessageComposerState();
  const templatesQuery = useMessageTemplates({ enabled: canRead });
  const metricsQuery = useMessagingMetrics({ enabled: canRead });
  const { deleteTemplate, clearLogs } = useMessagingMutations();
  const visibleTabs = useFilteredModuleTierTabs({ canViewSetup: canViewSetup || canEditSetup });

  const selectedList = useMemo(() => Object.values(selectedById), [selectedById]);
  const templates = useMemo(
    () => mergeMessageTemplates(templatesQuery.templates),
    [templatesQuery.templates],
  );
  const stats = useMemo(() => ({
    total: metricsQuery.data?.total ?? 0,
    sms: metricsQuery.data?.smsCount ?? 0,
    whatsapp: metricsQuery.data?.whatsappCount ?? 0,
    email: metricsQuery.data?.emailCount ?? 0,
  }), [metricsQuery.data]);

  const triggerCompose = useCallback((
    channel: 'sms' | 'whatsapp' | 'email',
    recipients: MessagingRecipient[] = selectedList,
    initialMessage?: string,
    initialSubject?: string,
  ): void => {
    if (recipients.length === 0) {
      notify.error(t('messaging.selectRecipientsDesc'));
      return;
    }
    openComposer(channel, recipients, { initialMessage, initialSubject });
  }, [openComposer, selectedList, t]);

  const startCampaign = useCallback((): void => {
    setActiveTab('work');
    if (selectedList.length > 0) triggerCompose('whatsapp');
    else notify.info(t('messaging.selectRecipientsDesc'));
  }, [selectedList.length, setActiveTab, t, triggerCompose]);

  useModuleShortcuts({
    searchInputId: 'messaging-search-input',
    selectedCount: selectedList.length,
    hasActiveFilters: false,
    clearFilters: () => {},
    clearSelection: () => setSelectedById({}),
    canWrite,
    showDeleted: false,
    onCreate: startCampaign,
    enabled: activeTab === 'work',
  });

  const resend = (log: Message, recipient: MessagingRecipient): void => {
    triggerCompose(log.channel, [recipient], log.body, log.subject);
  };

  const confirmDeleteTemplate = async (): Promise<void> => {
    if (!deleteTemplateId) return;
    try {
      await deleteTemplate.mutateAsync({ params: { id: deleteTemplateId } } as any);
      setDeleteTemplateId(null);
      notify.success(t('common.delete'));
    } catch {
      // Mutation hook reports the failure.
    }
  };

  const confirmClearLogs = async (): Promise<void> => {
    try {
      await clearLogs.mutateAsync({ body: {} } as any);
      setConfirmClearLogsOpen(false);
      notify.success(t('messaging.clearLogs'));
    } catch {
      // Mutation hook reports the failure.
    }
  };

  return (
    <ModulePageShell
      seoTitle={`MMS - ${t('nav.messaging')}`}
      seoDescription={t('messaging.subtitle')}
      headerIcon={MessageSquare}
      headerTitle={t('messaging.title')}
      headerSubtitle={t('messaging.subtitle')}
      headerActions={canWrite ? <ActionButton variant="primary" icon={Send} onClick={startCampaign}>{t('messaging.newCampaign')}</ActionButton> : null}
      metricsStrip={!canRead ? null : metricsQuery.isError ? (
        <ErrorState
          title={t('messaging.loadFailed')}
          description={t('messaging.loadFailedHint')}
          onRetry={() => {
            void metricsQuery.refetch();
          }}
        />
      ) : (
        <ModuleCommandMetricsGrid
          items={[
            { icon: Send, label: t('messaging.stats.total'), value: stats.total, accent: 'primary' },
            { icon: MessageSquare, label: t('messaging.stats.sms'), value: stats.sms, accent: 'info' },
            { icon: MessageCircle, label: t('messaging.stats.whatsapp'), value: stats.whatsapp, accent: 'success' },
            { icon: Mail, label: t('messaging.stats.email'), value: stats.email, accent: 'warning' },
          ]}
        />
      )}
    >
      {!canRead ? (
        <ErrorState
          title={t('platform.actionForbidden')}
          description={t('messaging.loadFailedHint')}
        />
      ) : (
      <ResponsiveAccordionTabs
        tabs={visibleTabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as typeof activeTab)}
        panelIdPrefix="messaging-tab"
      >
        {activeTab === 'work' && (
          <MessagingWorkPanel
            canWrite={canWrite}
            selectedById={selectedById}
            selectedList={selectedList}
            onSelectedByIdChange={setSelectedById}
            onCompose={triggerCompose}
          />
        )}
        {activeTab === 'reports' && (
          <MessagingReportsPanel
            canWrite={canWrite}
            canClearLogs={canClearLogs}
            onClearLogsRequest={() => setConfirmClearLogsOpen(true)}
            onResend={resend}
          />
        )}
        {activeTab === 'setup' && (
          <MessagingSetupPanel
            canWrite={canWrite}
            canEditSetup={canEditSetup}
            onDeleteRequest={setDeleteTemplateId}
          />
        )}
      </ResponsiveAccordionTabs>
      )}

      {canRead && messagingTarget && (
        <Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            templates={templates}
            initialMessage={messagingTarget.initialMessage}
            initialSubject={messagingTarget.initialSubject}
            onClose={() => {
              closeComposer();
              setSelectedById({});
            }}
          />
        </Suspense>
      )}
      <ConfirmAlertDialog open={Boolean(deleteTemplateId)} onOpenChange={(open) => { if (!open) setDeleteTemplateId(null); }} title={t('messaging.deleteTemplateTitle')} description={t('messaging.deleteTemplateDesc')} confirmLabel={t('common.delete')} destructive onConfirm={() => void confirmDeleteTemplate()} />
      <ConfirmAlertDialog open={confirmClearLogsOpen} onOpenChange={setConfirmClearLogsOpen} title={t('messaging.clearLogs')} description={t('messaging.clearLogsDesc')} confirmLabel={t('messaging.clearLogsConfirm')} destructive onConfirm={() => void confirmClearLogs()} />
    </ModulePageShell>
  );
}
