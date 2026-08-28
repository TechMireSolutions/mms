import type React from "react";
import { Award, Tag, Clock, Building2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { EditableSelect, Field, FormCheckboxCard } from "@/components/ui/FormPrimitives";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { ListFieldCard, ContactSubListShell, resolveSubListAllowAdd } from "./ContactSubListCards";
import type { ContactSubListTabBaseProps } from "./types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { ContactSkill } from "@mms/shared";
import { SUB_LIST_CARD_ACCENTS } from "@/lib/semanticTone";

/**
 * TypeScript type representing an individual skill/qualification entry.
 */
export type SkillEntry = ContactSkill;

export interface ContactSkillsTabProps extends ContactSubListTabBaseProps {
  categoryOptions: string[];
  onUpdateCategoryOptions?: (options: string[]) => void;
  defaultCategory?: string;
  proficiencyOptions: string[];
  onUpdateProficiencyOptions?: (options: string[]) => void;
  defaultProficiency?: string;
}

export function ContactSkillsTab({
  contactDraft,
  getLocalId,
  categoryOptions,
  onUpdateCategoryOptions,
  defaultCategory,
  proficiencyOptions,
  onUpdateProficiencyOptions,
  defaultProficiency,
  formInstanceId,
  getListItemError,
  isFieldEnabled,
  isFieldRequired,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactSkillsTabProps): React.JSX.Element {
  const { t } = useTranslation();
  const showName = isFieldEnabled("skills", "name");
  const showCategory = isFieldEnabled("skills", "category");
  const showProficiency = isFieldEnabled("skills", "proficiency");
  const showYears = isFieldEnabled("skills", "yearsOfExperience");
  const showIsCertified = isFieldEnabled("skills", "isCertified");
  const showIssuer = isFieldEnabled("skills", "issuer");
  const showDescription = isFieldEnabled("skills", "description");

  const allowAdd = resolveSubListAllowAdd([
    showName,
    showCategory,
    showProficiency,
    showYears,
    showIsCertified,
    showIssuer,
    showDescription,
  ]);

  const skills = contactDraft.skills || [];
  const emptySkill = (): ContactSkill => ({
    name: "",
    category: defaultCategory || categoryOptions[0] || "",
    proficiency: defaultProficiency || (proficiencyOptions ? proficiencyOptions[0] : "") || "",
    yearsOfExperience: "",
    isCertified: false,
    issuer: "",
    description: "",
  });

  const addSkill = () => {
    addSubListItem("skills", emptySkill());
  };

  const ensureSkill = () => {
    ensureSubListItem("skills", emptySkill());
  };

  const removeSkill = (idx: number) => removeSubListItem("skills", idx);
  const updateSkill = (idx: number, patch: Partial<ContactSkill> & Record<string, unknown>) =>
    updateSubListItem("skills", idx, patch);

  return (
    <ContactSubListShell
      isEmpty={skills.length === 0}
      emptyIcon={Award}
      emptyMessage={t("contacts.form.noSkillsYet")}
      addLabel={t("contacts.form.addSkill")}
      onAdd={addSkill}
      onEnsureRow={ensureSkill}
      allowAdd={allowAdd}
    >
      <AnimatePresence initial={false}>
        {skills.map((skill, idx) => {
          const nameError = getListItemError("skills", "name", idx);
          const categoryError = getListItemError("skills", "category", idx);
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
                        className={cn(nameError && "border-destructive focus-visible:ring-destructive")}
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
                        className={cn(yearsError && "border-destructive focus-visible:ring-destructive")}
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
                        className={cn(issuerError && "border-destructive focus-visible:ring-destructive")}
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
                      className={cn("text-xs resize-y min-h-16", descriptionError && "border-destructive focus-visible:ring-destructive")}
                    />
                  </Field>
                ) : null}
              </div>
            </ListFieldCard>
          );
        })}
      </AnimatePresence>
    </ContactSubListShell>
  );
}
