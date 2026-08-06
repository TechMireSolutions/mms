import type { SystemUser } from "@mms/shared";
import { DirectoryCardMetaTile } from "@/components/ui/DirectoryCardMetaTile";
import { SettingsMetaBadge } from "@/components/ui/SettingsShell";
import { useTranslation } from "@/hooks/useTranslation";
import { UserRoleBadge, UserStatusBadge } from "@/tenant/features/users/components/UserBadges";

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
      <DirectoryCardMetaTile label={t("users.colRole")}>
        <UserRoleBadge roleId={user.role} />
      </DirectoryCardMetaTile>
      <DirectoryCardMetaTile label={t("users.colStatus")}>
        <UserStatusBadge status={user.status} />
      </DirectoryCardMetaTile>
      <DirectoryCardMetaTile label={t("users.colLastLogin")}>
        {formatLoginDate(user.lastLogin)}
      </DirectoryCardMetaTile>
      <DirectoryCardMetaTile label={t("users.colCreated")}>
        <span className="font-mono">{user.createdDate}</span>
      </DirectoryCardMetaTile>
      <DirectoryCardMetaTile label={t("users.col2fa")}>
        <SettingsMetaBadge variant={user.twoFactorEnabled ? "success" : "muted"}>
          {user.twoFactorEnabled ? t("users.twoFactorOn") : t("users.twoFactorOff")}
        </SettingsMetaBadge>
      </DirectoryCardMetaTile>
    </div>
  );
}
