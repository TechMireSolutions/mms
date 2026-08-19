import { Briefcase, Building2, MapPin, Calendar } from "lucide-react";
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
import type { ContactExperience } from "@mms/shared";

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
              accentClass="bg-primary/60 group-hover:bg-primary"
              iconClass="text-primary/70 group-hover:text-primary"
              label={`${t("contacts.fields.experienceEmploymentType")}:`}
              typeSelect={
                showEmploymentType ? (
                  <EditableSelect
                    options={employmentTypeOptions}
                    value={exp.employmentType || ""}
                    onChange={(val) => updateExperience(idx, { employmentType: val })}
                    onUpdateOptions={onUpdateEmploymentTypeOptions}
                    className={TYPE_SELECT_WIDTH}
                    id={`experience-type-${idx}`}
                    name={`experience-type-${idx}`}
                    placeholder={t("contacts.fields.experienceEmploymentType")}
                  />
                ) : undefined
              }
              onRemove={() => removeExperience(idx)}
              removeLabel={t("contacts.form.removeExperience", { index: idx + 1 })}
            >
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2.5 @sm:grid-cols-2">
                  {showTitle ? (
                    <div>
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
                      <FieldErrorMessage message={titleError} />
                    </div>
                  ) : null}

                  {showOrganization ? (
                    <div>
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
                      <FieldErrorMessage message={orgError} />
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-2.5 @sm:grid-cols-3">
                  {showLocation ? (
                    <div>
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
                      <FieldErrorMessage message={locationError} />
                    </div>
                  ) : null}

                  {showStartDate ? (
                    <div>
                      <LeadingIconInput
                        icon={Calendar}
                        id={`experience-start-${idx}`}
                        name={`experience-start-${idx}`}
                        value={exp.startDate || ""}
                        required={isFieldRequired("experience", "startDate")}
                        onChange={(e) => updateExperience(idx, { startDate: e.target.value })}
                        placeholder={t("contacts.form.startDatePlaceholder")}
                        className={cn(startDateError && "border-destructive focus-visible:ring-destructive")}
                      />
                      <FieldErrorMessage message={startDateError} />
                    </div>
                  ) : null}

                  {showEndDate ? (
                    <div>
                      <LeadingIconInput
                        icon={Calendar}
                        id={`experience-end-${idx}`}
                        name={`experience-end-${idx}`}
                        value={exp.isCurrent ? t("contacts.form.present") : exp.endDate || ""}
                        disabled={exp.isCurrent}
                        required={!exp.isCurrent && isFieldRequired("experience", "endDate")}
                        onChange={(e) => updateExperience(idx, { endDate: e.target.value })}
                        placeholder={t("contacts.form.endDatePlaceholder")}
                        className={cn(endDateError && "border-destructive focus-visible:ring-destructive")}
                      />
                      <FieldErrorMessage message={endDateError} />
                    </div>
                  ) : null}
                </div>

                {showIsCurrent ? (
                  <div className="flex items-center gap-2 pt-0.5">
                    <Checkbox
                      id={`experience-current-${idx}`}
                      checked={Boolean(exp.isCurrent)}
                      onCheckedChange={(checked) =>
                        updateExperience(idx, {
                          isCurrent: Boolean(checked),
                          endDate: checked ? "" : exp.endDate,
                        })
                      }
                    />
                    <Label
                      htmlFor={`experience-current-${idx}`}
                      className="text-xs font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors select-none"
                    >
                      {t("contacts.form.currentlyWorkingHere")}
                    </Label>
                    <FieldErrorMessage message={isCurrentError} />
                  </div>
                ) : null}

                {showDescription ? (
                  <div>
                    <Textarea
                      id={`experience-desc-${idx}`}
                      name={`experience-desc-${idx}`}
                      rows={2}
                      value={exp.description || ""}
                      required={isFieldRequired("experience", "description")}
                      onChange={(e) => updateExperience(idx, { description: e.target.value })}
                      placeholder={t("contacts.form.jobDescriptionPlaceholder")}
                      className={cn("text-xs resize-y", descriptionError && "border-destructive focus-visible:ring-destructive")}
                    />
                    <FieldErrorMessage message={descriptionError} />
                  </div>
                ) : null}

                {typeError ? <FieldErrorMessage message={typeError} /> : null}
              </div>
            </ListFieldCard>
          );
        })}
      </AnimatePresence>
    </ContactSubListShell>
  );
}
