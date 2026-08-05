import React, { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { CoreFieldEditorList } from "@/components/ui/CoreFieldEditorList";
import { CustomFieldsBuilder, type CustomFieldConfig } from "@/components/ui/CustomFieldsBuilder";
import {
  getOrderedFields,
  type ModuleFieldsSetupCopy,
  type UseFieldsEditorResult,
} from "@/components/ui/moduleFieldsSetupShared";
import { useTranslation } from "@/hooks/useTranslation";
import { type FieldDefinition, type TabDefinition, toTitleCase } from "@mms/shared";

interface ModuleFieldsSetupTabCardProps {
  tab: TabDefinition;
  editor: UseFieldsEditorResult;
  isCoreField: (tabId: string, fieldKey: string) => boolean;
  isProtectedTab?: (tabId: string) => boolean;
  isLockedTab?: (tabId: string) => boolean;
  copy?: ModuleFieldsSetupCopy;
  labels?: {
    required?: string;
    optional?: string;
    unique?: string;
    standard?: string;
  };
  isUniqueField: (tabId: string, fieldId: string) => boolean;
  onToggleTabEnabled: (tabId: string) => void;
  onToggleTabRequired: (tabId: string) => void;
  onToggleFieldEnabled: (tabId: string, fieldId: string) => void;
  onToggleFieldRequired: (tabId: string, fieldId: string) => void;
  onToggleFieldUnique: (tabId: string, fieldId: string) => void;
  onReorderFields: (tabId: string, reorderedFields: FieldDefinition[]) => void;
  onCustomFieldsChange: (tabId: string, newFields: CustomFieldConfig[]) => void;
  onEditField: (tabId: string, updatedField: FieldDefinition) => void;
  onDeleteField: (
    tabId: string,
    fieldId: string,
  ) => void | boolean | Promise<void | boolean>;
  onDeleteTab: (key: string) => void | boolean | Promise<void | boolean>;
  onStartRenameTab: (tabId: string, currentLabel: string) => void;
  onChangeDefaults: (tabId: string, fieldId: string, fieldValue: unknown) => void;
  onChangePermissions: (tabId: string, fieldId: string, roles: string[]) => void;
}

export function ModuleFieldsSetupTabCard({
  tab,
  editor,
  isCoreField,
  isProtectedTab,
  isLockedTab,
  copy,
  labels,
  isUniqueField,
  onToggleTabEnabled,
  onToggleTabRequired,
  onToggleFieldEnabled,
  onToggleFieldRequired,
  onToggleFieldUnique,
  onReorderFields,
  onCustomFieldsChange,
  onEditField,
  onDeleteField,
  onDeleteTab,
  onStartRenameTab,
  onChangeDefaults,
  onChangePermissions,
}: ModuleFieldsSetupTabCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const [tabDeleteOpen, setTabDeleteOpen] = useState(false);
  const tabId = tab.key;
  const tabLabel = toTitleCase(tab.labelKey ? t(tab.labelKey) : tab.label);
  const isProtected = isProtectedTab ? isProtectedTab(tabId) : Boolean(tab.isSystem);
  const customTabDescription = copy?.customTabDescription ?? t("fields.setup.customTabDescription");
  const tabDesc = tab.description || (isProtected ? "" : customTabDescription);
  const tabDefs = editor.tabFields[tabId] || [];
  const enabledSet = editor.tabFieldEnabled[tabId] || new Set();
  const requiredSet = editor.tabFieldRequired[tabId] || new Set();
  const locked = isLockedTab ? isLockedTab(tabId) : false;
  const isOn = locked ? true : editor.enabledTabs.has(tabId);
  const isReq = editor.requiredTabs.has(tabId);
  const enableTabLabel = copy?.enableTab ?? t("fields.setup.enableTab");
  const fieldRequired = copy?.fieldRequired ?? t("fields.setup.fieldRequired");
  const fieldOptional = copy?.fieldOptional ?? t("fields.setup.fieldOptional");

  return (
    <Card key={tabId} accentColor="primary" className="p-0 overflow-hidden text-start">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/20 border-b border-border/40 ps-6.5">
        <div className="flex items-center justify-center">
          <Checkbox
            checked={isOn}
            onCheckedChange={!locked ? () => onToggleTabEnabled(tabId) : undefined}
            aria-label={`${enableTabLabel} ${tabLabel}`}
            disabled={locked}
          />
        </div>
        <div className="flex-1 min-w-0 ms-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{tabLabel}</span>
            {!isProtected && (
              <div className="flex items-center gap-1.5 ms-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onStartRenameTab(tabId, tab.label)}
                  className="min-h-11 min-w-11 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground shadow-none flex items-center justify-center"
                  aria-label={t("common.edit")}
                  title={t("common.edit")}
                >
                  <Pencil className="w-3 h-3" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setTabDeleteOpen(true)}
                  className="min-h-11 min-w-11 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shadow-none flex items-center justify-center"
                  aria-label={t("common.delete")}
                  title={t("common.delete")}
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{tabDesc}</p>
        </div>
        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
          {tabDefs.filter((field) => enabledSet.has(field.key)).length}/{tabDefs.length}
        </span>
        {isOn && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onToggleTabRequired(tabId)}
            className={`flex-shrink-0 min-h-11 px-2.5 text-xs font-bold border transition-all shadow-none ms-2
              ${
                isReq
                  ? "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20 hover:text-destructive"
                  : "bg-muted border-border text-muted-foreground hover:text-foreground"
              }`}
          >
            {isReq ? fieldRequired : fieldOptional}
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
            onToggleEnabled={(fieldId: string) => onToggleFieldEnabled(tabId, fieldId)}
            onToggleRequired={(fieldId: string) => onToggleFieldRequired(tabId, fieldId)}
            onToggleUnique={(fieldId: string) => onToggleFieldUnique(tabId, fieldId)}
            onReorder={(reordered: FieldDefinition[]) => onReorderFields(tabId, reordered)}
            isUniqueField={isUniqueField}
            isCoreField={(key: string) => isCoreField(tabId, key)}
            defaultValues={editor.tabFieldDefaultValues[tabId]}
            permissions={editor.tabFieldPermissions[tabId]}
            onChangeDefaults={(fieldId: string, fieldValue: unknown) => onChangeDefaults(tabId, fieldId, fieldValue)}
            onChangePermissions={(fieldId: string, roles: string[]) => onChangePermissions(tabId, fieldId, roles)}
            onEditField={(fieldDefinition: FieldDefinition) => onEditField(tabId, fieldDefinition)}
            onDeleteField={(fieldId: string) => onDeleteField(tabId, fieldId)}
            labels={labels}
          />
          <div className="border-t border-border pt-3">
            <CustomFieldsBuilder
              fields={(editor.tabFields[tabId] || [])
                .filter((field) => !isCoreField(tabId, field.key))
                .map((field) => ({ ...field, id: field.key })) as unknown as CustomFieldConfig[]}
              droppableId={`custom-fields-${tabId}`}
              onChange={(customFields) => {
                const coreFields = (editor.tabFields[tabId] || []).filter((field) =>
                  isCoreField(tabId, field.key),
                );
                onCustomFieldsChange(tabId, [
                  ...(coreFields.map((field) => ({ ...field, id: field.key })) as unknown as CustomFieldConfig[]),
                  ...customFields,
                ]);
              }}
            />
          </div>
        </div>
      )}

      <ConfirmAlertDialog
        open={tabDeleteOpen}
        onOpenChange={setTabDeleteOpen}
        title={t("common.delete")}
        description={t("fields.deleteTabConfirm", { name: tabLabel })}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => onDeleteTab(tabId)}
      />
    </Card>
  );
}
