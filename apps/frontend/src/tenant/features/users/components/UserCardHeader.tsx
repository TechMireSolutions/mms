import type { SystemUser } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/hooks/useTranslation";
import { UsersListAvatar } from "@/tenant/features/users/components/UsersListAvatar";

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
    <div className="flex gap-3 items-start ms-1">
      {showSelect ? (
        <div className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(user.id)}
            aria-label={t("users.selectRow", { name: user.name })}
          />
        </div>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        className="h-auto p-0 hover:bg-transparent flex flex-1 items-start gap-2.5 min-w-0 text-start cursor-pointer hover:text-foreground shadow-none justify-start"
        onClick={() => onView(user)}
        aria-label={t("users.actionView", { name: user.name })}
      >
        <UsersListAvatar
          user={user}
          className={`h-11 w-11 rounded-2xl${
            reducedMotion ? "" : " group-hover:scale-105 transition-transform duration-200"
          }`}
          initialsClassName="text-sm"
        />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-black text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
            {user.name}
          </h4>
          <p className="mt-0.5 text-xs font-semibold text-muted-foreground truncate">{user.email}</p>
        </div>
      </Button>
    </div>
  );
}
