import React, { lazy, Suspense } from "react";
import { ACCOUNTING_MODULE_MANIFEST, type Account, type FiscalYear } from "@mms/shared";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ModuleTierMotion } from "@/components/ui/ModuleTierMotion";
import { SetupReadOnlyMessage } from "@/components/ui/SetupReadOnlyMessage";
import { useTranslation } from "@/hooks/useTranslation";
import { useModulePermissions } from "@/tenant/hooks/usePermissions";
import { ModulePanelSuspenseFallback } from "@/components/ui/ModulePanelSuspenseFallback";

const AccountingSettings = lazy(
  () => import("@/tenant/features/accounting/components/AccountingSettings"),
);

export interface AccountingSetupTierProps {
  accounts: Account[];
  fiscalYears: FiscalYear[];
  onSaveFiscalYears: (
    updater: FiscalYear[] | ((prev: FiscalYear[]) => FiscalYear[]),
  ) => void | Promise<void>;
  /** Reports Preferences draft dirtiness to the Setup shell (leave-guard). */
  onPrefsDirtyChange?: (isDirty: boolean) => void;
}

export const AccountingSetupTier = React.memo(function AccountingSetupTier({
  accounts,
  fiscalYears,
  onSaveFiscalYears,
  onPrefsDirtyChange,
}: AccountingSetupTierProps): React.JSX.Element {
  const { t } = useTranslation();
  const { canEditSetup } = useModulePermissions(ACCOUNTING_MODULE_MANIFEST);

  return (
    <ModuleTierMotion tier="setup">
      <ErrorBoundary>
        <div className="space-y-4">
          {!canEditSetup ? (
            <SetupReadOnlyMessage title={t("accounting.setup.readOnly")} />
          ) : (
            <Suspense fallback={<ModulePanelSuspenseFallback />}>
              <AccountingSettings
                accounts={accounts}
                fiscalYears={fiscalYears}
                onSaveFiscalYears={onSaveFiscalYears}
                onPrefsDirtyChange={onPrefsDirtyChange}
              />
            </Suspense>
          )}
        </div>
      </ErrorBoundary>
    </ModuleTierMotion>
  );
});

export default AccountingSetupTier;
