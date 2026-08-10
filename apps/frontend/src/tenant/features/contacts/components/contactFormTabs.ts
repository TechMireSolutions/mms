import { User, Phone, Mail, MapPin, Share2, Heart, SlidersHorizontal } from "lucide-react";
import {
  DEFAULT_FORM_TABS,
  omitContactLegacyCustomFormTabUnlessUsed,
  type FieldConfig,
  type TabDefinition,
} from "@mms/shared";
import { createFormModalTabs, type FormModalTabItem } from "@/lib/forms/createFormModalTabs";

const CONTACT_TAB_ICONS: Record<string, typeof User> = {
  basic: User,
  phones: Phone,
  emails: Mail,
  addresses: MapPin,
  socials: Share2,
  relationship: Heart,
  custom: SlidersHorizontal,
};

type ContactFormTabItem = FormModalTabItem;

/** Base fallback + legacy-custom-tab prune shared by form and Setup tab resolution. */
export function resolveContactsFormTabsRaw(
  formTabs?: TabDefinition[],
  fields?: FieldConfig["fields"],
): TabDefinition[] {
  return omitContactLegacyCustomFormTabUnlessUsed(
    formTabs && formTabs.length > 0 ? formTabs : DEFAULT_FORM_TABS,
    fields,
  );
}

/** Build form modal tabs from persisted Setup `formTabs` (includes user-created tabs). */
const resolveContactFormTabsImpl = createFormModalTabs({
  icons: CONTACT_TAB_ICONS,
  isTabEnabled: () => true,
  resolveSource: (formTabs, fields) =>
    resolveContactsFormTabsRaw(formTabs, fields as FieldConfig["fields"] | undefined),
});

export function resolveContactFormTabs(
  formTabs?: TabDefinition[],
  fields?: FieldConfig["fields"],
): ContactFormTabItem[] {
  return resolveContactFormTabsImpl(formTabs, undefined, fields);
}
