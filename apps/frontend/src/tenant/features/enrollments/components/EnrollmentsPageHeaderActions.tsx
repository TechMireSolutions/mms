import React from "react";
import { Download, Plus } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";

import { useTranslation } from "@/hooks/useTranslation";

export interface EnrollmentsPageHeaderActionsProps {
  canExport: boolean;
  canWriteEnrollments: boolean;
  showDeleted: boolean;
  t: ReturnType<typeof useTranslation>["t"];
  onExport: () => void;
  onNew: () => void;
}

export function EnrollmentsPageHeaderActions({
  canExport,
  canWriteEnrollments,
  showDeleted,
  t,
  onExport,
  onNew,
}: EnrollmentsPageHeaderActionsProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      {canExport && !showDeleted ? (
        <ActionButton variant="ghost" icon={Download} onClick={onExport}>
          {t("common.export")}
        </ActionButton>
      ) : null}
      {canWriteEnrollments && !showDeleted && (
        <ActionButton variant="primary" icon={Plus} onClick={onNew}>
          {t("enrollments.new")}
        </ActionButton>
      )}
    </div>
  );
}
