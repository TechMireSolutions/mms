import type React from "react";
import { Briefcase, Building2, MapPin } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { EditableSelect, Field } from "@/components/ui/FormPrimitives";
import { LeadingIconInput } from "@/components/ui/LeadingIconInput";
import { ListFieldCard } from "./ContactSubListCards";
import type { ContactSubListTabBaseProps } from "./types";
import { ContactExperienceDatesSection } from "./ContactExperienceDatesSection";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { ContactExperience } from "@mms/shared";
import { SUB_LIST_CARD_ACCENTS } from "@/lib/semanticTone";
import { FORM_INPUT_ERROR } from "@/components/ui/formStyles";

export interface ContactExperienceEntryCardProps
  extends Pick<
    ContactSubListTabBaseProps,
    "formInstanceId" | "getLocalId" | "getListItemError" | "isFieldRequired"
  > {
  exp: ContactExperience;
  idx: number;
  showTitle: boolean;
  showOrganization: boolean;
  showEmploymentType: boolean;
  showLocation: boolean;
  showStartDate: boolean;
  showEndDate: boolean;
  showIsCurrent: boolean;
  showDescription: boolean;
  employmentTypeOptions: string[];
  onUpdateEmploymentTypeOptions?: (options: string[]) => void;
  onUpdate: (patch: Partial<ContactExperience> & Record<string, unknown>) => void;
  onRemove: () => void;
}

export function ContactExperienceEntryCard({
  exp,
  idx,
  formInstanceId,
  getLocalId,
  getListItemError,
  isFieldRequired,
  showTitle,
  showOrganization,
  showEmploymentType,
  showLocation,
  showStartDate,
  showEndDate,
  showIsCurrent,
  showDescription,
  employmentTypeOptions,
  onUpdateEmploymentTypeOptions,
  onUpdate,
  onRemove,
}: ContactExperienceEntryCardProps): React.JSX.Element {
  const { t } = useTranslation();

  const titleError = getListItemError("experience", "title", idx);
  const orgError = getListItemError("experience", "organization", idx);
  const locationError = getListItemError("experience", "location", idx);
  const startDateError = getListItemError("experience", "startDate", idx);
  const endDateError = getListItemError("experience", "endDate", idx);
  const isCurrentError = getListItemError("experience", "isCurrent", idx);
  const descriptionError = getListItemError("experience", "description", idx);

  return (
    <ListFieldCard
      id={getLocalId("experience", idx)}
      index={idx}
      accentClass={SUB_LIST_CARD_ACCENTS.experience.accent}
      label={showEmploymentType ? `${t("contacts.fields.experienceEmploymentType")}:` : undefined}
      typeSelect={
        showEmploymentType ? (
          <EditableSelect
            options={employmentTypeOptions}
            value={exp.employmentType || ""}
            onChange={(val) => onUpdate({ employmentType: val })}
            onUpdateOptions={onUpdateEmploymentTypeOptions}
            className="w-40 @sm:w-52 min-w-0"
            id={`cf-${formInstanceId}-experience-type-${idx}`}
            name={`cf-${formInstanceId}-experience-type-${idx}`}
            placeholder={t("contacts.form.employmentTypePlaceholder")}
          />
        ) : undefined
      }
      onRemove={onRemove}
      removeLabel={t("contacts.form.removeExperience", { index: idx + 1 })}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2">
          {showTitle ? (
            <Field
              label={t("contacts.fields.experienceTitle")}
              required={isFieldRequired("experience", "title")}
              error={titleError}
              id={`cf-${formInstanceId}-experience-title-${idx}`}
            >
              <LeadingIconInput
                icon={Briefcase}
                id={`cf-${formInstanceId}-experience-title-${idx}`}
                name={`cf-${formInstanceId}-experience-title-${idx}`}
                autoComplete="organization-title"
                autoCapitalize="words"
                enterKeyHint="next"
                aria-invalid={Boolean(titleError)}
                value={exp.title || ""}
                required={isFieldRequired("experience", "title")}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder={t("contacts.form.jobTitlePlaceholder")}
                className={cn(titleError && FORM_INPUT_ERROR)}
              />
            </Field>
          ) : null}

          {showOrganization ? (
            <Field
              label={t("contacts.fields.experienceOrganization")}
              required={isFieldRequired("experience", "organization")}
              error={orgError}
              id={`cf-${formInstanceId}-experience-org-${idx}`}
            >
              <LeadingIconInput
                icon={Building2}
                id={`cf-${formInstanceId}-experience-org-${idx}`}
                name={`cf-${formInstanceId}-experience-org-${idx}`}
                autoComplete="organization"
                autoCapitalize="words"
                enterKeyHint="next"
                aria-invalid={Boolean(orgError)}
                value={exp.organization || ""}
                required={isFieldRequired("experience", "organization")}
                onChange={(e) => onUpdate({ organization: e.target.value })}
                placeholder={t("contacts.form.organizationPlaceholder")}
                className={cn(orgError && FORM_INPUT_ERROR)}
              />
            </Field>
          ) : null}
        </div>

        {showLocation ? (
          <Field
            label={t("contacts.fields.experienceLocation")}
            required={isFieldRequired("experience", "location")}
            error={locationError}
            id={`cf-${formInstanceId}-experience-location-${idx}`}
          >
            <LeadingIconInput
              icon={MapPin}
              id={`cf-${formInstanceId}-experience-location-${idx}`}
              name={`cf-${formInstanceId}-experience-location-${idx}`}
              autoCapitalize="words"
              enterKeyHint="next"
              aria-invalid={Boolean(locationError)}
              value={exp.location || ""}
              required={isFieldRequired("experience", "location")}
              onChange={(e) => onUpdate({ location: e.target.value })}
              placeholder={t("contacts.form.locationPlaceholder")}
              className={cn(locationError && FORM_INPUT_ERROR)}
            />
          </Field>
        ) : null}

        <ContactExperienceDatesSection
          exp={exp}
          idx={idx}
          formInstanceId={formInstanceId}
          showStartDate={showStartDate}
          showEndDate={showEndDate}
          showIsCurrent={showIsCurrent}
          startDateError={startDateError}
          endDateError={endDateError}
          isCurrentError={isCurrentError}
          isFieldRequired={isFieldRequired}
          onUpdate={onUpdate}
        />

        {showDescription ? (
          <Field
            label={t("contacts.fields.experienceDescription")}
            required={isFieldRequired("experience", "description")}
            error={descriptionError}
            id={`cf-${formInstanceId}-experience-desc-${idx}`}
          >
            <Textarea
              id={`cf-${formInstanceId}-experience-desc-${idx}`}
              name={`cf-${formInstanceId}-experience-desc-${idx}`}
              rows={2}
              value={exp.description || ""}
              required={isFieldRequired("experience", "description")}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder={t("contacts.form.jobDescriptionPlaceholder")}
              className={cn("text-xs resize-y min-h-16", descriptionError && FORM_INPUT_ERROR)}
            />
          </Field>
        ) : null}
      </div>
    </ListFieldCard>
  );
}
