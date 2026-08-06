import type { ReactNode } from "react";
import type { SystemUser } from "@mms/shared";
import { SettingsMetaBadge } from "@/components/ui/SettingsShell";
import { useTranslation } from "@/hooks/useTranslation";
import { UserRoleBadge, UserStatusBadge } from "@/tenant/features/users/components/UserBadges";

function MetaTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 bg-muted/40 dark:bg-muted/15 px-2.5 py-1.5 rounded-xl border border-border/30 dark:border-border/10 text-start min-w-0">
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight truncate leading-none">
        {label}
      </span>
      <div className="text-xs font-semibold text-foreground truncate mt-0.5">{children}</div>
    </div>
  );
}

export interface UserCardMetadataProps {
  user: SystemUser;
  formatLoginDate: (timestamp: string) => string;
}

/** Users domain metadata tiles — Contacts card metadata chrome. */
export function UserCardMetadata({
  user,
  formatLoginDate,
}: UserCardMetadataProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border/40 dark:border-border/20 ms-1">
      <MetaTile label={t("users.colRole")}>
        <UserRoleBadge roleId={user.role} />
      </MetaTile>
      <MetaTile label={t("users.colStatus")}>
        <UserStatusBadge status={user.status} />
      </MetaTile>
      <MetaTile label={t("users.colLastLogin")}>{formatLoginDate(user.lastLogin)}</MetaTile>
      <MetaTile label={t("users.colCreated")}>
        <span className="font-mono">{user.createdDate}</span>
      </MetaTile>
      <MetaTile label={t("users.col2fa")}>
        <SettingsMetaBadge variant={user.twoFactorEnabled ? "success" : "muted"}>
          {user.twoFactorEnabled ? t("users.twoFactorOn") : t("users.twoFactorOff")}
        </SettingsMetaBadge>
      </MetaTile>
    </div>
  );
}
