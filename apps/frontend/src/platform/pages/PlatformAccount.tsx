import React from "react";
import { motion } from "framer-motion";
import { PlatformPageShell } from "@/platform/components/PlatformPageShell";
import { useTranslation } from "@/hooks/useTranslation";
import { usePlatformAuth } from "@/platform/lib/PlatformAuthContext";
import { usePlatformProfile } from "@/platform/hooks/usePlatformProfile";
import RouteStatusFallback from "@/components/routing/RouteStatusFallback";
import { PageHeader } from "@/components/ui/PageHeader";

import { containerVariants, itemVariants as cardVariants } from "@/platform/lib/animations";
import { PlatformProfileCard } from "./account/PlatformProfileCard";
import { PlatformResetDatabaseCard } from "./account/PlatformResetDatabaseCard";
import { PlatformProfileNameForm } from "./account/PlatformProfileNameForm";
import { PlatformProfilePasswordForm } from "./account/PlatformProfilePasswordForm";

/**
 * Platform super-user profile — view name/email and update display name or password.
 */
export default function PlatformAccount(): React.JSX.Element {
  const { t } = useTranslation();
  const { platformUser } = usePlatformAuth();
  const { data: profile, isLoading: loadingProfile, isError: profileError } = usePlatformProfile();
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
        ) : profile && !profileError ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
          >
            {/* Left Side Info / Quick Actions (1/3 width) */}
            <motion.div variants={cardVariants} className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground text-start">
                {t("platform.myAccount")}
              </h2>
              <PlatformProfileCard profile={profile} />
              {isSuperUser && <PlatformResetDatabaseCard />}
            </motion.div>

            {/* Right Side Settings Forms (2/3 width) */}
            <motion.div variants={cardVariants} className="lg:col-span-2 space-y-6">
              <PlatformProfileNameForm initialName={profile.name ?? ""} />
              <PlatformProfilePasswordForm />
            </motion.div>
          </motion.div>
        ) : (
          <p className="text-sm text-destructive text-center" role="alert">
            {t("errors.boundary.description")}
          </p>
        )}
      </div>
    </PlatformPageShell>
  );
}
