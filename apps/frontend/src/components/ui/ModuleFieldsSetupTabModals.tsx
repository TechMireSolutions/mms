import React from "react";
import { Plus, Pencil } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { FormModal } from "@/components/ui/FormModal";

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
        <div className="space-y-3 text-start">
          <label htmlFor="newTabLabel" className="text-xs font-semibold text-foreground">
            {t("contacts.setup.customTabName")} *
          </label>
          <Input
            id="newTabLabel"
            value={newTabLabel}
            onChange={(event) => setNewTabLabel(event.target.value)}
            placeholder={t("contacts.setup.addCustomTabPlaceholder")}
            autoFocus
          />
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
        <div className="space-y-3 text-start">
          <label htmlFor="renameTabLabel" className="text-xs font-semibold text-foreground">
            {t("contacts.setup.customTabName")} *
          </label>
          <Input
            id="renameTabLabel"
            value={renameTabLabel}
            onChange={(event) => setRenameTabLabel(event.target.value)}
            placeholder={t("contacts.setup.addCustomTabPlaceholder")}
            autoFocus
          />
        </div>
      </FormModal>
    </>
  );
}
