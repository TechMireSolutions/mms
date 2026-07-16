import React, { useMemo } from "react";
import { Users as UsersIcon, ShieldAlert, ShieldCheck, UserCheck, KeyRound, Radio } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { ModuleCommandMetricsGrid } from "@/components/ui/ModuleCommandMetricsGrid";
import type { SystemUser } from "@mms/shared";

interface UsersCommandMetricsProps {
  users: SystemUser[];
  shown: number;
}

export function UsersCommandMetrics({ users, shown }: UsersCommandMetricsProps): React.JSX.Element {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    let active = 0;
    let suspended = 0;
    let twoFa = 0;
    let activeSessions = 0;
    let admins = 0;

    for (const u of users) {
      if (u.status === "active") active++;
      if (u.status === "suspended") suspended++;
      if (u.twoFactorEnabled) twoFa++;
      activeSessions += u.activeSessions || 0;
      if (u.role === "admin") admins++;
    }

    return { active, suspended, twoFa, activeSessions, admins };
  }, [users]);

  const items = useMemo(
    () => [
      {
        icon: UsersIcon,
        label: t("users.stats.total") || "Total Accounts",
        value: users.length,
        accent: "primary" as const,
      },
      {
        icon: UsersIcon,
        label: t("users.stats.filtered") || "Filtered Accounts",
        value: shown,
        accent: "info" as const,
      },
      {
        icon: UserCheck,
        label: t("users.status.active") || "Active Accounts",
        value: stats.active,
        accent: "success" as const,
      },
      {
        icon: ShieldAlert,
        label: t("users.status.suspended") || "Suspended",
        value: stats.suspended,
        accent: "destructive" as const,
      },
      {
        icon: ShieldCheck,
        label: t("users.stats.admin") || "Administrators",
        value: stats.admins,
        accent: "indigo" as const,
      },
      {
        icon: KeyRound,
        label: t("users.stats.twoFa") || "2FA Protected",
        value: stats.twoFa,
        accent: "purple" as const,
      },
      {
        icon: Radio,
        label: t("users.stats.sessions") || "Active Sessions",
        value: stats.activeSessions,
        accent: "teal" as const,
      },
    ],
    [t, users.length, shown, stats]
  );

  return <ModuleCommandMetricsGrid items={items} />;
}
