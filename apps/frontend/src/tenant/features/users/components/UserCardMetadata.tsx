import type { SystemUser } from "@mms/shared";
import { DirectoryCardMetadata } from "@/components/ui/DirectoryCardMetadata";
import { useTranslation } from "@/hooks/useTranslation";
import { renderUserWorkColumnValue } from "@/tenant/features/users/components/userWorkColumnCell";

export interface UserCardMetadataProps {
  user: SystemUser;
  formatLoginDate: (timestamp: string) => string;
  isColumnVisible?: (key: string) => boolean;
}

type UserMetaColumn = {
  key: "role" | "status" | "lastLogin" | "created" | "twoFactor";
  label: "users.colRole" | "users.colStatus" | "users.colLastLogin" | "users.colCreated" | "users.col2fa";
};

const USER_META_COLUMNS: UserMetaColumn[] = [
  { key: "role", label: "users.colRole" },
  { key: "status", label: "users.colStatus" },
  { key: "lastLogin", label: "users.colLastLogin" },
  { key: "created", label: "users.colCreated" },
  { key: "twoFactor", label: "users.col2fa" },
];

/** Users domain metadata tiles — Contacts card metadata chrome. */
export function UserCardMetadata({
  user,
  formatLoginDate,
  isColumnVisible,
}: UserCardMetadataProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const visible = isColumnVisible ?? (() => true);
  const metaColumns = USER_META_COLUMNS.filter((col) => visible(col.key));

  return (
    <DirectoryCardMetadata
      columns={metaColumns}
      keyFor={(col) => col.key}
      labelFor={(col) => t(col.label)}
      renderValue={(col) =>
        renderUserWorkColumnValue(user, col.key, {
          t,
          formatLoginDate,
        })
      }
    />
  );
}
