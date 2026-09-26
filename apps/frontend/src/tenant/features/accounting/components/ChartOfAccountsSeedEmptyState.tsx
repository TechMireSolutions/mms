import React, { useState } from "react";
import { Landmark } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { ConfirmAlertDialog } from "@/components/ui/ConfirmAlertDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { isApiError } from "@/lib/apiClient";
import { notifyApiFailure } from "@/lib/apiErrorNotify";
import { notify } from "@/lib/notify";
import { useSeedDefaultChart } from "@/tenant/features/accounting/hooks/useSeedDefaultChart";

interface ChartOfAccountsSeedEmptyStateProps {
  canWrite: boolean;
  onAddAccount: () => void;
}

/** Shown when the workspace has no accounts at all: offers the default chart or a manual start. */
export function ChartOfAccountsSeedEmptyState({ canWrite, onAddAccount }: ChartOfAccountsSeedEmptyStateProps): React.JSX.Element {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const seed = useSeedDefaultChart();

  const handleConfirm = async (): Promise<void> => {
    try {
      const result = await seed.mutateAsync();
      notify.success(t("accounting.coa.seed.success"), {
        description: t("accounting.coa.seed.successCount", { count: result.count }),
      });
    } catch (error) {
      if (isApiError(error) && error.status === 409) notify.error(t("accounting.coa.seed.alreadyExists"));
      else notifyApiFailure(error, t, "accounting.coa.seed.failed");
    }
  };

  return (
    <>
      <EmptyState
        variant="dashed"
        icon={Landmark}
        title={t("accounting.coa.seed.emptyTitle")}
        description={t(canWrite ? "accounting.coa.seed.emptyDescription" : "accounting.coa.seed.emptyReadOnly")}
        action={canWrite ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="button" className="min-h-11" disabled={seed.isPending} onClick={() => setConfirmOpen(true)}>
              {t("accounting.coa.seed.action")}
            </Button>
            <Button type="button" variant="outline" className="min-h-11" onClick={onAddAccount}>
              {t("accounting.coa.addAccount")}
            </Button>
          </div>
        ) : undefined}
      />
      <ConfirmAlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("accounting.coa.seed.confirmTitle")}
        description={t("accounting.coa.seed.confirmDescription")}
        confirmLabel={t("accounting.coa.seed.action")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleConfirm}
      />
    </>
  );
}
