import type { SystemUser } from "@mms/shared";
import { DirectoryCardMetaGrid } from "@/components/ui/DirectoryCardMetaGrid";
import { DirectoryCardMetaTile } from "@/components/ui/DirectoryCardMetaTile";
import { SettingsMetaBadge } from "@/components/ui/SettingsShell";
import { useTranslation } from "@/hooks/useTranslation";
import { UserRoleBadge, UserStatusBadge } from "@/tenant/features/users/components/UserBadges";

export interface UserCardMetadataProps {
  user: SystemUser;
  formatLoginDate: (timestamp: string) => string;
  isColumnVisible?: (key: string) => boolean;
}

/** Users domain metadata tiles — Contacts card metadata chrome. */
export function UserCardMetadata({
  user,
  formatLoginDate,
  isColumnVisible,
}: UserCardMetadataProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const visible = isColumnVisible ?? (() => true);

  const tiles: React.ReactNode[] = [];
  if (visible("role")) {
    tiles.push(
      <DirectoryCardMetaTile key="role" label={t("users.colRole")}>
        <UserRoleBadge roleId={user.role} />
      </DirectoryCardMetaTile>,
    );
  }
  if (visible("status")) {
    tiles.push(
      <DirectoryCardMetaTile key="status" label={t("users.colStatus")}>
        <UserStatusBadge status={user.status} />
      </DirectoryCardMetaTile>,
    );
  }
  if (visible("lastLogin")) {
    tiles.push(
      <DirectoryCardMetaTile key="lastLogin" label={t("users.colLastLogin")}>
        {formatLoginDate(user.lastLogin)}
      </DirectoryCardMetaTile>,
    );
  }
  if (visible("created")) {
    tiles.push(
      <DirectoryCardMetaTile key="created" label={t("users.colCreated")}>
        <span className="font-mono">{user.createdDate}</span>
      </DirectoryCardMetaTile>,
    );
  }
  if (visible("twoFactor")) {
    tiles.push(
      <DirectoryCardMetaTile key="twoFactor" label={t("users.col2fa")}>
        <SettingsMetaBadge variant={user.twoFactorEnabled ? "success" : "muted"}>
          {user.twoFactorEnabled ? t("users.twoFactorOn") : t("users.twoFactorOff")}
        </SettingsMetaBadge>
      </DirectoryCardMetaTile>,
    );
  }

  if (tiles.length === 0) return null;
  return <DirectoryCardMetaGrid>{tiles}</DirectoryCardMetaGrid>;
}
