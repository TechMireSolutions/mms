import { useState } from "react";
import { Archive, Edit2, Loader2, RotateCcw } from "lucide-react";
import { formatDate } from "@mms/shared";
import { Button } from "@/components/ui/button";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { formatEntityStamp } from "@/lib/formatEntityStamp";

export interface DetailDrawerArchivedBannerProps {
  deletedAt: unknown;
  purgeAfter?: unknown;
  /** Build banner description from a formatted date string (drawer chrome). */
  describe?: (formattedDate: string) => string;
  /** Optional title (directory cards); when set, takes precedence over describe-only layout. */
  title?: string;
  /** Optional body text (e.g. deletion reason on cards). */
  description?: string;
  /** Manifest retention policy in days (null = keep indefinitely). */
  retentionDays?: number | null;
}

/** Calculates remaining days before hard-purge based on deletedAt stamp and manifest retention policy or purgeAfter timestamp. */
export function calculateRemainingRetentionDays(
  deletedAt: unknown,
  retentionDays?: number | null,
  purgeAfter?: unknown,
): number | null {
  if (purgeAfter) {
    const purgeStamp = formatEntityStamp(purgeAfter);
    if (purgeStamp) {
      const purgeTime = new Date(purgeStamp).getTime();
      if (!Number.isNaN(purgeTime)) {
        const diffMs = purgeTime - Date.now();
        return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
      }
    }
  }
  if (retentionDays == null || Number.isNaN(Number(retentionDays))) return null;
  const stamp = formatEntityStamp(deletedAt);
  if (!stamp) return null;
  const deletedTime = new Date(stamp).getTime();
  if (Number.isNaN(deletedTime)) return null;
  const purgeTime = deletedTime + Number(retentionDays) * 24 * 60 * 60 * 1000;
  const diffMs = purgeTime - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

export interface RetentionCountdownBadgeProps {
  deletedAt: unknown;
  retentionDays?: number | null;
  purgeAfter?: unknown;
  className?: string;
}

/** Retention expiry countdown badge for trash directories and cards (§7.9). */
export function RetentionCountdownBadge({
  deletedAt,
  retentionDays,
  purgeAfter,
  className = "",
}: RetentionCountdownBadgeProps): React.JSX.Element | null {
  const stamp = formatEntityStamp(deletedAt);
  if (!stamp) return null;

  const remaining = calculateRemainingRetentionDays(deletedAt, retentionDays, purgeAfter);

  if (remaining === null) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground ${className}`}
      >
        Archived indefinitely
      </span>
    );
  }

  const isWarning = remaining <= 7;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isWarning
          ? "bg-destructive/10 text-destructive border border-destructive/20 font-semibold"
          : "bg-muted text-muted-foreground"
      } ${className}`}
    >
      {isWarning ? "⚠️ " : ""}Purges in {remaining} {remaining === 1 ? "day" : "days"}
    </span>
  );
}

/** Soft-delete archive banner for entity detail drawers and directory cards. */
export function DetailDrawerArchivedBanner({
  deletedAt,
  purgeAfter,
  describe,
  title,
  description,
  retentionDays,
}: DetailDrawerArchivedBannerProps): React.JSX.Element | null {
  const stamp = formatEntityStamp(deletedAt);
  if (!stamp) return null;

  const formatted = formatDate(stamp);
  let resolvedDescription = description ?? (describe ? describe(formatted) : (!title ? `Archived on ${formatted}` : undefined));

  if (retentionDays !== undefined || purgeAfter !== undefined) {
    const remaining = calculateRemainingRetentionDays(deletedAt, retentionDays, purgeAfter);
    const retentionNote =
      remaining === null
        ? "Archived indefinitely"
        : remaining <= 7
        ? `⚠️ Purges in ${remaining} ${remaining === 1 ? "day" : "days"}`
        : `Purges in ${remaining} days`;
    resolvedDescription = resolvedDescription
      ? `${resolvedDescription} • ${retentionNote}`
      : retentionNote;
  }

  if (!title && !resolvedDescription) return null;

  return (
    <WarningCallout
      icon={Archive}
      density="compact"
      role="status"
      title={title}
      description={resolvedDescription}
    />
  );
}

