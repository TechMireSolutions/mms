import type { SystemUser } from "@mms/shared";
import { DirectoryCardsGrid } from "@/components/ui/DirectoryCardsGrid";
import { DirectoryCardsSelectAllBar } from "@/components/ui/DirectoryCardsSelectAllBar";
import { DirectoryEntityCard } from "@/components/ui/DirectoryEntityCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { UserArchivedBanner } from "@/tenant/features/users/components/UserArchivedBanner";
import { UserCardActions } from "@/tenant/features/users/components/UserCardActions";
import { UserCardHeader } from "@/tenant/features/users/components/UserCardHeader";
import { UserCardMetadata } from "@/tenant/features/users/components/UserCardMetadata";

interface UsersListCardsProps {
  users: SystemUser[];
  selectedIds: string[];
  allSelected: boolean;
  someSelected: boolean;
  canWrite: boolean;
  canDelete: boolean;
  showDeleted: boolean;
  formatLoginDate: (timestamp: string) => string;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  onView: (user: SystemUser) => void;
  onEdit: (user: SystemUser) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onResetPassword: (user: SystemUser) => void;
  isColumnVisible?: (key: string) => boolean;
}

/** Work directory cards for Users — shared directory card chrome. */
export function UsersListCards({
  users,
  selectedIds,
  allSelected,
  someSelected,
  canWrite,
  canDelete,
  showDeleted,
  formatLoginDate,
  onToggleSelect,
  onToggleAll,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onResetPassword,
  isColumnVisible,
}: UsersListCardsProps): React.JSX.Element {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();
  const pageCountLabel = `${users.length} ${t("nav.users").toLowerCase()}`;

  return (
    <>
      {canDelete && users.length > 0 ? (
        <DirectoryCardsSelectAllBar
          checkboxId="users-select-all-cards"
          allSelected={allSelected}
          someSelected={someSelected}
          onSelectAll={onToggleAll}
          selectLabel={t("users.selectAll")}
          deselectLabel={t("common.deselect")}
          selectedCount={selectedIds.length}
          selectedCountLabel={t("users.selectedCount", { count: selectedIds.length })}
          pageCountLabel={pageCountLabel}
        />
      ) : null}

      <DirectoryCardsGrid>
        {users.map((user) => {
          const isSelected = selectedIds.includes(user.id);
          return (
            <DirectoryEntityCard
              key={user.id}
              isSelected={isSelected}
              reducedMotion={reducedMotion}
            >
              <UserCardHeader
                user={user}
                isSelected={isSelected}
                showSelect={canDelete}
                onToggleSelect={onToggleSelect}
                onView={onView}
                reducedMotion={reducedMotion}
              />
              <UserArchivedBanner user={user} />
              <UserCardMetadata
                user={user}
                formatLoginDate={formatLoginDate}
                isColumnVisible={isColumnVisible}
              />
              <UserCardActions
                user={user}
                canWrite={canWrite}
                canDelete={canDelete}
                showDeleted={showDeleted}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onRestore={onRestore}
                onResetPassword={onResetPassword}
              />
            </DirectoryEntityCard>
          );
        })}
      </DirectoryCardsGrid>
    </>
  );
}
