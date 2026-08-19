import { Briefcase, Building2, MapPin } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/DatePicker";
import { EditableSelect, Field, FormCheckboxCard } from "@/components/ui/FormPrimitives";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { ListFieldCard, ContactSubListShell, resolveSubListAllowAdd } from "./ContactSubListCards";
import type { ContactSubListTabBaseProps } from "./types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { ContactExperience } from "@mms/shared";
import { SUB_LIST_CARD_ACCENTS } from "@/lib/semanticTone";


/**
 * TypeScript type representing an individual experience entry.
 */
export type ExperienceEntry = ContactExperience;

interface ContactExperienceTabProps extends ContactSubListTabBaseProps {
  employmentTypeOptions: string[];
  onUpdateEmploymentTypeOptions?: (options: string[]) => void;
  defaultEmploymentType?: string;
}

export function ContactExperienceTab({
  contactDraft,
  getLocalId,
  employmentTypeOptions,
  onUpdateEmploymentTypeOptions,
  defaultEmploymentType,
  getListItemError,
  isFieldEnabled,
  isFieldRequired,
  addSubListItem,
  ensureSubListItem,
  updateSubListItem,
  removeSubListItem,
}: ContactExperienceTabProps): JSX.Element {
  const { t } = useTranslation();
  const showTitle = isFieldEnabled("experience", "title");
  const showOrganization = isFieldEnabled("experience", "organization");
  const showEmploymentType = isFieldEnabled("experience", "employmentType");
  const showLocation = isFieldEnabled("experience", "location");
  const showStartDate = isFieldEnabled("experience", "startDate");
  const showEndDate = isFieldEnabled("experience", "endDate");
  const showIsCurrent = isFieldEnabled("experience", "isCurrent");
  const showDescription = isFieldEnabled("experience", "description");

  const allowAdd = resolveSubListAllowAdd([
    showTitle,
    showOrganization,
    showEmploymentType,
    showLocation,
    showStartDate,
    showEndDate,
    showIsCurrent,
    showDescription,
  ]);

  const experiences = contactDraft.experience || [];
  const emptyExperience = (): ContactExperience => ({
    title: "",
    organization: "",
    employmentType: defaultEmploymentType || employmentTypeOptions[0] || "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  });

  const addExperience = () => {
    addSubListItem("experience", emptyExperience());
  };

  const ensureExperience = () => {
    ensureSubListItem("experience", emptyExperience());
  };

  const removeExperience = (idx: number) => removeSubListItem("experience", idx);
  const updateExperience = (idx: number, patch: Partial<ContactExperience> & Record<string, unknown>) =>
    updateSubListItem("experience", idx, patch);

  return (
    <ContactSubListShell
      isEmpty={experiences.length === 0}
      emptyIcon={Briefcase}
      emptyMessage={t("contacts.form.noExperienceYet")}
      addLabel={t("contacts.form.addExperience")}
      onAdd={addExperience}
      onEnsureRow={ensureExperience}
      allowAdd={allowAdd}
    >
      <AnimatePresence initial={false}>
        {experiences.map((exp, idx) => {
          const titleError = getListItemError("experience", "title", idx);
          const orgError = getListItemError("experience", "organization", idx);
          const typeError = getListItemError("experience", "employmentType", idx);
          const locationError = getListItemError("experience", "location", idx);
          const startDateError = getListItemError("experience", "startDate", idx);
          const endDateError = getListItemError("experience", "endDate", idx);
          const isCurrentError = getListItemError("experience", "isCurrent", idx);
          const descriptionError = getListItemError("experience", "description", idx);

          return (
            <ListFieldCard
              key={getLocalId("experience", idx)}
              id={getLocalId("experience", idx)}
              index={idx}
              icon={Briefcase}
              accentClass={SUB_LIST_CARD_ACCENTS.experience.accent}
              iconClass={SUB_LIST_CARD_ACCENTS.experience.icon}
              label={t("contacts.form.experienceNumber", { index: idx + 1 })}
              onRemove={() => removeExperience(idx)}
              removeLabel={t("contacts.form.removeExperience", { index: idx + 1 })}
            >
              <div className="space-y-3">
                {/* Row 1: Job Title & Organization */}
                <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
                  {showTitle ? (
                    <Field
                      label={t("contacts.fields.experienceTitle")}
                      required={isFieldRequired("experience", "title")}
                      error={titleError}
                      id={`experience-title-${idx}`}
                    >
                      <LeadingIconInput
                        icon={Briefcase}
                        id={`experience-title-${idx}`}
                        name={`experience-title-${idx}`}
                        value={exp.title || ""}
                        required={isFieldRequired("experience", "title")}
                        onChange={(e) => updateExperience(idx, { title: e.target.value })}
                        placeholder={t("contacts.form.jobTitlePlaceholder")}
                        className={cn(titleError && "border-destructive focus-visible:ring-destructive")}
                      />
                    </Field>
                  ) : null}

                  {showOrganization ? (
                    <Field
                      label={t("contacts.fields.experienceOrganization")}
                      required={isFieldRequired("experience", "organization")}
                      error={orgError}
                      id={`experience-org-${idx}`}
                    >
                      <LeadingIconInput
                        icon={Building2}
                        id={`experience-org-${idx}`}
                        name={`experience-org-${idx}`}
                        value={exp.organization || ""}
                        required={isFieldRequired("experience", "organization")}
                        onChange={(e) => updateExperience(idx, { organization: e.target.value })}
                        placeholder={t("contacts.form.organizationPlaceholder")}
                        className={cn(orgError && "border-destructive focus-visible:ring-destructive")}
                      />
                    </Field>
                  ) : null}
                </div>

                {/* Row 2: Employment Type & Location */}
                <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
                  {showEmploymentType ? (
                    <Field
                      label={t("contacts.fields.experienceEmploymentType")}
                      required={isFieldRequired("experience", "employmentType")}
                      error={typeError}
                      id={`experience-type-${idx}`}
                    >
                      <EditableSelect
                        options={employmentTypeOptions}
                        value={exp.employmentType || ""}
                        onChange={(val) => updateExperience(idx, { employmentType: val })}
                        onUpdateOptions={onUpdateEmploymentTypeOptions}
                        id={`experience-type-${idx}`}
                        name={`experience-type-${idx}`}
                        placeholder={t("contacts.form.employmentTypePlaceholder")}
                        className="w-full"
                      />
                    </Field>
                  ) : null}

                  {showLocation ? (
                    <Field
                      label={t("contacts.fields.experienceLocation")}
                      required={isFieldRequired("experience", "location")}
                      error={locationError}
                      id={`experience-location-${idx}`}
                    >
                      <LeadingIconInput
                        icon={MapPin}
                        id={`experience-location-${idx}`}
                        name={`experience-location-${idx}`}
                        value={exp.location || ""}
                        required={isFieldRequired("experience", "location")}
                        onChange={(e) => updateExperience(idx, { location: e.target.value })}
                        placeholder={t("contacts.form.locationPlaceholder")}
                        className={cn(locationError && "border-destructive focus-visible:ring-destructive")}
                      />
                    </Field>
                  ) : null}
                </div>

                {/* Row 3: Start Date & End Date */}
                <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
                  {showStartDate ? (
                    <Field
                      label={t("contacts.fields.experienceStartDate")}
                      required={isFieldRequired("experience", "startDate")}
                      error={startDateError}
                      id={`experience-start-${idx}`}
                    >
                      <DatePicker
                        id={`experience-start-${idx}`}
                        name={`experience-start-${idx}`}
                        value={exp.startDate || undefined}
                        required={isFieldRequired("experience", "startDate")}
                        onChange={(dateStr) => updateExperience(idx, { startDate: dateStr })}
                        placeholder={t("contacts.form.startDatePlaceholder")}
                      />
                    </Field>
                  ) : null}

                  {showEndDate ? (
                    <Field
                      label={t("contacts.fields.experienceEndDate")}
                      required={!exp.isCurrent && isFieldRequired("experience", "endDate")}
                      error={endDateError}
                      id={`experience-end-${idx}`}
                    >
                      <DatePicker
                        id={`experience-end-${idx}`}
                        name={`experience-end-${idx}`}
                        value={exp.isCurrent ? undefined : exp.endDate || undefined}
                        disabled={Boolean(exp.isCurrent)}
                        required={!exp.isCurrent && isFieldRequired("experience", "endDate")}
                        onChange={(dateStr) => updateExperience(idx, { endDate: dateStr })}
                        placeholder={exp.isCurrent ? t("contacts.form.present") : t("contacts.form.endDatePlaceholder")}
                      />
                    </Field>
                  ) : null}
                </div>

                {/* Inline Checkbox: Currently Working Here */}
                {showIsCurrent ? (
                  <FormCheckboxCard
                    id={`experience-current-${idx}`}
                    name={`experience-current-${idx}`}
                    checked={Boolean(exp.isCurrent)}
                    onCheckedChange={(checked) =>
                      updateExperience(idx, {
                        isCurrent: checked,
                        endDate: checked ? "" : exp.endDate,
                      })
                    }
                    label={t("contacts.form.currentlyWorkingHere")}
                    error={isCurrentError}
                  />
                ) : null}


                {/* Row 4: Description */}
                {showDescription ? (
                  <Field
                    label={t("contacts.fields.experienceDescription")}
                    required={isFieldRequired("experience", "description")}
                    error={descriptionError}
                    id={`experience-desc-${idx}`}
                  >
                    <Textarea
                      id={`experience-desc-${idx}`}
                      name={`experience-desc-${idx}`}
                      rows={2}
                      value={exp.description || ""}
                      required={isFieldRequired("experience", "description")}
                      onChange={(e) => updateExperience(idx, { description: e.target.value })}
                      placeholder={t("contacts.form.jobDescriptionPlaceholder")}
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
