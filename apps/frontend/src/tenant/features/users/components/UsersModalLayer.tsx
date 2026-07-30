import React from 'react';
import { AnimatePresence } from 'framer-motion';
import type { MessagingTarget } from '@/hooks/useMessageComposerState';
import type { SystemUser } from '@mms/shared';
import { AddUserModal } from '@/tenant/features/users/components/AddUserModal';
import { EditUserModal } from '@/tenant/features/users/components/EditUserModal';
import { InviteUserModal } from '@/tenant/features/users/components/InviteUserModal';
import { UserDetailModal } from '@/tenant/features/users/components/UserDetailModal';

const MessageComposer = React.lazy(() => import('@/components/ui/MessageComposer'));

interface UsersModalLayerProps {
  viewing: SystemUser | null;
  editing: SystemUser | null;
  showAddUser: boolean;
  showInvite: boolean;
  canWrite: boolean;
  users: SystemUser[];
  messagingTarget: MessagingTarget | null;
  onCloseViewing: () => void;
  onCloseEditing: () => void;
  onCloseAddUser: () => void;
  onCloseInvite: () => void;
  onSaveEdit: (user: SystemUser) => Promise<void>;
  onAddUser: (user: SystemUser) => Promise<void>;
  onInvite: (user: SystemUser) => Promise<void>;
  onCloseComposer: () => void;
}

export function UsersModalLayer({
  viewing,
  editing,
  showAddUser,
  showInvite,
  canWrite,
  users,
  messagingTarget,
  onCloseViewing,
  onCloseEditing,
  onCloseAddUser,
  onCloseInvite,
  onSaveEdit,
  onAddUser,
  onInvite,
  onCloseComposer,
}: UsersModalLayerProps): React.JSX.Element {
  return (
    <>
      <AnimatePresence>
        {viewing ? (
          <UserDetailModal user={viewing} onClose={onCloseViewing} />
        ) : null}
        {editing && canWrite ? (
          <EditUserModal user={editing} onClose={onCloseEditing} onSave={onSaveEdit} />
        ) : null}
        {showAddUser && canWrite ? (
          <AddUserModal
            onClose={onCloseAddUser}
            onAdd={onAddUser}
            existingEmails={users.map((user) => user.email.toLowerCase())}
          />
        ) : null}
        {showInvite && canWrite ? (
          <InviteUserModal
            onClose={onCloseInvite}
            onInvite={onInvite}
            existingContactIds={users.map((user) => user.contactId).filter((id): id is string | number => id != null)}
          />
        ) : null}
      </AnimatePresence>

      {messagingTarget && (
        <React.Suspense fallback={null}>
          <MessageComposer
            channel={messagingTarget.channel}
            recipients={messagingTarget.recipients}
            onClose={onCloseComposer}
          />
        </React.Suspense>
      )}
    </>
  );
}
