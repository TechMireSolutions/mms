import React from "react";
import { Plus, Pencil } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { FormModal } from "@/components/ui/FormModal";
import { Field } from "@/components/ui/FormPrimitives";

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
}: ModuleFieldsSetupTabModalsProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <>
      <FormModal
        open={isAddTabModalOpen}
        onClose={() => {
          setIsAddTabModalOpen(false);
          setNewTabLabel("");
        }}
        title={t("contacts.setup.addCustomTab")}
        icon={Plus}
        onSave={() => {
          onAddTab(newTabLabel);
          setIsAddTabModalOpen(false);
          setNewTabLabel("");
        }}
        saveDisabled={!newTabLabel.trim()}
        saveLabel={t("contacts.setup.addTab")}
      >
        <div className="text-start">
          <Field id="newTabLabel" label={t("contacts.setup.customTabName")} required>
          <Input
            id="newTabLabel"
            name="newTabLabel"
            value={newTabLabel}
            onChange={(event) => setNewTabLabel(event.target.value)}
            placeholder={t("contacts.setup.addCustomTabPlaceholder")}
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
        title={t("contacts.setup.renameTab")}
        icon={Pencil}
        onSave={() => {
          if (renamingTabKey) {
            onRenameTab(renamingTabKey, renameTabLabel);
          }
          setRenamingTabKey(null);
          setRenameTabLabel("");
        }}
        saveDisabled={!renameTabLabel.trim()}
        saveLabel={t("contacts.setup.renameTabButton")}
      >
        <div className="text-start">
          <Field id="renameTabLabel" label={t("contacts.setup.customTabName")} required>
          <Input
            id="renameTabLabel"
            name="renameTabLabel"
            value={renameTabLabel}
            onChange={(event) => setRenameTabLabel(event.target.value)}
            placeholder={t("contacts.setup.addCustomTabPlaceholder")}
            autoFocus
            required
          />
          </Field>
        </div>
      </FormModal>
    </>
  );
}
