import React, { type ReactNode } from "react";
import { DirectoryCardFooter } from "@/components/ui/DirectoryCardFooter";
import { DirectoryCardViewButton } from "@/components/ui/DirectoryCardViewButton";
import { useTranslation } from "@/hooks/useTranslation";

export interface DirectoryCardFooterActionsProps {
  /** Optional view callback; when present, renders standard DirectoryCardViewButton. */
  onView?: () => void;
  /** Optional label for view button; defaults to t("contacts.actionViewShort"). */
  viewLabel?: string;
  /** Accessible aria-label for view button. */
  viewAriaLabel?: string;
  /** Optional leading element (e.g. messaging pills, status chip). */
  leading?: ReactNode;
  /** Optional intermediate action buttons placed before overflowActions (e.g. Print button). */
  actions?: ReactNode;
  /** Optional overflow menu actions (e.g. domain row actions). */
  overflowActions?: ReactNode;
  /** Additional trailing action buttons or custom items. */
  children?: ReactNode;
}

/**
 * Standardized Work-directory card footer actions.
 * Enforces uniform View button + overflow menu trigger layout with WCAG 44px touch targets.
 */
export const DirectoryCardFooterActions = React.memo(function DirectoryCardFooterActions({
  onView,
  viewLabel,
  viewAriaLabel,
  leading,
  actions,
  overflowActions,
  children,
}: DirectoryCardFooterActionsProps): React.JSX.Element {
  const { t } = useTranslation();
  const label = viewLabel ?? t("contacts.actionViewShort");

  return (
    <DirectoryCardFooter
      leading={leading}
      trailing={
        <>
          {onView ? (
            <DirectoryCardViewButton
              label={label}
              ariaLabel={viewAriaLabel ?? label}
              onClick={onView}
            />
          ) : null}
          {actions}
          {overflowActions}
          {children}
        </>
      }
    />
  );
});
