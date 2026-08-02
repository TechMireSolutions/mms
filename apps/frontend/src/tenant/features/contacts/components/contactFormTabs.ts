import { User, Phone, Mail, MapPin, Share2, Heart, SlidersHorizontal } from "lucide-react";
import {
  DEFAULT_FORM_TABS,
  type AppTranslationKey,
  type TabDefinition,
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

export type ContactFormTabItem = {
  key: string;
  labelKey?: AppTranslationKey;
  icon: typeof User;
  label: string;
};

/** Build form modal tabs from persisted Setup `formTabs` (includes user-created tabs). */
export function resolveContactFormTabs(formTabs?: TabDefinition[]): ContactFormTabItem[] {
  const source = (formTabs && formTabs.length > 0 ? formTabs : DEFAULT_FORM_TABS)
    .slice()
    .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));

  return source.map((tab) => ({
    key: tab.key,
    labelKey: tab.labelKey,
    icon: CONTACT_TAB_ICONS[tab.key] ?? SlidersHorizontal,
    label: tab.label,
  }));
}
