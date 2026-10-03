import type React from "react";
import { Network, BadgeCheck } from "lucide-react";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { SectionCard } from "@/components/ui/SectionCard";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { useTranslation } from "@/hooks/useTranslation";
import {
  type Faculty,
  type FacultyHierarchyPreset,
  type FacultyMember,
  FACULTY_HIERARCHY_RANK_PRESETS,
} from "@mms/shared";

export interface FacultyFormHierarchySectionProps {
  facultyDraft?: Partial<FacultyMember>;
  errors: Record<string, string>;
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<FacultyMember>) => void;
  supervisorCandidates?: Faculty[];
  hierarchyRankPresets?: readonly FacultyHierarchyPreset[];
}

export function FacultyFormHierarchySection(props: FacultyFormHierarchySectionProps): React.JSX.Element | null {
  const {
    facultyDraft = {},
    errors,
    isFieldEnabled,
    isFieldRequired,
    onDraftChange,
    supervisorCandidates,
    hierarchyRankPresets = FACULTY_HIERARCHY_RANK_PRESETS,
  } = props;
  const { t } = useTranslation();
  const showSupervisor = isFieldEnabled("reportingFacultyId");
  const showHierarchyRank = isFieldEnabled("hierarchyRank");

  if (!showSupervisor && !showHierarchyRank) return null;

  return (
    <div className="space-y-4 text-start">
      <SectionCard
        title={t("faculty.form.tab.hierarchy")}
        icon={Network}
        accentColor="primary"
      >
        <WarningCallout
          className="mb-4"
          density="compact"
          tone="info"
          title={t("faculty.form.hierarchyDeprecatedNotice")}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {showHierarchyRank && (
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3" id="hierarchyRank">
              <div className="flex items-center gap-2">
                <BadgeCheck className="size-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("faculty.form.hierarchyRank")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hierarchyRankPresets.find((preset) => preset.rank === (facultyDraft.hierarchyRank ?? 4))?.label ?? t("common.notSpecified")}
                    {` · ${t("faculty.form.rankValue", { rank: facultyDraft.hierarchyRank ?? 4 })}`}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t("faculty.designations.rankDerivedHint")}</p>
              {errors.hierarchyRank ? <p className="mt-1 text-xs text-destructive">{errors.hierarchyRank}</p> : null}
            </div>
          )}

          {showSupervisor && (
            <Field
              label={t("faculty.form.reportingSupervisor")}
              id="reportingFacultyId"
              required={isFieldRequired("reportingFacultyId")}
              error={errors.reportingFacultyId}
            >
              <FormSelect
                id="reportingFacultyId"
                name="reportingFacultyId"
                value={facultyDraft.reportingFacultyId ? String(facultyDraft.reportingFacultyId) : ""}
                disabled={facultyDraft.hierarchyRank === 1}
                onChange={(val) => onDraftChange({ reportingFacultyId: val || null })}
                options={[
                  { value: "", label: t("faculty.form.noSupervisor") },
                  ...(supervisorCandidates || []).map((cand) => ({
                    value: String(cand.id),
                    label: `${cand.name || cand.employeeId || "Faculty"} (Rank ${cand.hierarchyRank ?? 4}${cand.designation ? ` · ${cand.designation}` : ""})`,
                  })),
                ]}
              />
              {facultyDraft.hierarchyRank === 1 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("faculty.form.topLevelRankNotice")}
                </p>
              )}
            </Field>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
