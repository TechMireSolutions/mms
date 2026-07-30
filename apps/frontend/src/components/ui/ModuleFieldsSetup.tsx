import React from "react";
import { Info, Layout, GripVertical, Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { ModuleFieldsSetupTabModals } from "@/components/ui/ModuleFieldsSetupTabModals";
import { ModuleFieldsSetupTabCard } from "@/components/ui/ModuleFieldsSetupTabCard";
import type { UseFieldsEditorResult } from "@/components/ui/moduleFieldsSetupShared";
import { useModuleFieldsSetupHandlers } from "@/components/ui/useModuleFieldsSetupHandlers";

interface ModuleFieldsSetupProps {
  editor: UseFieldsEditorResult;
  isCoreField: (tabId: string, fieldKey: string) => boolean;
  onStateChange?: () => void;
  introTitle?: string;
  introDescription?: string;
  labels?: {
    required?: string;
    optional?: string;
    unique?: string;
    standard?: string;
  };
}

export function ModuleFieldsSetup({
  editor,
  isCoreField,
  onStateChange,
  introTitle,
  introDescription,
  labels,
}: ModuleFieldsSetupProps): React.JSX.Element {
  const { t } = useTranslation();
  const handlers = useModuleFieldsSetupHandlers({ editor, onStateChange });

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/30 text-sm text-info text-start">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-xs">{introTitle || t("contacts.setup.fieldsIntroTitle")}</h4>
          <p className="text-xs mt-0.5 text-info/90">
            {introDescription || t("contacts.setup.fieldsIntroDescription")}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 text-start">
        <div className="flex items-center gap-2">
          <Layout className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">{t("contacts.setup.fieldsByTab")}</h3>
          <span className="text-xs text-muted-foreground ms-1 flex items-center gap-1">
            <span>— {t("contacts.setup.dragToReorder")} </span>
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/60 inline align-middle" />
            <span>{t("contacts.setup.toReorder")}</span>
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {editor.formTabs.map((tab) => (
          <ModuleFieldsSetupTabCard
            key={tab.key}
            tab={tab}
            editor={editor}
            isCoreField={isCoreField}
            labels={labels}
            isUniqueField={handlers.isUniqueField}
            onToggleTabEnabled={handlers.handleToggleTabEnabled}
            onToggleTabRequired={handlers.handleToggleTabRequired}
            onToggleFieldEnabled={handlers.handleToggleFieldEnabled}
            onToggleFieldRequired={handlers.handleToggleFieldRequired}
            onToggleFieldUnique={handlers.handleToggleFieldUnique}
            onReorderFields={handlers.handleReorderFields}
            onCustomFieldsChange={handlers.handleCustomFieldsChangeLocal}
            onEditField={handlers.handleEditFieldLocal}
            onDeleteField={handlers.handleDeleteFieldLocal}
            onDeleteTab={handlers.handleDeleteTabLocal}
            onStartRenameTab={(tabId, currentLabel) => {
              handlers.setRenamingTabKey(tabId);
              handlers.setRenameTabLabel(currentLabel);
            }}
            onChangeDefaults={(tabId, fieldId, fieldValue) => {
              handlers.triggerChange(() => {
                editor.tabFieldDefaultValues[tabId] = {
                  ...(editor.tabFieldDefaultValues[tabId] || {}),
                  [fieldId]: fieldValue,
                };
              });
            }}
            onChangePermissions={(tabId, fieldId, roles) => {
              handlers.triggerChange(() => {
                editor.tabFieldPermissions[tabId] = {
                  ...(editor.tabFieldPermissions[tabId] || {}),
                  [fieldId]: roles,
                };
              });
            }}
          />
        ))}

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={() => handlers.setIsAddTabModalOpen(true)}
            className="flex min-h-11 items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-none transition-all hover:bg-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t("contacts.setup.addCustomTab")}</span>
          </Button>
        </div>
      </div>

      <ModuleFieldsSetupTabModals
        isAddTabModalOpen={handlers.isAddTabModalOpen}
        setIsAddTabModalOpen={handlers.setIsAddTabModalOpen}
        newTabLabel={handlers.newTabLabel}
        setNewTabLabel={handlers.setNewTabLabel}
        onAddTab={handlers.handleAddTabLocal}
        renamingTabKey={handlers.renamingTabKey}
        setRenamingTabKey={handlers.setRenamingTabKey}
        renameTabLabel={handlers.renameTabLabel}
        setRenameTabLabel={handlers.setRenameTabLabel}
        onRenameTab={handlers.handleRenameTabLocal}
      />
    </div>
  );
}
