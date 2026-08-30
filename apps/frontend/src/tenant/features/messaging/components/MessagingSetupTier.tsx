import React, { useMemo, useState } from "react";
import {
  MESSAGING_MODULE_MANIFEST,
  mergeMessageTemplates,
  findUnknownPersonalizationTokens,
  type MessageCategory,
  type MessageTemplate,
} from "@mms/shared";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ErrorState } from "@/components/ui/ErrorState";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { SubTabBar } from "@/components/ui/SubTabBar";
import { useTranslation } from "@/hooks/useTranslation";
import { notify } from "@/lib/notify";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { useModuleSetupSubTabs } from "@/lib/setup/useModuleSetupSubTabs";
import { useMessageTemplates, useMessagingMutations } from "../hooks/useMessaging";
import { useMessagingTemplatesColumnLayout } from "../hooks/useMessagingColumnLayouts";
import { useMessagingPageOptions } from "../hooks/useMessagingPageOptions";
import { MessagingSetupTemplateForm } from "./MessagingSetupTemplateForm";
import { MessagingTemplateList } from "./MessagingTemplateList";

export interface MessagingSetupTierProps {
  canWrite: boolean;
  canEditSetup: boolean;
  onDeleteRequest: (templateId: string) => void;
}

export const MessagingSetupTier = React.memo(function MessagingSetupTier({
  canWrite,
  canEditSetup,
  onDeleteRequest,
}: MessagingSetupTierProps): React.JSX.Element {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { categorySelectOptions, templateCategorySelectOptions, channelSelectOptions, categoryBadgeConfig } =
    useMessagingPageOptions();
  const templatesQuery = useMessageTemplates();
  const { saveTemplate } = useMessagingMutations();
  const { getColumnWidth, setColumnWidth } = useMessagingTemplatesColumnLayout();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<MessageCategory>("general");
  const [channel, setChannel] = useState<"all" | "sms" | "whatsapp" | "email">("all");

  const isFormDirty = Boolean(label.trim() || body.trim() || editingId);

  const subTabs = useModuleSetupSubTabs({
    initialKey: MESSAGING_MODULE_MANIFEST.setupSubTabs[0] || "templates",
    isDirty: () => isFormDirty,
    onDiscard: () => {
      resetForm();
    },
  });

  const setupTabs = useMemo(
    () => MESSAGING_MODULE_MANIFEST.setupSubTabs.map((key) => ({ key, label: t("messaging.tabs.templates") })),
    [t],
  );
  const templates = useMemo(() => mergeMessageTemplates(templatesQuery.templates), [templatesQuery.templates]);
  const filteredTemplates = useMemo(
    () =>
      templates.filter(
        (template) =>
          (!search.trim() ||
            template.label.toLowerCase().includes(search.toLowerCase()) ||
            template.body.toLowerCase().includes(search.toLowerCase())) &&
          (categoryFilter === "all" || (template.category || "general") === categoryFilter),
      ),
    [categoryFilter, search, templates],
  );

  const resetForm = (): void => {
    setEditingId(null);
    setLabel("");
    setBody("");
    setCategory("general");
    setChannel("all");
  };

  const save = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!user) return;
    if (!label.trim() || !body.trim()) {
      notify.error(t("messaging.createPresetDesc"));
      return;
    }
    const unknownTokens = findUnknownPersonalizationTokens(body.trim());
    if (unknownTokens.length > 0) {
      notify.error(t("messaging.unknownTokens", { tokens: unknownTokens.map((token) => `{${token}}`).join(", ") }));
      return;
    }
    try {
      await saveTemplate.mutateAsync({
        body: { id: editingId ?? undefined, label: label.trim(), body: body.trim(), category, channel },
      });
      notify.success(t("messaging.saveTemplate"));
      resetForm();
    } catch {
      // Mutation hook reports the failure.
    }
  };

  const handleEdit = (template: MessageTemplate): void => {
    setEditingId(template.id);
    setLabel(template.label);
    setBody(template.body);
    setCategory(template.category || "general");
    setChannel(template.channel || "all");
  };

  const handleDuplicate = async (template: MessageTemplate): Promise<void> => {
    if (!user) return;
    const unknownTokens = findUnknownPersonalizationTokens(template.body);
    if (unknownTokens.length > 0) {
      notify.error(t("messaging.unknownTokens", { tokens: unknownTokens.map((token) => `{${token}}`).join(", ") }));
      return;
    }
    try {
      await saveTemplate.mutateAsync({
        body: {
          label: `${template.label} (${t("messaging.tagCustom")})`,
          body: template.body,
          category: template.category || "general",
          channel: template.channel || "all",
        },
      });
      notify.success(t("messaging.duplicateSuccess"));
    } catch {
      // Mutation hook reports the failure.
    }
  };

  const handleCopy = async (templateBody: string): Promise<void> => {
    await navigator.clipboard.writeText(templateBody);
    notify.success(t("messaging.copySuccess"));
  };

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
                    onReset={resetForm}
                    onSave={(event) => void save(event)}
                    onLabelChange={setLabel}
                    onBodyChange={setBody}
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
                    onCopy={(body) => void handleCopy(body)}
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
