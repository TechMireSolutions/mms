import { Award, Clock, Building2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { EditableSelect, FieldErrorMessage, TYPE_SELECT_WIDTH } from "@/components/ui/FormPrimitives";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { ListFieldCard, ContactSubListShell, resolveSubListAllowAdd } from "./ContactSubListCards";
import type { ContactSubListTabBaseProps } from "./types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { ContactSkill } from "@mms/shared";

interface ContactSkillsTabProps extends ContactSubListTabBaseProps {
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
  getListItemError,
  isFieldEnabled,
  isFieldRequired,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactSkillsTabProps): JSX.Element {
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
    proficiency: defaultProficiency || proficiencyOptions[1] || "Intermediate",
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
              icon={Award}
              accentClass="bg-primary/60 group-hover:bg-primary"
              iconClass="text-primary/70 group-hover:text-primary"
              label={`${t("contacts.fields.skillCategory")}:`}
              typeSelect={
                showCategory ? (
                  <EditableSelect
                    options={categoryOptions}
                    value={skill.category || ""}
                    onChange={(val) => updateSkill(idx, { category: val })}
                    onUpdateOptions={onUpdateCategoryOptions}
                    className={TYPE_SELECT_WIDTH}
                    id={`skill-category-${idx}`}
                    name={`skill-category-${idx}`}
                    placeholder={t("contacts.fields.skillCategory")}
                  />
                ) : undefined
              }
              onRemove={() => removeSkill(idx)}
              removeLabel={t("contacts.form.removeSkill", { index: idx + 1 })}
            >
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2.5 @sm:grid-cols-2">
                  {showName ? (
                    <div>
                      <LeadingIconInput
                        icon={Award}
                        id={`skill-name-${idx}`}
                        name={`skill-name-${idx}`}
                        value={skill.name || ""}
                        required={isFieldRequired("skills", "name")}
                        onChange={(e) => updateSkill(idx, { name: e.target.value })}
                        placeholder={t("contacts.form.skillNamePlaceholder")}
                        className={cn(nameError && "border-destructive focus-visible:ring-destructive")}
                      />
                      <FieldErrorMessage message={nameError} />
                    </div>
                  ) : null}

                  {showProficiency ? (
                    <div>
                      <EditableSelect
                        options={proficiencyOptions}
                        value={skill.proficiency || ""}
                        onChange={(val) => updateSkill(idx, { proficiency: val })}
                        onUpdateOptions={onUpdateProficiencyOptions}
                        className="w-full"
                        id={`skill-proficiency-${idx}`}
                        name={`skill-proficiency-${idx}`}
                        placeholder={t("contacts.fields.skillProficiency")}
                      />
                      <FieldErrorMessage message={proficiencyError} />
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-2.5 @sm:grid-cols-2">
                  {showYears ? (
                    <div>
                      <LeadingIconInput
                        icon={Clock}
                        id={`skill-years-${idx}`}
                        name={`skill-years-${idx}`}
                        value={skill.yearsOfExperience || ""}
                        required={isFieldRequired("skills", "yearsOfExperience")}
                        onChange={(e) => updateSkill(idx, { yearsOfExperience: e.target.value })}
                        placeholder={t("contacts.form.skillYearsPlaceholder")}
                        className={cn(yearsError && "border-destructive focus-visible:ring-destructive")}
                      />
                      <FieldErrorMessage message={yearsError} />
                    </div>
                  ) : null}

                  {showIssuer ? (
                    <div>
                      <LeadingIconInput
                        icon={Building2}
                        id={`skill-issuer-${idx}`}
                        name={`skill-issuer-${idx}`}
                        value={skill.issuer || ""}
                        required={isFieldRequired("skills", "issuer")}
                        onChange={(e) => updateSkill(idx, { issuer: e.target.value })}
                        placeholder={t("contacts.form.skillIssuerPlaceholder")}
                        className={cn(issuerError && "border-destructive focus-visible:ring-destructive")}
                      />
                      <FieldErrorMessage message={issuerError} />
                    </div>
                  ) : null}
                </div>

                {showIsCertified ? (
                  <div className="flex items-center gap-2 pt-0.5">
                    <Checkbox
                      id={`skill-certified-${idx}`}
                      checked={Boolean(skill.isCertified)}
                      onCheckedChange={(checked) =>
                        updateSkill(idx, {
                          isCertified: Boolean(checked),
                        })
                      }
                    />
                    <Label
                      htmlFor={`skill-certified-${idx}`}
                      className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors select-none"
                    >
                      {t("contacts.fields.skillIsCertified")}
                    </Label>
                    <FieldErrorMessage message={certifiedError} />
                  </div>
                ) : null}

                {showDescription ? (
                  <div>
                    <Textarea
                      id={`skill-desc-${idx}`}
                      name={`skill-desc-${idx}`}
                      rows={2}
                      value={skill.description || ""}
                      required={isFieldRequired("skills", "description")}
                      onChange={(e) => updateSkill(idx, { description: e.target.value })}
                      placeholder={t("contacts.form.skillDescriptionPlaceholder")}
                      className={cn("text-xs resize-y", descriptionError && "border-destructive focus-visible:ring-destructive")}
                    />
                    <FieldErrorMessage message={descriptionError} />
                  </div>
                ) : null}

                {categoryError ? <FieldErrorMessage message={categoryError} /> : null}
              </div>
            </ListFieldCard>
          );
        })}
      </AnimatePresence>
    </ContactSubListShell>
  );
}
