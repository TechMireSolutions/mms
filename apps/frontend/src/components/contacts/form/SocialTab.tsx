import React from "react";
import { motion } from "framer-motion";
import { Share2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Field, FormEmptyState, RequiredBanner, CustomFieldInput, EditableSelect, COLLECTION_CARD, COLLECTION_BODY, CardTypeLabel, CardRemoveButton, TYPE_SELECT_WIDTH } from "./FormPrimitives";
import { FieldDefinition } from "@mms/shared";
import { useVisibleContactFields } from "../../../hooks/useVisibleContactFields";
import { useContactConfig } from '@/lib/contexts/ContactConfigContext';
import useTranslation from "@/hooks/useTranslation";

interface ContactSocial {
  platform: string;
  url: string;
  [key: string]: unknown;
}

interface ContactFormData {
  socials?: ContactSocial[];
  [key: string]: unknown;
}

interface SocialTabProps {
  data: ContactFormData;
  onChange: (updatedData: ContactFormData) => void;
  required?: boolean;
}

/**
 * SocialTab component for managing contact social media links dynamically.
 * @param props Component properties.
 * @returns React element.
 */
export default function SocialTab({
  data,
  onChange,
  required = false,
}: SocialTabProps): React.JSX.Element {
  const { socialPlatforms, socialPlaceholders, updateSocialPlatforms } = useContactConfig();
  const { t } = useTranslation();
  const defaultSocialPlatform = socialPlatforms[0] || "";
  const enabledFields = useVisibleContactFields("socials");

  const createNewSocial = (): ContactSocial => {
    const item: Record<string, unknown> = {};
    enabledFields.forEach((f) => {
      if (f.key === "platform") {
        item[f.key] = defaultSocialPlatform;
      } else {
        item[f.key] = f.defaultValue !== undefined ? f.defaultValue : "";
      }
    });
    return item as ContactSocial;
  };

  const socials = data.socials && data.socials.length > 0 ? data.socials : [createNewSocial()];

  const upd = (list: ContactSocial[]): void => {
    onChange({ ...data, socials: list });
  };

  const updateSocial = (i: number, patch: Partial<ContactSocial>): void => {
    upd(socials.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  };

  const showPlatformField = enabledFields.find((f) => f.key === "platform");
  const bodyFields = enabledFields.filter((f) => f.key !== "platform");

  const getPlaceholder = (field: FieldDefinition, platform: string): string => {
    if (field.key === "url") {
      return socialPlaceholders[platform] || field.placeholder || t("contacts.form.urlPlaceholderDefault");
    }
    return field.placeholder || "";
  };

  return (
    <div className="space-y-3">
      {required && socials.length === 0 && <RequiredBanner message={t("contacts.form.atLeastOneSocialRequired")} />}
      {socials.length === 0 && <FormEmptyState icon={Share2} text={t("contacts.form.noSocialLinksYet")} />}

      {socials.map((s, i) => (
        <motion.div
          key={i}
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
                  value={s.platform || ""}
                  onChange={(val) => updateSocial(i, { platform: val })}
                  onUpdateOptions={updateSocialPlatforms}
                  placeholder={t("contacts.form.selectLabel")}
                  className={TYPE_SELECT_WIDTH}
                />
              </div>
            ) : (
              <div />
            )}
            <CardRemoveButton
              onClick={() => upd(socials.filter((_, j) => j !== i))}
              label={t("contacts.form.removeSocialLink", { index: i + 1 })}
            />
          </div>

          {bodyFields.length > 0 && (
            <div className={COLLECTION_BODY}>
              {bodyFields.map((field) => (
                <Field key={field.key} label={field.label} required={field.required} hint={field.description}>
                  <CustomFieldInput
                    field={{ ...field, placeholder: getPlaceholder(field, s.platform || defaultSocialPlatform) }}
                    value={s[field.key]}
                    onChange={(val) => updateSocial(i, { [field.key]: val })}
                  />
                </Field>
              ))}
            </div>
          )}
        </motion.div>
      ))}

      <Button
        type="button"
        variant="ghost"
        onClick={() => upd([...socials, createNewSocial()])}
        className="flex items-center min-h-[44px] gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 hover:bg-transparent transition-colors p-0 justify-start"
      >
        <Plus className="w-4 h-4" />
        <span>{t("contacts.form.addSocialLink")}</span>
      </Button>
    </div>
  );
}
