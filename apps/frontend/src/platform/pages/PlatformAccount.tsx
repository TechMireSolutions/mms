import React from "react";
import { motion } from "framer-motion";
import { PlatformPageShell } from "@/platform/components/PlatformPageShell";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { usePlatformProfile } from "@/platform/hooks/usePlatformProfile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import RouteStatusFallback from "@/components/routing/RouteStatusFallback";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { DETAIL_SECTION_TITLE } from "@/components/ui/formStyles";

import { containerVariants, itemVariants as cardVariants } from "@/platform/lib/animations";
import { PlatformProfileCard } from "./account/PlatformProfileCard";
import { PlatformMigrateRestartCard } from "./account/PlatformMigrateRestartCard";
import { PlatformResetDatabaseCard } from "./account/PlatformResetDatabaseCard";
import { PlatformProfileNameForm } from "./account/PlatformProfileNameForm";
import { PlatformProfilePasswordForm } from "./account/PlatformProfilePasswordForm";

/**
 * Platform operator profile — view name/email and update display name or password.
 */
export default function PlatformAccount(): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const { platformUser } = usePlatformAuth();
  const {
    data: profile,
    isLoading: loadingProfile,
    isError: profileError,
    refetch,
  } = usePlatformProfile();
  const isSuperUser = platformUser?.role === "super_user";

  return (
    <PlatformPageShell width="7xl">
      <div className="space-y-8">
        <PageHeader
          title={t("platform.profileTitle")}
          subtitle={t("platform.profileSubtitle")}
        />

        {loadingProfile ? (
          <RouteStatusFallback />
        ) : profileError || !profile ? (
          <ErrorState
            title={t("platform.loadFailed")}
            description={t("platform.loadFailedHint")}
            onRetry={() => void refetch()}
          />
        ) : (
          <motion.div
            variants={containerVariants}
            initial={reducedMotion ? false : "hidden"}
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
          >
            <motion.div variants={cardVariants} className="space-y-6">
              <h2 className={`${DETAIL_SECTION_TITLE} text-start`}>
                {t("platform.myAccount")}
              </h2>
              <PlatformProfileCard profile={profile} />
              {isSuperUser && <PlatformMigrateRestartCard />}
              {isSuperUser && <PlatformResetDatabaseCard />}
            </motion.div>

            <motion.div variants={cardVariants} className="lg:col-span-2 space-y-6">
              <PlatformProfileNameForm initialName={profile.name ?? ""} />
              <PlatformProfilePasswordForm />
            </motion.div>
          </motion.div>
        )}
      </div>
    </PlatformPageShell>
  );
}
