import { PersonIdentityMeta } from "@/components/ui/PersonIdentityMeta";
import { useTranslation } from "@/hooks/useTranslation";

interface ContactIdentityMetaProps {
  gender?: string | null;
  isSyed?: boolean | null;
  className?: string;
  /** Compact chip used in table/card name columns; md slightly larger for drawer hero. */
  size?: "sm" | "md";
}

/**
 * Shared gender + Syed meta row for contact table, cards, and detail header.
 * Thin Contacts wrapper over PersonIdentityMeta (Syed label SSOT here).
 */
export function ContactIdentityMeta({
  gender,
  isSyed,
  className,
  size = "sm",
}: ContactIdentityMetaProps): React.JSX.Element | null {
  const { t } = useTranslation();
  return (
    <PersonIdentityMeta
      gender={gender}
      isSyed={isSyed}
      syedLabel={t("contacts.table.yesSyed")}
      className={className}
      size={size}
    />
  );
}
