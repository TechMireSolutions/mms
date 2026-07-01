import React, { useState } from "react";
import { Info, Layout, GripVertical, Plus, Trash2, Pencil } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal } from "@/components/ui/Modal";
import { CoreFieldEditorList } from "./CoreFieldEditorList";
import { CustomFieldsBuilder, type CustomFieldConfig } from "./CustomFieldsBuilder";
import { type FieldDefinition, type TabDefinition } from "@mms/shared";

interface UseFieldsEditorResult {
  formTabs: TabDefinition[];
  tabFields: Record<string, FieldDefinition[]>;
  enabledTabs: Set<string>;
  requiredTabs: Set<string>;
  tabFieldEnabled: Record<string, Set<string>>;
  tabFieldRequired: Record<string, Set<string>>;
  tabFieldUnique: Record<string, Set<string>>;
  tabFieldDefaultValues: Record<string, Record<string, unknown>>;
  tabFieldPermissions: Record<string, Record<string, string[]>>;
  tabFieldOrder: Record<string, string[]>;

  toggleTabEnabled: (tabId: string) => void;
  toggleTabRequired: (tabId: string) => void;
  toggleFieldEnabled: (tabId: string, fieldId: string) => void;
  toggleFieldRequired: (tabId: string, fieldId: string) => void;
  toggleFieldUnique: (tabId: string, fieldId: string) => void;
  handleReorder: (tabId: string, reorderedFields: FieldDefinition[]) => void;
  handleCustomFieldsChange: (tabId: string, newFields: CustomFieldConfig[]) => void;
  handleEditField: (tabId: string, updatedField: FieldDefinition) => void;
  handleDeleteField: (tabId: string, fieldId: string) => void;
  handleAddTab: (label: string) => void;
  handleDeleteTab: (key: string) => void;
  handleRenameTab: (key: string, newLabel: string) => void;
}

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

