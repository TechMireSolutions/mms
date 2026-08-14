import React from "react";
import { ShieldCheck, UserCheck, Crown } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlatformAdmins } from "@/platform/hooks/usePlatformAdmins";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { StatsSkeleton } from "@/components/ui/LoadingState";
import { PlatformAdminsList } from "@/platform/pages/PlatformAdminsList";

/**
 * Single Source of Truth (SSOT) presentational component for Platform Administrators list and management.
 * Shared between /platform/admins and /?tab=setup.
 */
export function PlatformAdminsContent(): React.JSX.Element {
  const { t } = useTranslation();
  const { data: admins, isLoading: loadingAdmins, isError: fetchError, refetch } = usePlatformAdmins();

  const totalAdmins = admins?.length ?? 0;
  const activeAdmins = admins?.filter((a) => !a.disabledAt).length ?? 0;
  const superAdmins = admins?.filter((a) => a.role === "super_user").length ?? 0;
  const metricsReady = !loadingAdmins && !fetchError && admins !== undefined;

  return (
    <div className="space-y-6 text-start">
      {/* Metrics Grid */}
      {fetchError ? null : metricsReady ? (
        <ModuleCommandMetricsGrid
          items={[
            {
              icon: ShieldCheck,
              label: t("platform.manageAdmins"),
              value: totalAdmins,
              accent: "primary",
            },
            {
              icon: UserCheck,
              label: t("platform.workspaceActive"),
              value: activeAdmins,
              accent: "success",
            },
            {
              icon: Crown,
              label: t("platform.roleSuperUser"),
              value: superAdmins,
              accent: "warning",
            },
          ]}
        />
      ) : (
        <StatsSkeleton count={3} />
      )}

      {/* Directory & Create Form */}
      <div className="pt-2">
        <PlatformAdminsList
          admins={admins}
          loading={loadingAdmins}
          fetchError={fetchError}
          onRetry={() => void refetch()}
        />
      </div>
    </div>
  );
}
