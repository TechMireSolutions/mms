import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import type { SystemUser } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTranslation } from "@/hooks/useTranslation";
import { UsersListRowActions } from "@/tenant/features/users/components/UsersListRowActions";

const MotionButton = motion.create(Button);

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
  const reducedMotion = useReducedMotion();
  const scaleHover = reducedMotion ? 1 : 1.02;
  const scaleTap = reducedMotion ? 1 : 0.98;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3 dark:border-border/20">
      <span />
      <div className="flex shrink-0 items-center gap-1.5">
        <MotionButton
          type="button"
          variant="outline"
          whileHover={{ scale: scaleHover }}
          whileTap={{ scale: scaleTap }}
          onClick={() => onView(user)}
          className="flex items-center min-h-11 h-auto gap-1.5 px-3 py-2 rounded-xl border border-border/50 dark:border-border/30 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:border-border transition-colors cursor-pointer shadow-none"
          aria-label={t("users.actionView", { name: user.name })}
        >
          <Eye aria-hidden="true" className="w-3.5 h-3.5" />
          <span>{t("users.actionViewShort")}</span>
        </MotionButton>
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
