import { Plus } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { useTranslation } from "@/hooks/useTranslation";

interface ObligationsPageActionsProps {
  canWrite: boolean;
  showDeleted: boolean;
  onCreate: () => void;
}

export function ObligationsPageActions({ canWrite, showDeleted, onCreate }: ObligationsPageActionsProps) {
  const { t } = useTranslation();

  if (!canWrite || showDeleted) return null;

  return (
    <ActionButton variant="primary" icon={Plus} onClick={onCreate}>
      {t("obligations.newCollection")}
    </ActionButton>
  );
}
