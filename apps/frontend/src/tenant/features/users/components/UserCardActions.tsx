import type { SystemUser } from "@mms/shared";
import { DirectoryCardViewButton } from "@/components/ui/DirectoryCardViewButton";
import { useTranslation } from "@/hooks/useTranslation";
import { UsersListRowActions } from "@/tenant/features/users/components/UsersListRowActions";

export interface UserCardActionsProps {
  user: SystemUser;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  onView: (user: SystemUser) => void;
  onEdit: (user: SystemUser) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onResetPassword: (user: SystemUser) => void;
}

/** Contacts-shaped card footer: View + remaining icon actions. */
export function UserCardActions({
  user,
  canWrite,
  canDelete,
  showDeleted,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onResetPassword,
}: UserCardActionsProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/40 pt-3 dark:border-border/20">
      <div className="flex shrink-0 items-center gap-1.5">
        <DirectoryCardViewButton
          label={t("users.actionViewShort")}
          ariaLabel={t("users.actionView", { name: user.name })}
          onClick={() => onView(user)}
        />
        <UsersListRowActions
          user={user}
          canWrite={canWrite}
          canDelete={canDelete}
          showDeleted={showDeleted}
          hideViewItem
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onRestore={onRestore}
          onResetPassword={onResetPassword}
        />
      </div>
    </div>
  );
}
