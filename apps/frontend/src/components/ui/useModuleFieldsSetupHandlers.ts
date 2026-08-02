import { useState } from "react";
import type { CustomFieldConfig } from "@/components/ui/CustomFieldsBuilder";
import { type FieldDefinition } from "@mms/shared";
import type { UseFieldsEditorResult } from "@/components/ui/moduleFieldsSetupShared";

interface UseModuleFieldsSetupHandlersOptions {
  editor: UseFieldsEditorResult;
  onStateChange?: () => void;
}

export function useModuleFieldsSetupHandlers({ editor, onStateChange }: UseModuleFieldsSetupHandlersOptions) {
  const [isAddTabModalOpen, setIsAddTabModalOpen] = useState(false);
  const [newTabLabel, setNewTabLabel] = useState("");
  const [renamingTabKey, setRenamingTabKey] = useState<string | null>(null);
  const [renameTabLabel, setRenameTabLabel] = useState("");

  const triggerChange = (action: () => void) => {
    action();
    if (onStateChange) onStateChange();
  };

  const isUniqueField = (tabId: string, fieldId: string): boolean =>
    editor.tabFieldUnique[tabId]?.has(fieldId) || false;

  const runDeleteAction = async (
    action: () => void | boolean | Promise<void | boolean>,
  ): Promise<void> => {
    const result = await Promise.resolve(action());
    // Guards return false when blocked; sync deletes return void (treat as success).
    if (result !== false && onStateChange) onStateChange();
  };

  return {
    isAddTabModalOpen,
    setIsAddTabModalOpen,
    newTabLabel,
    setNewTabLabel,
    renamingTabKey,
    setRenamingTabKey,
    renameTabLabel,
    setRenameTabLabel,
    isUniqueField,
    handleToggleTabEnabled: (tabId: string) => triggerChange(() => editor.toggleTabEnabled(tabId)),
    handleToggleTabRequired: (tabId: string) => triggerChange(() => editor.toggleTabRequired(tabId)),
    handleToggleFieldEnabled: (tabId: string, fieldId: string) => triggerChange(() => editor.toggleFieldEnabled(tabId, fieldId)),
    handleToggleFieldRequired: (tabId: string, fieldId: string) => triggerChange(() => editor.toggleFieldRequired(tabId, fieldId)),
    handleToggleFieldUnique: (tabId: string, fieldId: string) => triggerChange(() => editor.toggleFieldUnique(tabId, fieldId)),
    handleReorderFields: (tabId: string, reorderedFields: FieldDefinition[]) => triggerChange(() => editor.handleReorder(tabId, reorderedFields)),
    handleCustomFieldsChangeLocal: (tabId: string, newFields: CustomFieldConfig[]) =>
      triggerChange(() => editor.handleCustomFieldsChange(tabId, newFields)),
    handleEditFieldLocal: (tabId: string, updatedField: FieldDefinition) =>
      triggerChange(() => editor.handleEditField(tabId, updatedField)),
    handleDeleteFieldLocal: (tabId: string, fieldId: string) =>
      void runDeleteAction(() => editor.handleDeleteField(tabId, fieldId)),
    handleAddTabLocal: (label: string) => triggerChange(() => editor.handleAddTab(label)),
    handleDeleteTabLocal: (key: string) => void runDeleteAction(() => editor.handleDeleteTab(key)),
    handleRenameTabLocal: (key: string, newLabel: string) => triggerChange(() => editor.handleRenameTab(key, newLabel)),
    triggerChange,
  };
}
