import React, { useMemo } from "react";
import { Users as UsersIcon, ShieldAlert, ShieldCheck, UserCheck, KeyRound, Radio } from "lucide-react";
import type { UsersCommandMetricsSnapshot } from "@mms/shared";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import { useUsersMetrics } from "@/tenant/features/users/hooks/useUsersApi";

interface UsersCommandMetricsProps {
  shown: number;
}

export function UsersCommandMetrics({ shown }: UsersCommandMetricsProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data: metrics } = useUsersMetrics();

  const snapshot: UsersCommandMetricsSnapshot = metrics ?? {
    total: 0,
    active: 0,
    suspended: 0,
    admins: 0,
    twoFaEnabled: 0,
    activeSessions: 0,
  };

  const items = useMemo(
    () => [
      {
        icon: UsersIcon,
        label: t("users.stats.total"),
        value: snapshot.total,
        accent: "primary" as const,
      },
      {
        icon: UsersIcon,
        label: t("users.stats.filtered"),
        value: shown,
        accent: "info" as const,
      },
      {
        icon: UserCheck,
        label: t("users.status.active"),
        value: snapshot.active,
        accent: "success" as const,
      },
      {
        icon: ShieldAlert,
        label: t("users.status.suspended"),
        value: snapshot.suspended,
        accent: "destructive" as const,
      },
      {
        icon: ShieldCheck,
        label: t("users.stats.admin"),
        value: snapshot.admins,
        accent: "info" as const,
      },
      {
        icon: KeyRound,
        label: t("users.stats.twoFa"),
        value: snapshot.twoFaEnabled,
        accent: "secondary" as const,
      },
      {
        icon: Radio,
        label: t("users.stats.sessions"),
        value: snapshot.activeSessions,
        accent: "info" as const,
      },
    ],
    [t, shown, snapshot],
  );

  return <ModuleCommandMetricsGrid items={items} />;
}
