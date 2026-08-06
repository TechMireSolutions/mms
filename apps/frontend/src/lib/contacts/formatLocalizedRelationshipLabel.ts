import { formatRelationshipDisplayLabel, type AppTranslationKey } from "@mms/shared";
import { formatContactOptionLabel } from "@/lib/contacts/contactI18n";

/** Gendered Parent/Child display label, then Contacts option i18n. */
export function formatLocalizedRelationshipLabel(
  relationship: string | undefined | null,
  gender: string | null | undefined,
  t: (key: AppTranslationKey) => string,
): string {
  const stored = (relationship || "").trim();
  if (!stored) return "";
  const display = formatRelationshipDisplayLabel(stored, gender);
  return formatContactOptionLabel(display, t) || display;
}
