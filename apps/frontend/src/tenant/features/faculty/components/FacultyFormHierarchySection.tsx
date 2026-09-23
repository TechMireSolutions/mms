import type React from "react";
import { Network } from "lucide-react";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { SectionCard } from "@/components/ui/SectionCard";
import { useTranslation } from "@/hooks/useTranslation";
import {
  type Faculty,
  type FacultyHierarchyPreset,
  type Teacher,
  FACULTY_HIERARCHY_RANK_PRESETS,
} from "@mms/shared";

export interface FacultyFormHierarchySectionProps {
  teacherDraft: Partial<Teacher>;
  errors: Record<string, string>;
  isFieldEnabled: (fieldId: string) => boolean;
  isFieldRequired: (fieldId: string) => boolean;
  onDraftChange: (patch: Partial<Teacher>) => void;
  supervisorCandidates?: Faculty[];
  hierarchyRankPresets?: readonly FacultyHierarchyPreset[];
}

export function FacultyFormHierarchySection({
  teacherDraft,
  errors,
  isFieldEnabled,
  isFieldRequired,
  onDraftChange,
  supervisorCandidates,
  hierarchyRankPresets = FACULTY_HIERARCHY_RANK_PRESETS,
}: FacultyFormHierarchySectionProps): React.JSX.Element | null {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {showHierarchyRank && (
            <Field
              label={t("teachers.form.hierarchyRank")}
              id="hierarchyRank"
              required={isFieldRequired("hierarchyRank")}
              error={errors.hierarchyRank}
            >
              <FormSelect
                id="hierarchyRank"
                name="hierarchyRank"
                value={teacherDraft.hierarchyRank ? String(teacherDraft.hierarchyRank) : "4"}
                onChange={(val) => {
                  const rank = Number(val) || 4;
                  onDraftChange({
                    hierarchyRank: rank,
                    ...(rank === 1 ? { reportingFacultyId: null } : {}),
                  });
                }}
                options={hierarchyRankPresets.map((preset) => ({
                  value: String(preset.rank),
                  label: `${preset.label} (Rank ${preset.rank})`,
                }))}
              />
            </Field>
          )}

          {showSupervisor && (
            <Field
              label={t("teachers.form.reportingSupervisor")}
              id="reportingFacultyId"
              required={isFieldRequired("reportingFacultyId")}
              error={errors.reportingFacultyId}
            >
              <FormSelect
                id="reportingFacultyId"
                name="reportingFacultyId"
                value={teacherDraft.reportingFacultyId ? String(teacherDraft.reportingFacultyId) : ""}
                disabled={teacherDraft.hierarchyRank === 1}
                onChange={(val) => onDraftChange({ reportingFacultyId: val || null })}
                options={[
                  { value: "", label: t("teachers.form.noSupervisor") },
                  ...(supervisorCandidates || []).map((cand) => ({
                    value: String(cand.id),
                    label: `${cand.name || cand.employeeId || "Faculty"} (Rank ${cand.hierarchyRank ?? 4}${cand.designation ? ` · ${cand.designation}` : ""})`,
                  })),
                ]}
              />
              {teacherDraft.hierarchyRank === 1 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("teachers.form.topLevelRankNotice")}
                </p>
              )}
            </Field>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
