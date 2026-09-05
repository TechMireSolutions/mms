import type React from "react";
import { Tag, Clock, Building2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { EditableSelect, Field, FormCheckboxCard } from "@/components/ui/FormPrimitives";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { ListFieldCard } from "./ContactSubListCards";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { ContactSkill } from "@mms/shared";
import { SUB_LIST_CARD_ACCENTS } from "@/lib/semanticTone";
import { FORM_INPUT_ERROR } from "@/components/ui/formStyles";

export interface ContactSkillCardItemProps {
  skill: ContactSkill;
  idx: number;
  formInstanceId: string;
  categoryOptions: string[];
  onUpdateCategoryOptions?: (options: string[]) => void;
  proficiencyOptions: string[];
  onUpdateProficiencyOptions?: (options: string[]) => void;
  showName: boolean;
  showCategory: boolean;
  showProficiency: boolean;
  showYears: boolean;
  showIsCertified: boolean;
  showIssuer: boolean;
  showDescription: boolean;
  isFieldRequired: (group: string, field: string) => boolean;
  getListItemError: (group: string, field: string, index: number) => string | undefined;
  getLocalId: (group: string, index: number) => string;
  updateSkill: (idx: number, patch: Partial<ContactSkill> & Record<string, unknown>) => void;
  removeSkill: (idx: number) => void;
}

export function ContactSkillCardItem({
  skill,
  idx,
  formInstanceId,
  categoryOptions,
  onUpdateCategoryOptions,
  proficiencyOptions,
  onUpdateProficiencyOptions,
  showName,
  showCategory,
  showProficiency,
  showYears,
  showIsCertified,
  showIssuer,
  showDescription,
  isFieldRequired,
  getListItemError,
  getLocalId,
  updateSkill,
  removeSkill,
}: ContactSkillCardItemProps): React.JSX.Element {
  const { t } = useTranslation();

  const nameError = getListItemError("skills", "name", idx);
  const proficiencyError = getListItemError("skills", "proficiency", idx);
  const yearsError = getListItemError("skills", "yearsOfExperience", idx);
  const certifiedError = getListItemError("skills", "isCertified", idx);
  const issuerError = getListItemError("skills", "issuer", idx);
  const descriptionError = getListItemError("skills", "description", idx);

  return (
    <ListFieldCard
      key={getLocalId("skills", idx)}
      id={getLocalId("skills", idx)}
      index={idx}
      accentClass={SUB_LIST_CARD_ACCENTS.skills.accent}
      label={showCategory ? `${t("contacts.fields.skillCategory")}:` : undefined}
      typeSelect={
        showCategory ? (
          <EditableSelect
            options={categoryOptions}
            value={skill.category || ""}
            onChange={(val) => updateSkill(idx, { category: val })}
            onUpdateOptions={onUpdateCategoryOptions}
            className="w-40 @sm:w-52 min-w-0"
            id={`cf-${formInstanceId}-skill-category-${idx}`}
            name={`cf-${formInstanceId}-skill-category-${idx}`}
            placeholder={t("contacts.form.skillCategoryPlaceholder")}
          />
        ) : undefined
      }
      onRemove={() => removeSkill(idx)}
      removeLabel={t("contacts.form.removeSkill", { index: idx + 1 })}
    >
      <div className="space-y-3">
        {/* Row 1: Skill / Subject Name & Proficiency Level */}
        <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
          {showName ? (
            <Field
              label={t("contacts.fields.skillName")}
              required={isFieldRequired("skills", "name")}
              error={nameError}
              id={`cf-${formInstanceId}-skill-name-${idx}`}
            >
              <LeadingIconInput
                icon={Tag}
                id={`cf-${formInstanceId}-skill-name-${idx}`}
                name={`cf-${formInstanceId}-skill-name-${idx}`}
                autoCapitalize="words"
                enterKeyHint="next"
                aria-invalid={Boolean(nameError)}
                value={skill.name || ""}
                required={isFieldRequired("skills", "name")}
                onChange={(e) => updateSkill(idx, { name: e.target.value })}
                placeholder={t("contacts.form.skillNamePlaceholder")}
                className={cn(nameError && FORM_INPUT_ERROR)}
              />
            </Field>
          ) : null}

          {showProficiency ? (
            <Field
              label={t("contacts.fields.skillProficiency")}
              required={isFieldRequired("skills", "proficiency")}
              error={proficiencyError}
              id={`cf-${formInstanceId}-skill-proficiency-${idx}`}
            >
              <EditableSelect
                options={proficiencyOptions}
                value={skill.proficiency || ""}
                onChange={(val) => updateSkill(idx, { proficiency: val })}
                onUpdateOptions={onUpdateProficiencyOptions}
                className="w-full"
                id={`cf-${formInstanceId}-skill-proficiency-${idx}`}
                name={`cf-${formInstanceId}-skill-proficiency-${idx}`}
                placeholder={t("contacts.form.skillProficiencyPlaceholder")}
              />
            </Field>
          ) : null}
        </div>

        {/* Row 2: Experience (Years) & Issued By / Sanad Source */}
        <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
          {showYears ? (
            <Field
              label={t("contacts.fields.skillYears")}
              required={isFieldRequired("skills", "yearsOfExperience")}
              error={yearsError}
              id={`cf-${formInstanceId}-skill-years-${idx}`}
            >
              <LeadingIconInput
                icon={Clock}
                id={`cf-${formInstanceId}-skill-years-${idx}`}
                name={`cf-${formInstanceId}-skill-years-${idx}`}
                inputMode="numeric"
                spellCheck={false}
                enterKeyHint="next"
                aria-invalid={Boolean(yearsError)}
                value={skill.yearsOfExperience || ""}
                required={isFieldRequired("skills", "yearsOfExperience")}
                onChange={(e) => updateSkill(idx, { yearsOfExperience: e.target.value })}
                placeholder={t("contacts.form.skillYearsPlaceholder")}
                className={cn(yearsError && FORM_INPUT_ERROR)}
              />
            </Field>
          ) : null}

          {showIssuer ? (
            <Field
              label={t("contacts.fields.skillIssuer")}
              required={isFieldRequired("skills", "issuer")}
              error={issuerError}
              id={`cf-${formInstanceId}-skill-issuer-${idx}`}
            >
              <LeadingIconInput
                icon={Building2}
                id={`cf-${formInstanceId}-skill-issuer-${idx}`}
                name={`cf-${formInstanceId}-skill-issuer-${idx}`}
                autoCapitalize="words"
                enterKeyHint="next"
                aria-invalid={Boolean(issuerError)}
                value={skill.issuer || ""}
                required={isFieldRequired("skills", "issuer")}
                onChange={(e) => updateSkill(idx, { issuer: e.target.value })}
                placeholder={t("contacts.form.skillIssuerPlaceholder")}
                className={cn(issuerError && FORM_INPUT_ERROR)}
              />
            </Field>
          ) : null}
        </div>

        {/* Inline Checkbox: Certified / Ijazah Holder */}
        {showIsCertified ? (
          <FormCheckboxCard
            id={`cf-${formInstanceId}-skill-certified-${idx}`}
            name={`cf-${formInstanceId}-skill-certified-${idx}`}
            checked={Boolean(skill.isCertified)}
            onCheckedChange={(checked) =>
              updateSkill(idx, {
                isCertified: checked,
              })
            }
            label={t("contacts.fields.skillIsCertified")}
            error={certifiedError}
          />
        ) : null}

        {/* Row 4: Notes / Specialization */}
        {showDescription ? (
          <Field
            label={t("contacts.fields.skillDescription")}
            required={isFieldRequired("skills", "description")}
            error={descriptionError}
            id={`cf-${formInstanceId}-skill-desc-${idx}`}
          >
            <Textarea
              id={`cf-${formInstanceId}-skill-desc-${idx}`}
              name={`cf-${formInstanceId}-skill-desc-${idx}`}
              rows={2}
              value={skill.description || ""}
              required={isFieldRequired("skills", "description")}
              onChange={(e) => updateSkill(idx, { description: e.target.value })}
              placeholder={t("contacts.form.skillDescriptionPlaceholder")}
              className={cn("text-xs resize-y min-h-16", descriptionError && FORM_INPUT_ERROR)}
            />
          </Field>
        ) : null}
      </div>
    </ListFieldCard>
  );
}
