import type { JSX } from 'react';
import type { SystemUser } from '@mms/shared';

interface UsersListAvatarProps {
  user: SystemUser;
}

export function UsersListAvatar({ user }: UsersListAvatarProps): JSX.Element {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
      <span className="text-xs font-bold text-primary">{user.avatarInitials}</span>
    </div>
  );
}
