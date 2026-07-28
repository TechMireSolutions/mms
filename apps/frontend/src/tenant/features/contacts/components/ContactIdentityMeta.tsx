import React from "react";
import { CheckCircle2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { useTranslation } from "@/hooks/useTranslation";

export interface ContactIdentityMetaProps {
  gender?: string | null;
  isSyed?: boolean | null;
  className?: string;
  /** Compact chip used in table/card name columns; md slightly larger for drawer hero. */
  size?: "sm" | "md";
}

/**
 * Shared gender + Syed meta row for contact table, cards, and detail header.
 */
export function ContactIdentityMeta({
  gender,
  isSyed,
  className,
  size = "sm",
}: ContactIdentityMetaProps): React.JSX.Element | null {
  const { t } = useTranslation();
  const hasGender = Boolean(gender?.trim());
  const showSyed = Boolean(isSyed);
  if (!hasGender && !showSyed) return null;

  const textSize = size === "md" ? "text-xs" : "text-[11px]";
  const syedSize = size === "md" ? "text-[10px] px-2 py-0.5" : "text-[9px] px-1.5 py-0.5";
  const iconSize = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";

  return (
    <p className={cn(textSize, "text-muted-foreground flex items-center gap-1.5 flex-wrap leading-normal", className)}>
      {hasGender ? (
        <span className="flex items-center gap-1 capitalize">
          <User className={cn(iconSize, "text-muted-foreground inline")} aria-hidden />
          <span>{formatContactGenderLabel(gender!, t)}</span>
        </span>
      ) : null}
      {showSyed ? (
        <span className={cn("inline-flex items-center gap-1 font-black uppercase rounded border", SEMANTIC_BADGE.success, syedSize)}>
          <CheckCircle2 className="w-3 h-3 text-success" aria-hidden />
          {t("contacts.table.yesSyed")}
        </span>
      ) : null}
    </p>
  );
}