function getOrderedFields(fields: FieldDefinition[], savedOrder: string[] | undefined): FieldDefinition[] {
  if (!savedOrder || savedOrder.length === 0) return fields;
  const orderByKey = Object.fromEntries(savedOrder.map((key, index) => [key, index]));
  return [...fields].sort((leftField, rightField) => (orderByKey[leftField.key] ?? 9999) - (orderByKey[rightField.key] ?? 9999)) as FieldDefinition[];
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
  const [isAddTabModalOpen, setIsAddTabModalOpen] = useState(false);
  const [newTabLabel, setNewTabLabel] = useState("");
  const [renamingTabKey, setRenamingTabKey] = useState<string | null>(null);
  const [renameTabLabel, setRenameTabLabel] = useState("");

  const triggerChange = (action: () => void) => {
    action();
    if (onStateChange) onStateChange();
  };

  const handleToggleTabEnabled = (tabId: string) => triggerChange(() => editor.toggleTabEnabled(tabId));
  const handleToggleTabRequired = (tabId: string) => triggerChange(() => editor.toggleTabRequired(tabId));
  const handleToggleFieldEnabled = (tabId: string, fieldId: string) => triggerChange(() => editor.toggleFieldEnabled(tabId, fieldId));
  const handleToggleFieldRequired = (tabId: string, fieldId: string) => triggerChange(() => editor.toggleFieldRequired(tabId, fieldId));
  const handleToggleFieldUnique = (tabId: string, fieldId: string) => triggerChange(() => editor.toggleFieldUnique(tabId, fieldId));
  const handleReorderFields = (tabId: string, reorderedFields: FieldDefinition[]) => triggerChange(() => editor.handleReorder(tabId, reorderedFields));
  
  const handleCustomFieldsChangeLocal = (tabId: string, newFields: CustomFieldConfig[]) =>
    triggerChange(() => editor.handleCustomFieldsChange(tabId, newFields));

  const handleEditFieldLocal = (tabId: string, updatedField: FieldDefinition) =>
    triggerChange(() => editor.handleEditField(tabId, updatedField));

  const handleDeleteFieldLocal = (tabId: string, fieldId: string) =>
    triggerChange(() => editor.handleDeleteField(tabId, fieldId));

  const handleAddTabLocal = (label: string) =>
    triggerChange(() => editor.handleAddTab(label));

  const handleDeleteTabLocal = (key: string) =>
    triggerChange(() => editor.handleDeleteTab(key));

  const handleRenameTabLocal = (key: string, newLabel: string) =>
    triggerChange(() => editor.handleRenameTab(key, newLabel));

  const isUniqueField = (tabId: string, fieldId: string): boolean =>
    editor.tabFieldUnique[tabId]?.has(fieldId) || false;

  return (
    <div className="space-y-4">
      {/* Intro info box */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/30 text-sm text-info text-left">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-xs">{introTitle || t("contacts.setup.fieldsIntroTitle") || "Dynamic Fields Manager"}</h4>
          <p className="text-[11px] mt-0.5 text-info/90">
            {introDescription || t("contacts.setup.fieldsIntroDescription") || "Configure visible sections, reorder fields, and manage custom metadata definitions."}
          </p>
        </div>
      </div>

      {/* Fields header */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-left">
        <div className="flex items-center gap-2">
          <Layout className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">{t("contacts.setup.fieldsByTab") || "Fields By Tab"}</h3>
          <span className="text-xs text-muted-foreground ml-1 flex items-center gap-1">
            <span>— {t("contacts.setup.dragToReorder") || "drag"} </span>
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/60 inline align-middle" />
            <span>{t("contacts.setup.toReorder") || "to reorder"}</span>
          </span>
        </div>
      </div>

      {/* Tabs list */}
      <div className="space-y-3">
        {editor.formTabs.map((tab) => {
          const tabId = tab.key;
          const tabLabel = tab.label.charAt(0).toUpperCase() + tab.label.slice(1);
          const tabDesc = tab.description || (tab.isSystem === false ? t("contacts.setup.customTabDescription") || "Custom user-defined tab" : "");
          const tabDefs = editor.tabFields[tabId] || [];
          const enabledSet = editor.tabFieldEnabled[tabId] || new Set();
          const requiredSet = editor.tabFieldRequired[tabId] || new Set();
          const isOn = tabId === "basic" ? true : editor.enabledTabs.has(tabId);
          const isReq = editor.requiredTabs.has(tabId);

          return (
            <section key={tabId} className="rounded-xl border border-border bg-card overflow-hidden text-left">
              <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={isOn}
                    onCheckedChange={tabId !== "basic" ? () => handleToggleTabEnabled(tabId) : undefined}
                    aria-label={`${t("contacts.setup.enableTab") || "Enable Tab"} ${tabLabel}`}
                    disabled={tabId === "basic"}
                  />
                </div>
                <div className="flex-1 min-w-0 ml-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{tabLabel}</span>
                    {!tab.isSystem && (
                      <div className="flex items-center gap-1.5 ml-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setRenamingTabKey(tabId);
                            setRenameTabLabel(tab.label);
                          }}
                          className="p-1 h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground shadow-none flex items-center justify-center"
                          title={t("common.edit") || "Rename"}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleDeleteTabLocal(tabId)}
                          className="p-1 h-6 w-6 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shadow-none flex items-center justify-center"
                          title={t("common.delete") || "Delete"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{tabDesc}</p>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                  {tabDefs.filter((field) => enabledSet.has(field.key)).length}/{tabDefs.length}
                </span>
                {tabId !== "basic" && isOn && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleToggleTabRequired(tabId)}
                    className={`flex-shrink-0 px-2.5 py-1 h-auto text-[10px] font-bold border transition-all shadow-none ml-2
                      ${
                        isReq
                          ? "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20 hover:text-destructive"
                          : "bg-muted border-border text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {isReq ? t("contacts.setup.fieldRequired") || "Required" : t("contacts.setup.fieldOptional") || "Optional"}
                  </Button>
                )}
              </div>

              {isOn && (
                <div className="p-3 space-y-3">
                  <CoreFieldEditorList
                    tabId={tabId}
                    fields={getOrderedFields(tabDefs, editor.tabFieldOrder[tabId])}
                    enabledSet={enabledSet}
                    requiredSet={requiredSet}
                    onToggleEnabled={(fieldId: string) => handleToggleFieldEnabled(tabId, fieldId)}
                    onToggleRequired={(fieldId: string) => handleToggleFieldRequired(tabId, fieldId)}
                    onToggleUnique={(fieldId: string) => handleToggleFieldUnique(tabId, fieldId)}
                    onReorder={(reordered: FieldDefinition[]) => handleReorderFields(tabId, reordered)}
                    isUniqueField={isUniqueField}
                    isCoreField={(key: string) => isCoreField(tabId, key)}
                    defaultValues={editor.tabFieldDefaultValues[tabId]}
                    permissions={editor.tabFieldPermissions[tabId]}
                    onChangeDefaults={(fieldId: string, fieldValue: unknown) => {
                      triggerChange(() => {
                        editor.tabFieldDefaultValues[tabId] = {
                          ...(editor.tabFieldDefaultValues[tabId] || {}),
                          [fieldId]: fieldValue,
                        };
                      });
                    }}
                    onChangePermissions={(fieldId: string, roles: string[]) => {
                      triggerChange(() => {
                        editor.tabFieldPermissions[tabId] = {
                          ...(editor.tabFieldPermissions[tabId] || {}),
                          [fieldId]: roles,
                        };
                      });
                    }}
                    onEditField={(fieldDefinition: FieldDefinition) => handleEditFieldLocal(tabId, fieldDefinition)}
                    onDeleteField={(fieldId: string) => handleDeleteFieldLocal(tabId, fieldId)}
                    labels={labels}
                  />
                  <div className="border-t border-border pt-3">
                    <CustomFieldsBuilder
                      fields={(editor.tabFields[tabId] || []).map((field) => ({ ...field, id: field.key })) as unknown as CustomFieldConfig[]}
                      droppableId={`custom-fields-${tabId}`}
                      onChange={(customFields) => handleCustomFieldsChangeLocal(tabId, customFields)}
                    />
                  </div>
                </div>
              )}
            </section>
          );
        })}

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={() => setIsAddTabModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all shadow-none"
          >
            <Plus className="w-4 h-4" />
            <span>{t("contacts.setup.addCustomTab") || "Add Custom Tab"}</span>
          </Button>
        </div>
      </div>

      {/* Add Tab Modal */}
      <Modal
        open={isAddTabModalOpen}
        onClose={() => {
          setIsAddTabModalOpen(false);
          setNewTabLabel("");
        }}
        title={t("contacts.setup.addCustomTab") || "Add Custom Tab"}
        icon={Plus}
        footer={
          <div className="flex justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddTabModalOpen(false);
                setNewTabLabel("");
              }}
              type="button"
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              onClick={() => {
                handleAddTabLocal(newTabLabel);
                setIsAddTabModalOpen(false);
                setNewTabLabel("");
              }}
              disabled={!newTabLabel.trim()}
              type="button"
            >
              {t("contacts.setup.addTab") || "Add Tab"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-left">
          <label htmlFor="newTabLabel" className="text-xs font-semibold text-foreground">
            {t("contacts.setup.customTabName") || "Tab Name"} *
          </label>
          <Input
            id="newTabLabel"
            value={newTabLabel}
            onChange={(event) => setNewTabLabel(event.target.value)}
            placeholder={t("contacts.setup.addCustomTabPlaceholder") || "e.g. Extra Info"}
            autoFocus
          />
        </div>
      </Modal>

      {/* Rename Tab Modal */}
      <Modal
        open={renamingTabKey !== null}
        onClose={() => {
          setRenamingTabKey(null);
          setRenameTabLabel("");
        }}
        title={t("contacts.setup.renameTab") || "Rename Custom Tab"}
        icon={Pencil}
        footer={
          <div className="flex justify-end gap-2.5">
            <Button
              variant="outline"
              onClick={() => {
                setRenamingTabKey(null);
                setRenameTabLabel("");
              }}
              type="button"
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              onClick={() => {
                if (renamingTabKey) {
                  handleRenameTabLocal(renamingTabKey, renameTabLabel);
                }
                setRenamingTabKey(null);
                setRenameTabLabel("");
              }}
              disabled={!renameTabLabel.trim()}
              type="button"
            >
              {t("contacts.setup.renameTabButton") || "Rename Tab"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-left">
          <label htmlFor="renameTabLabel" className="text-xs font-semibold text-foreground">
            {t("contacts.setup.customTabName") || "Tab Name"} *
          </label>
          <Input
            id="renameTabLabel"
            value={renameTabLabel}
            onChange={(event) => setRenameTabLabel(event.target.value)}
            placeholder={t("contacts.setup.addCustomTabPlaceholder") || "e.g. Extra Info"}
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
}
