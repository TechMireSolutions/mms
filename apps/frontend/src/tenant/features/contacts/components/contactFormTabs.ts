import { User, Phone, Mail, MapPin, Share2, Heart, SlidersHorizontal } from "lucide-react";
import {
  DEFAULT_FORM_TABS,
  type AppTranslationKey,
} from "@mms/shared";

const CONTACT_TAB_ICONS: Record<string, typeof User> = {
  basic: User,
  phones: Phone,
  emails: Mail,
  addresses: MapPin,
  socials: Share2,
  relationship: Heart,
  custom: SlidersHorizontal,
};

export const CONTACT_FORM_TABS = DEFAULT_FORM_TABS
  .slice()
  .sort((left, right) => left.order - right.order)
  .flatMap((tab) => {
    const icon = CONTACT_TAB_ICONS[tab.key];
    if (!icon) return [];
    return [{
      key: tab.key,
      labelKey: tab.labelKey ?? ("contacts.form.tabBasic" as AppTranslationKey),
      icon,
      label: tab.label,
    }];
  });

export type ContactFormTabKey = (typeof CONTACT_FORM_TABS)[number]["key"];
