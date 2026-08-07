import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { GenderIcon } from "@/components/ui/GenderIcon";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export interface PersonIdentityMetaProps {
  gender?: string | null;
  /** When true, shows the Syed chip (Contacts). Requires `syedLabel`. */
  isSyed?: boolean | null;
  syedLabel?: string;
  className?: string;
  /** Compact chip used in table/card name columns; md slightly larger for drawer hero. */
  size?: "sm" | "md";
}

/** Gender (+ optional Syed) identity row for person directory cards/tables/detail. */
export function PersonIdentityMeta({
  gender,
  isSyed,
  syedLabel,
  className,
  size = "sm",
}: PersonIdentityMetaProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const hasGender = Boolean(gender?.trim());
  const showSyed = Boolean(isSyed) && Boolean(syedLabel);
  if (!hasGender && !showSyed) return null;

  const textSize = "text-xs";
  const syedSize = size === "md" ? "text-xs px-2 py-0.5" : "text-xs px-1.5 py-0.5";
  const iconSize = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";

  return (
    <p
      className={cn(
        textSize,
        "text-muted-foreground flex items-center gap-1.5 flex-wrap leading-normal",
        className,
      )}
    >
      {hasGender ? (
        <span className="flex items-center gap-1 capitalize">
          <GenderIcon gender={gender} className={cn(iconSize, "inline shrink-0")} />
          <span>{formatContactGenderLabel(gender!, t)}</span>
        </span>
      ) : null}
      {showSyed ? (
        <span
          className={cn(
            "inline-flex items-center gap-1 font-black uppercase rounded border",
            SEMANTIC_BADGE.success,
            syedSize,
          )}
        >
          <CheckCircle2 className="w-3 h-3 text-success" aria-hidden />
          {syedLabel}
        </span>
      ) : null}
    </p>
  );
}

/** Optional wrapper when subtitle stacks multiple identity rows (e.g. GR + gender). */
export function DirectoryCardSubtitleStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  return <div className={cn("mt-0.5 flex flex-col gap-0.5 min-w-0", className)}>{children}</div>;
}
