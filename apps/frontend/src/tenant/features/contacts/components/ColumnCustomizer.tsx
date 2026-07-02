import React, { useMemo } from "react";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleColumnCustomizer } from "@/components/ui/ModuleColumnCustomizer";

/**
 * ColumnCustomizer component rendering a popover that enables users to toggle column visibility
 * and drag-and-drop to reorder visible columns.
 */
export default function ColumnCustomizer(): React.JSX.Element {
  const { columnRegistry, updateUserColumnLayout } = useContactConfig();
  const { t } = useTranslation();

  const labels = useMemo(
    () => ({
      trigger: t("contacts.columns"),
      title: t("contacts.columns"),
      visibleAndOrder: t("contacts.visibleAndOrder"),
      hidden: t("contacts.hidden"),
      fixed: t("contacts.fixed"),
      hideColumn: (label: string) => t("contacts.hideColumn", { label }),
    }),
    [t],
  );

  return (
    <ModuleColumnCustomizer
      columnRegistry={columnRegistry}
      updateUserColumnLayout={updateUserColumnLayout}
      labels={labels}
    />
  );
}