export interface EntityArchivedBannerProps {
  deletedAt: unknown;
  deletionReason?: string | null;
  /** Localized title including formatted archive date. */
  titleWithDate: (formattedDate: string) => string;
  /** Localized label prefix for deletion reason (e.g. "Reason"). */
  reasonLabel: string;
  /** Manifest retention policy in days (null = keep indefinitely). */
  retentionDays?: number | null;
  /** Timestamp or ISO string when the record will be hard-purged. */
  purgeAfter?: unknown;
}

/**
 * Soft-delete archive banner shared by Contacts / Students (and peer directories).
 * Builds title + optional reason description; chrome via {@link DetailDrawerArchivedBanner}.
 */
export function EntityArchivedBanner({
  deletedAt,
  deletionReason,
  titleWithDate,
  reasonLabel,
  retentionDays,
  purgeAfter,
}: EntityArchivedBannerProps): React.JSX.Element | null {
  const stamp = formatEntityStamp(deletedAt);
  if (!stamp) return null;

  return (
    <DetailDrawerArchivedBanner
      deletedAt={deletedAt}
      retentionDays={retentionDays}
      purgeAfter={purgeAfter}
      title={titleWithDate(formatDate(stamp))}
      description={
        deletionReason ? `${reasonLabel}: ${deletionReason}` : undefined
      }
    />
  );
}


export interface DrawerSyncStatusFooterProps {
  isArchived: boolean;
  /** Localized "archived" status label shown when the entity is soft-deleted. */
  archivedLabel: string;
  /** Localized "synced" status label shown when the entity is active. */
  syncedLabel: string;
}

/**
 * Synced/archived status footer shared by entity detail drawers
 * (Students / Teachers / Sessions). Communicates state by text + color together (WCAG).
 */
export function DrawerSyncStatusFooter({
  isArchived,
  archivedLabel,
  syncedLabel,
}: DrawerSyncStatusFooterProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-1.5 h-1.5 rounded-full ${isArchived ? "bg-warning" : "bg-success"}`}
        aria-hidden
      />
      <span
        className={`text-xs font-bold uppercase ${isArchived ? "text-warning" : "text-success"}`}
      >
        {isArchived ? archivedLabel : syncedLabel}
      </span>
    </div>
  );
}

export interface DetailDrawerRestoreOrEditActionProps {
  isArchived: boolean;
  canRestore: boolean;
  canEdit?: boolean;
  restoreLabel: string;
  editLabel?: string;
  onRestore?: () => void | Promise<void>;
  onEdit?: () => void;
  className?: string;
}

/** Header restore (archived) or edit action for entity detail drawers. */
export function DetailDrawerRestoreOrEditAction({
  isArchived,
  canRestore,
  canEdit = false,
  restoreLabel,
  editLabel = "",
  onRestore,
  onEdit,
  className = "rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shadow-none",
}: DetailDrawerRestoreOrEditActionProps): React.JSX.Element | null {
  const [restoring, setRestoring] = useState(false);

  if (isArchived && canRestore && onRestore) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={restoring}
        onClick={() => {
          void (async () => {
            setRestoring(true);
            try {
              await onRestore();
            } finally {
              setRestoring(false);
            }
          })();
        }}
        aria-label={restoreLabel}
        aria-busy={restoring}
        className={className}
        title={restoreLabel}
      >
        {restoring ? (
          <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden />
        ) : (
          <RotateCcw className="w-4 h-4" />
        )}
      </Button>
    );
  }

  if (!canEdit || isArchived || !onEdit) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onEdit}
      aria-label={editLabel}
      className={className}
      title={editLabel}
    >
      <Edit2 className="w-4 h-4" />
    </Button>
  );
}
