import React from "react";
import { motion } from "framer-motion";
import { Share2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDefaultFieldValue, Contact, SocialLink, FieldDefinition } from "@mms/shared";

import { Field, FormEmptyState, RequiredBanner, CustomFieldInput, EditableSelect, COLLECTION_CARD, COLLECTION_BODY, CardTypeLabel, CardRemoveButton, TYPE_SELECT_WIDTH } from "@/components/ui/FormPrimitives";
import { useVisibleContactFields } from "@/hooks/useVisibleContactFields";
import { useContactConfig, type ValidationError } from '@/lib/contexts/ContactConfigContext';
import { useTranslation } from "@/hooks/useTranslation";

type ContactSocial = SocialLink & Record<string, unknown>;

interface SocialTabProps {
  contactDraft: Partial<Contact>;
  onChange: (updatedContactDraft: Partial<Contact>) => void;
  required?: boolean;
  errors?: ValidationError[];
}

/**
 * SocialTab component for managing contact social media links dynamically.
 * @param props Component properties.
 * @returns React element.
 */
export default function SocialTab({
  contactDraft,
  onChange,
  required = false,
  errors = [],
}: SocialTabProps): React.JSX.Element {
  const { socialPlatforms, socialPlaceholders, updateSocialPlatforms } = useContactConfig();
  const { t } = useTranslation();
  const defaultSocialPlatform = socialPlatforms[0] || "";
  const enabledFields = useVisibleContactFields("socials");

  const createNewSocial = (): ContactSocial => {
    const item: Record<string, unknown> = {};
    enabledFields.forEach((field) => {
      if (field.key === "platform") {
        item[field.key] = defaultSocialPlatform;
      } else {
        item[field.key] = getDefaultFieldValue(field);
      }
    });
    return item as ContactSocial;
  };

  const contactSocials = (contactDraft.socials || []) as ContactSocial[];

  const updateContactSocials = (socials: ContactSocial[]): void => {
    onChange({ ...contactDraft, socials });
  };

  const updateSocial = (socialIndex: number, patch: Partial<ContactSocial>): void => {
    updateContactSocials(
      contactSocials.map((social, index) =>
        index === socialIndex ? { ...social, ...patch } : social,
      ),
    );
  };

  const showPlatformField = enabledFields.find((field) => field.key === "platform");
  const bodyFields = enabledFields.filter((field) => field.key !== "platform");

  const getPlaceholder = (field: FieldDefinition, platform: string): string => {
    if (field.key === "url") {
      return socialPlaceholders[platform] || field.placeholder || t("contacts.form.urlPlaceholderDefault");
    }
    return field.placeholder || "";
  };

  return (
    <div className="space-y-3">
      {required && contactSocials.length === 0 && <RequiredBanner message={t("contacts.form.atLeastOneSocialRequired")} />}
      {contactSocials.length === 0 && <FormEmptyState icon={Share2} text={t("contacts.form.noSocialLinksYet")} />}

      {contactSocials.map((social, socialIndex) => (
        <motion.div
          key={socialIndex}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={COLLECTION_CARD}
        >
          <div className="flex items-center justify-between">
            {showPlatformField ? (
              <div className="flex items-center gap-2">
                <CardTypeLabel>{t("contacts.form.type")}</CardTypeLabel>
                <EditableSelect
                  options={socialPlatforms || []}
                  value={social.platform || ""}
                  onChange={(value) => updateSocial(socialIndex, { platform: value })}
                  onUpdateOptions={updateSocialPlatforms}
                  placeholder={t("contacts.form.selectLabel")}
                  className={TYPE_SELECT_WIDTH}
                />
              </div>
            ) : (
              <div />
            )}
            <CardRemoveButton
              onClick={() => updateContactSocials(contactSocials.filter((_, index) => index !== socialIndex))}
              label={t("contacts.form.removeSocialLink", { index: socialIndex + 1 })}
            />
          </div>

          {bodyFields.length > 0 && (
            <div className={COLLECTION_BODY}>
              {bodyFields.map((field) => {
                const fieldError = errors.find(
                  (error) => error.tabId === "socials" && error.index === socialIndex && error.fieldId === field.key
                );
                return (
                  <Field key={field.key} id={`socials-${socialIndex}-${field.key}`} label={field.label} required={field.required} hint={field.description} error={fieldError?.message}>
                    <CustomFieldInput
                      field={{ ...field, placeholder: getPlaceholder(field, social.platform || defaultSocialPlatform) }}
                      value={social[field.key]}
                      onChange={(value) => updateSocial(socialIndex, { [field.key]: value })}
                      error={!!fieldError}
                    />
                  </Field>
                );
              })}
            </div>
          )}
        </motion.div>
      ))}

      <Button
        type="button"
        variant="ghost"
        onClick={() => updateContactSocials([...contactSocials, createNewSocial()])}
        className="flex items-center min-h-[44px] gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addSocialLink")}</span>
      </Button>
    </div>
  );
}
