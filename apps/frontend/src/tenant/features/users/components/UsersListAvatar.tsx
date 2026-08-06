import type { JSX } from 'react';
import type { SystemUser } from '@mms/shared';
import { cn } from '@/lib/utils';

interface UsersListAvatarProps {
  user: SystemUser;
  className?: string;
  initialsClassName?: string;
}

export function UsersListAvatar({
  user,
  className,
  initialsClassName,
}: UsersListAvatarProps): JSX.Element {
  return (
    <div
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10',
        className,
      )}
    >
      <span className={cn('text-xs font-bold text-primary', initialsClassName)}>
        {user.avatarInitials}
      </span>
    </div>
  );
}
