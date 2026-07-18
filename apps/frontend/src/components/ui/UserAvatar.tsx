import * as React from "react";
import { getInitials, getAvatarColor } from "@mms/shared";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export interface UserAvatarProps {
  id?: string | number;
  name?: string | null;
  avatar?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({
  id,
  name,
  avatar,
  className = "w-8 h-8",
  fallbackClassName,
}: UserAvatarProps): React.JSX.Element {
  const initials = getInitials(name, 2) || "?";
  const colorClass = id ? getAvatarColor(id) : "bg-primary/15 text-primary";

  return (
    <Avatar className={className}>
      {avatar && (
        <AvatarImage
          src={avatar}
          alt={name || "Avatar"}
          className="object-cover"
        />
      )}
      <AvatarFallback className={`${colorClass} font-bold text-xs ${fallbackClassName}`}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
