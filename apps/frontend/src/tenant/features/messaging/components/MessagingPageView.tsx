import { Suspense, lazy } from "react";
import { MessageSquare } from "lucide-react";
import { type Message, type StandardMessagingRecipient as MessagingRecipient } from "@mms/shared";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { ModulePageShell } from "@/components/ui/ModulePageShell";
import { ResponsiveAccordionTabs } from "@/components/ui/ResponsiveAccordionTabs";
import { useTranslation } from "@/hooks/useTranslation";
import { MessagingCommandMetrics } from "./MessagingCommandMetrics";
import { MessagingPageHeaderActions } from "./MessagingPageHeaderActions";
import { MessagingReportsPanel } from "./MessagingReportsPanel";
import { MessagingSetupPanel } from "./MessagingSetupPanel";
import { MessagingWorkPanel } from "./MessagingWorkPanel";

const MessageComposer = lazy(() => import("@/components/ui/MessageComposer"));

export interface MessagingPageViewProps {
  canRead: boolean;
  canWrite: boolean;
  canViewSetup: boolean;
  canEditSetup: boolean;
  canClearLogs: boolean;
  activeTab: "work" | "reports" | "setup";
  visibleTabs: { id: string; label: string; icon: any }[];
  channelFilter: "all" | "sms" | "whatsapp" | "email";
  startingCampaign: boolean;
  messagingTarget: any;
  templates: any[];
  stats: { total: number; sms: number; whatsapp: number; email: number };
  metricsQueryIsError: boolean;
  deleteTemplateId: string | null;
  confirmClearLogsOpen: boolean;
  handleTabChange: (tab: "work" | "reports" | "setup") => void;
  setChannelFilter: (channel: "all" | "sms" | "whatsapp" | "email") => void;
  setDeleteTemplateId: (id: string | null) => void;
  setConfirmClearLogsOpen: (open: boolean) => void;
  startCampaign: (channel: "whatsapp" | "sms" | "email") => void;
  resend: (log: Message, recipient: MessagingRecipient) => void;
  handleBulkResend: (logs: Message[], recipients: MessagingRecipient[], targetChannel?: "whatsapp" | "sms" | "email") => void;
  confirmDeleteTemplate: () => Promise<void>;
  confirmClearLogs: () => Promise<void>;
  handleDispatchSent: () => void;
  closeComposer: () => void;
  refetchMetrics: () => void;
}

export function MessagingPageView({
  canRead,
  canWrite,
  canEditSetup,
  canClearLogs,
  activeTab,
  visibleTabs,
  channelFilter,
  startingCampaign,
  messagingTarget,
  templates,
  stats,
  metricsQueryIsError,
  deleteTemplateId,
  confirmClearLogsOpen,
  handleTabChange,
  setChannelFilter,
  setDeleteTemplateId,
  setConfirmClearLogsOpen,
  startCampaign,
  resend,
  handleBulkResend,
  confirmDeleteTemplate,
  confirmClearLogs,
  handleDispatchSent,
  closeComposer,
  refetchMetrics,
}: MessagingPageViewProps): React.JSX.Element {
  const { t } = useTranslation();



  return (
    <ModulePageShell
      seoTitle={`MMS - ${t("nav.messaging")}`}
      seoDescription={t("messaging.subtitle")}
      headerIcon={MessageSquare}
      headerTitle={t("messaging.title")}
      headerSubtitle={t("messaging.subtitle")}
      headerActions={
        <MessagingPageHeaderActions
          canWrite={canWrite}
          startingCampaign={startingCampaign}
          onStartCampaign={startCampaign}
        />
      }
      metricsStrip={
        <MessagingCommandMetrics
          canRead={canRead}
          isError={metricsQueryIsError}
          onRetry={refetchMetrics}
          stats={stats}
        />
      }
    >
      {!canRead ? (
        <ErrorState
          title={t("platform.actionForbidden")}
          description={t("messaging.loadFailedHint")}
        />
      ) : (
        <ResponsiveAccordionTabs
          tabs={visibleTabs}
          activeTab={activeTab}
          onTabChange={(tab) => handleTabChange(tab as typeof activeTab)}
          panelIdPrefix="messaging-tab"
        >
          {activeTab === "work" && (
            <MessagingWorkPanel
              canWrite={canWrite}
              canClearLogs={canClearLogs}
              onClearLogsRequest={() => setConfirmClearLogsOpen(true)}
              onResend={resend}
              onBulkResend={handleBulkResend}
              channel={channelFilter}
              onChannelChange={setChannelFilter}
            />
          )}
          {activeTab === "reports" && <MessagingReportsPanel canWrite={canWrite} />}
          {activeTab === "setup" && (
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
            onSent={handleDispatchSent}
            onClose={closeComposer}
          />
        </Suspense>
      )}

      <ConfirmAlertDialog
        open={Boolean(deleteTemplateId)}
        onOpenChange={(open) => {
          if (!open) setDeleteTemplateId(null);
        }}
        title={t("messaging.deleteTemplateTitle")}
        description={t("messaging.deleteTemplateDesc")}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => void confirmDeleteTemplate()}
      />
      
      <ConfirmAlertDialog
        open={confirmClearLogsOpen}
        onOpenChange={setConfirmClearLogsOpen}
        title={t("messaging.clearLogs")}
        description={t("messaging.clearLogsDesc")}
        confirmLabel={t("messaging.clearLogsConfirm")}
        destructive
        onConfirm={() => void confirmClearLogs()}
      />
    </ModulePageShell>
  );
}
