import type { ReactNode } from 'react';
import { UserAvatar } from '@/components/ui/UserAvatar';

export interface PersonDetailHeroCardProps {
  id: string | number;
  displayName: string;
  avatar?: string | null;
  /** Meta row (badges / identity chips) rendered under the title. */
  children?: ReactNode;
}

/**
 * Person detail hero shell shared by Contacts, Students, and Teachers.
 *
 * Renders the gradient card, avatar, and name title; modules supply their own
 * meta row (status/GR badges, identity chips) as children.
 */
export function PersonDetailHeroCard({
  id,
  displayName,
  avatar,
  children,
}: PersonDetailHeroCardProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-card via-card to-muted/40 border border-border/80 shadow-xs">
      <UserAvatar
        id={id}
        name={displayName}
        avatar={avatar}
        className="w-16 h-16 rounded-2xl text-2xl font-bold flex-shrink-0 shadow-xs"
      />
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-foreground truncate leading-tight">{displayName}</h3>
        {children ? <div className="flex flex-wrap gap-1.5 mt-2 items-center">{children}</div> : null}
      </div>
    </div>
  );
}
