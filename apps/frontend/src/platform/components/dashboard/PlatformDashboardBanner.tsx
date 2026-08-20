import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Radio, Building2, ArrowUpRight, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Button } from "@/components/ui/button";
import { WORK_SURFACE } from "@/components/ui/formStyles";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { itemVariants } from "@/platform/lib/animations";
import { ROUTES } from "@/lib/config/routes";
import { cn } from "@/lib/utils";
import type { PlatformUser } from "@mms/shared";

export interface PlatformDashboardBannerProps {
  platformUser?: PlatformUser | null;
  isSuperUser: boolean;
  canWorkspaces: boolean;
  canOnboard: boolean;
}

export function PlatformDashboardBanner({
  platformUser,
  isSuperUser,
  canWorkspaces,
  canOnboard,
}: PlatformDashboardBannerProps): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={reducedMotion ? undefined : itemVariants}
      className={cn(WORK_SURFACE, "p-6 sm:p-8 relative overflow-hidden group/banner")}
    >
      <div className="absolute -top-12 -end-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover/banner:bg-primary/15 transition-all duration-500" />

      <div className="relative z-10 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              SEMANTIC_BADGE.primary,
              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs",
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden />
            {t("platform.consoleTitle")}
          </span>
          <span
            className={cn(
              SEMANTIC_BADGE.success,
              "px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs",
            )}
          >
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            {t("platform.statusOperational")}
          </span>
          <span className="text-xs font-mono text-muted-foreground ms-auto hidden sm:inline-flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md border border-border/60">
            <Radio className="w-3 h-3 text-success animate-ping" /> Realtime Pulse
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {t("platform.welcomeBack", {
                name: platformUser?.name ?? t("platform.operatorRole"),
              })}
            </h1>
            <p className="text-sm font-medium text-muted-foreground max-w-xl leading-relaxed mt-1">
              {isSuperUser
                ? t("platform.superConsoleDesc")
                : t("platform.operatorConsoleDesc")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canOnboard && (
              <Button
                asChild
                size="sm"
                className="rounded-xl font-bold gap-1.5 shadow-xs interactive-scale min-h-11"
              >
                <Link to={ROUTES.onboarding}>
                  <Building2 className="w-4 h-4" aria-hidden />
                  {t("auth.createMadrasa")}
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
                </Link>
              </Button>
            )}
            {canWorkspaces && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-xl font-bold gap-1.5 hover:bg-muted transition-all min-h-11"
              >
                <Link to={ROUTES.platformWorkspaces}>
                  <Globe className="w-4 h-4 text-primary" aria-hidden />
                  {t("platform.manageMadrasas")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
