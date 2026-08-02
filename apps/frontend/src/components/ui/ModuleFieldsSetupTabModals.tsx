import React from "react";
import { Plus, Pencil } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { FormModal } from "@/components/ui/FormModal";
import { Field } from "@/components/ui/FormPrimitives";
import type { ModuleFieldsSetupCopy } from "@/components/ui/moduleFieldsSetupShared";

export interface ModuleFieldsSetupTabModalsProps {
  isAddTabModalOpen: boolean;
  setIsAddTabModalOpen: (open: boolean) => void;
  newTabLabel: string;
  setNewTabLabel: (label: string) => void;
  onAddTab: (label: string) => void;
  renamingTabKey: string | null;
  setRenamingTabKey: (key: string | null) => void;
  renameTabLabel: string;
  setRenameTabLabel: (label: string) => void;
  onRenameTab: (key: string, label: string) => void;
  copy?: ModuleFieldsSetupCopy;
}

export function ModuleFieldsSetupTabModals({
  isAddTabModalOpen,
  setIsAddTabModalOpen,
  newTabLabel,
  setNewTabLabel,
  onAddTab,
  renamingTabKey,
  setRenamingTabKey,
  renameTabLabel,
  setRenameTabLabel,
  onRenameTab,
  copy,
}: ModuleFieldsSetupTabModalsProps): React.ReactElement {
  const { t } = useTranslation();
  const addCustomTab = copy?.addCustomTab ?? t("fields.setup.addCustomTab");
  const addTab = copy?.addTab ?? t("fields.setup.addTab");
  const renameTab = copy?.renameTab ?? t("fields.setup.renameTab");
  const renameTabButton = copy?.renameTabButton ?? t("fields.setup.renameTabButton");
  const customTabName = copy?.customTabName ?? t("fields.setup.customTabName");
  const placeholder = copy?.addCustomTabPlaceholder ?? t("fields.setup.addCustomTabPlaceholder");

  return (
    <>
      <FormModal
        open={isAddTabModalOpen}
        onClose={() => {
          setIsAddTabModalOpen(false);
          setNewTabLabel("");
        }}
        title={addCustomTab}
        icon={Plus}
        onSave={() => {
          onAddTab(newTabLabel);
          setIsAddTabModalOpen(false);
          setNewTabLabel("");
        }}
        saveDisabled={!newTabLabel.trim()}
        saveLabel={addTab}
      >
        <div className="text-start">
          <Field id="newTabLabel" label={customTabName} required>
            <Input
              id="newTabLabel"
              name="newTabLabel"
              value={newTabLabel}
              onChange={(event) => setNewTabLabel(event.target.value)}
              placeholder={placeholder}
              autoFocus
              required
            />
          </Field>
        </div>
      </FormModal>

      <FormModal
        open={renamingTabKey !== null}
        onClose={() => {
          setRenamingTabKey(null);
          setRenameTabLabel("");
        }}
        title={renameTab}
        icon={Pencil}
        onSave={() => {
          if (renamingTabKey) {
            onRenameTab(renamingTabKey, renameTabLabel);
          }
          setRenamingTabKey(null);
          setRenameTabLabel("");
        }}
        saveDisabled={!renameTabLabel.trim()}
        saveLabel={renameTabButton}
      >
        <div className="text-start">
          <Field id="renameTabLabel" label={customTabName} required>
            <Input
              id="renameTabLabel"
              name="renameTabLabel"
              value={renameTabLabel}
              onChange={(event) => setRenameTabLabel(event.target.value)}
              placeholder={placeholder}
              autoFocus
              required
            />
          </Field>
        </div>
      </FormModal>
    </>
  );
}
