import React, { useState } from "react";
import {
  MESSAGING_MODULE_MANIFEST,
  mergeMessageTemplates,
} from "@mms/shared";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ErrorState } from "@/components/ui/ErrorState";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useTranslation } from "@/hooks/useTranslation";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { useModuleSetupSubTabs } from "@/lib/setup/useModuleSetupSubTabs";
import { useMessageTemplates } from "../hooks/useMessaging";
import { useMessagingTemplatesColumnLayout } from "../hooks/useMessagingColumnLayouts";
import { useMessagingPageOptions } from "../hooks/useMessagingPageOptions";
import { useMessagingTemplateEditor } from "../hooks/useMessagingTemplateEditor";
import { MessagingSetupTemplateForm } from "./MessagingSetupTemplateForm";
import { MessagingTemplateList } from "./MessagingTemplateList";

export interface MessagingSetupTierProps {
  canWrite: boolean;
  canEditSetup: boolean;
  onDeleteRequest: (templateId: string) => void;
}

export const MessagingSetupTier = (function MessagingSetupTier({
  canWrite,
  canEditSetup,
  onDeleteRequest,
}: MessagingSetupTierProps): React.JSX.Element {
  const { t } = useTranslation();
  const { categorySelectOptions, templateCategorySelectOptions, channelSelectOptions, categoryBadgeConfig } =
    useMessagingPageOptions();
  const templatesQuery = useMessageTemplates();
  const { getColumnWidth, setColumnWidth } = useMessagingTemplatesColumnLayout();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const editor = useMessagingTemplateEditor();
  const {
    editingId,
    label,
    body,
    category,
    setCategory,
    channel,
    setChannel,
    errors,
    isFormDirty,
    resetForm,
    handleLabelChange,
    handleBodyChange,
    save,
    handleEdit,
    handleDuplicate,
    handleCopy,
  } = editor;

  const subTabs = useModuleSetupSubTabs({
    initialKey: MESSAGING_MODULE_MANIFEST.setupSubTabs[0] || "templates",
    isDirty: () => isFormDirty,
    onDiscard: resetForm,
  });

  const setupTabs = (() => MESSAGING_MODULE_MANIFEST.setupSubTabs.map((key) => ({ key, label: t("messaging.tabs.templates") })))();
  const templates = (() => mergeMessageTemplates(templatesQuery.templates))();
  const filteredTemplates = (() =>
      templates.filter(
        (template) =>
          (!search.trim() ||
            template.label.toLowerCase().includes(search.toLowerCase()) ||
            template.body.toLowerCase().includes(search.toLowerCase())) &&
          (categoryFilter === "all" || (template.category || "general") === categoryFilter),
      ))();

  if (templatesQuery.isError) {
    return (
      <ErrorState
        title={t("messaging.loadFailed")}
        description={t("messaging.loadFailedHint")}
        onRetry={() => { void templatesQuery.refetch(); }}
      />
    );
  }

  return (
    <ModuleTierMotion tier="setup">
      <ErrorBoundary>
        <div className="space-y-4">
          {!canEditSetup ? (
            <SetupReadOnlyMessage title={t("messaging.setup.readOnly")} />
          ) : (
            <>
              {setupTabs.length > 1 && (
                <SubTabBar tabs={setupTabs} value={subTabs.sub} onChange={subTabs.handleSubTabChange} />
              )}
              {subTabs.sub === "templates" && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <MessagingSetupTemplateForm
                    editingId={editingId}
                    label={label}
                    body={body}
                    category={category}
                    channel={channel}
                    templateCategorySelectOptions={templateCategorySelectOptions}
                    channelSelectOptions={channelSelectOptions}
                    errors={errors}
                    onReset={resetForm}
                    onSave={(event) => void save(event)}
                    onLabelChange={handleLabelChange}
                    onBodyChange={handleBodyChange}
                    onCategoryChange={setCategory}
                    onChannelChange={setChannel}
                  />
                  <MessagingTemplateList
                    templates={filteredTemplates}
                    canWrite={canWrite}
                    search={search}
                    categoryFilter={categoryFilter}
                    categorySelectOptions={categorySelectOptions}
                    categoryBadgeConfig={categoryBadgeConfig}
                    getColumnWidth={getColumnWidth}
                    setColumnWidth={setColumnWidth}
                    onSearch={setSearch}
                    onCategoryFilter={setCategoryFilter}
                    onCopy={(copyBody) => void handleCopy(copyBody)}
                    onDuplicate={(template) => void handleDuplicate(template)}
                    onEdit={handleEdit}
                    onDeleteRequest={onDeleteRequest}
                  />
                </div>
              )}

              <ConfirmAlertDialog
                open={subTabs.discardConfirmOpen}
                onOpenChange={(open) => {
                  if (!open) subTabs.clearPendingSubTab();
                }}
                title={t("settings.unsavedChanges")}
                description={t("messaging.setup.discardUnsavedTemplateConfirm")}
                confirmLabel={t("common.yes")}
                cancelLabel={t("common.cancel")}
                destructive
                onConfirm={subTabs.handleConfirmDiscard}
              />
            </>
          )}
        </div>
      </ErrorBoundary>
    </ModuleTierMotion>
  );
});

export default MessagingSetupTier;

