import React from "react";
import { formatEntityStamp } from "@/lib/formatEntityStamp";
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();
  const stamp = formatEntityStamp(deletedAt);
  if (!stamp) return null;

  const remaining = calculateRemainingRetentionDays(deletedAt, retentionDays, purgeAfter);

  if (remaining === null) {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground ${className}`}
      >
        {t("common.archivedIndefinitely")}
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
      {isWarning ? "⚠️ " : ""}
      {remaining === 1 ? t("common.purgesInOneDay") : t("common.purgesInDays", { count: remaining })}
    </span>
  );
}
