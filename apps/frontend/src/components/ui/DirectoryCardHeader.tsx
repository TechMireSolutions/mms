import React from "react";
import type { ReactNode } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export interface DirectoryCardHeaderProps {
  id: string | number;
  displayName: string;
  avatar?: string | null;
  isSelected: boolean;
  onSelect: () => void;
  selectAriaLabel: string;
  /** When absent, the avatar + title block renders as plain content (no dead button). */
  onView?: () => void;
  viewAriaLabel?: string;
  subtitle?: ReactNode;
  showSelect?: boolean;
  reducedMotion?: boolean;
}

/** Shared Work directory card header: checkbox | avatar + title + subtitle. */
export const DirectoryCardHeader = React.memo(function DirectoryCardHeader({
  id,
  displayName,
  avatar,
  isSelected,
  onSelect,
  selectAriaLabel,
  onView,
  viewAriaLabel,
  subtitle,
  showSelect = true,
  reducedMotion = false,
}: DirectoryCardHeaderProps): React.JSX.Element {
  const face = (
    <>
      <UserAvatar
        id={id}
        name={displayName}
        avatar={avatar ?? undefined}
        className={`w-11 h-11 rounded-2xl text-sm shadow-inner${
          reducedMotion ? "" : " group-hover:scale-105 transition-transform duration-200"
        }`}
      />
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-black text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
          {displayName}
        </h4>
        {subtitle}
      </div>
    </>
  );

  return (
    <div className="flex gap-3 items-start ms-1">
      {showSelect ? (
        <div className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            aria-label={selectAriaLabel}
          />
        </div>
      ) : null}
      {onView && viewAriaLabel ? (
        <Button
          type="button"
          variant="ghost"
          className="h-auto p-0 hover:bg-transparent flex flex-1 items-start gap-2.5 min-w-0 text-start cursor-pointer hover:text-foreground shadow-none justify-start"
          onClick={onView}
          aria-label={viewAriaLabel}
        >
          {face}
        </Button>
      ) : (
        <div className="flex flex-1 items-start gap-2.5 min-w-0 text-start">{face}</div>
      )}
    </div>
  );
});

