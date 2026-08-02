import { CheckCircle2, MapPin } from "lucide-react";
import {
  Contact,
  hasWhatsApp,
  COLOR_PALETTES,
  getPrimaryAddress,
  type AppTranslationKey,
} from "@mms/shared";
import { formatContactGenderLabel } from "@/lib/contacts/contactI18n";
import { SEMANTIC_BADGE } from "@/lib/semanticTone";
import { GenderIcon } from "@/components/ui/GenderIcon";

type Translate = (key: AppTranslationKey, params?: Record<string, string | number>) => string;

export function renderGenderMetadata({
  contact,
  emptyNode,
  t,
}: {
  contact: Contact;
  emptyNode: React.ReactNode;
  t: Translate;
}): React.ReactNode {
  const genderValue = contact.gender;
  if (!genderValue) return emptyNode;
  return (
    <span className="flex items-center gap-1 capitalize">
      <GenderIcon gender={genderValue} className="w-3.5 h-3.5 shrink-0" />
      {formatContactGenderLabel(genderValue, t)}
    </span>
  );
}

export function renderSyedMetadata({
  contact,
  emptyNode,
  t,
}: {
  contact: Contact;
  emptyNode: React.ReactNode;
  t: Translate;
}): React.ReactNode {
  return contact.isSyed ? (
    <span className={`inline-flex items-center gap-1 text-xs font-black uppercase px-2 py-0.5 rounded border ${SEMANTIC_BADGE.success}`}>
      <CheckCircle2 className="w-3 h-3 text-success" />
      {t("contacts.table.yesSyed")}
    </span>
  ) : (
    emptyNode
  );
}

export function renderAddressFieldMetadata({
  contact,
  colId,
  emptyNode,
}: {
  contact: Contact;
  colId: "city" | "country" | "state" | "line1";
  emptyNode: React.ReactNode;
}): React.ReactNode {
  const primaryAddr = getPrimaryAddress(contact);
  const addressValue =
    primaryAddr?.[colId] || (contact[colId as keyof Contact] as string | undefined);
  if (!addressValue) return emptyNode;
  return (
    <span className="flex min-w-0 items-center gap-1 truncate">
      <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
      <span className="min-w-0 truncate">{String(addressValue)}</span>
    </span>
  );
}

export function renderWhatsAppMetadata({
  contact,
  t,
}: {
  contact: Contact;
  t: Translate;
}): React.ReactNode {
  return (
    <span
      className={`text-xs font-extrabold uppercase px-1.5 py-0.5 rounded border ${
        hasWhatsApp(contact) ? COLOR_PALETTES.success.bg : COLOR_PALETTES.slate.bg
      }`}
    >
      {hasWhatsApp(contact) ? t("common.yes") : t("common.no")}
    </span>
  );
}
