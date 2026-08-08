import type { SystemUser } from "@mms/shared";
import { DirectoryCardHeader } from "@/components/ui/DirectoryCardHeader";
import { useTranslation } from "@/hooks/useTranslation";

export interface UserCardHeaderProps {
  user: SystemUser;
  isSelected: boolean;
  showSelect: boolean;
  onToggleSelect: (id: string) => void;
  onView: (user: SystemUser) => void;
  reducedMotion?: boolean;
}

/** Contacts-shaped horizontal card header: checkbox | avatar + name + email. */
export function UserCardHeader({
  user,
  isSelected,
  showSelect,
  onToggleSelect,
  onView,
  reducedMotion = false,
}: UserCardHeaderProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <DirectoryCardHeader
      id={user.id}
      displayName={user.name}
      isSelected={isSelected}
      showSelect={showSelect}
      onSelect={() => onToggleSelect(user.id)}
      selectAriaLabel={t("users.selectRow", { name: user.name })}
      onView={() => onView(user)}
      viewAriaLabel={t("users.actionView", { name: user.name })}
      reducedMotion={reducedMotion}
      subtitle={
        <p className="mt-0.5 text-xs font-semibold text-muted-foreground truncate">
          {user.email}
        </p>
      }
    />
  );
}
