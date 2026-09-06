import React, { type JSX, type ReactNode, type ComponentType } from "react";
import { ModuleWorkBulkActionBar } from "@/components/ui/ModuleWorkBulkActionBar";
import { useTranslation } from "@/hooks/useTranslation";
import type { AppTranslationKey } from "@mms/shared";

export interface ModuleStandardBulkActionBarProps {
  selectedCount: number;
  showDeleted: boolean;
  canDelete: boolean;
  onRequestBulkDelete: () => void;
  onRequestBulkRestore: () => void;
  onClearSelection: () => void;
  bulkActions?: readonly string[];
  leadingIcon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  i18nNamespace: string;
  extraActions?: ReactNode;
  exportAction?: {
    label: string;
    onClick: () => void | Promise<void>;
  };
}

/** Standard manifest-aware Work bulk action bar for modules without custom messaging channels. */
export function ModuleStandardBulkActionBar({
  selectedCount,
  showDeleted,
  canDelete,
  onRequestBulkDelete,
  onRequestBulkRestore,
  onClearSelection,
  bulkActions,
  leadingIcon: LeadingIcon,
  i18nNamespace,
  extraActions,
  exportAction,
}: ModuleStandardBulkActionBarProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <ModuleWorkBulkActionBar
      selectedCount={selectedCount}
      viewingDeleted={showDeleted}
      countLabel={t(`${i18nNamespace}.trash.selected` as AppTranslationKey, { count: selectedCount })}
      leading={<LeadingIcon className="w-4 h-4 text-primary" aria-hidden="true" />}
      deselectLabel={t("common.deselect")}
      canDelete={canDelete}
      restoreLabel={t(`${i18nNamespace}.trash.restore` as AppTranslationKey)}
      onRequestBulkRestore={onRequestBulkRestore}
      onClearSelection={onClearSelection}
      deleteAction={
        (!bulkActions || bulkActions.includes("delete")) && canDelete
          ? { label: t("common.delete"), onClick: onRequestBulkDelete }
          : undefined
      }
      exportAction={exportAction}
      extraActions={extraActions}
    />
  );
}
