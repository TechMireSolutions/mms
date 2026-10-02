import React, { useMemo } from "react";
import { Field } from "@/components/ui/FormPrimitives";
import { FormSelect } from "@/components/ui/FormSelect";
import { useTranslation } from "@/hooks/useTranslation";
import {
  type Faculty,
  type FacultyDesignationDefinition,
  type FacultyMember,
} from "@mms/shared";

export interface FacultyReportingRoleSelectFieldProps {
  facultyDraft?: Partial<FacultyMember>;
  errors: Record<string, string>;
  required?: boolean;
  designationOptions?: FacultyDesignationDefinition[];
  supervisorCandidates?: Faculty[];
  onDraftChange: (patch: Partial<FacultyMember>) => void;
}

export function FacultyReportingRoleSelectField({
  facultyDraft = {},
  errors,
  required,
  designationOptions = [],
  supervisorCandidates,
  onDraftChange,
}: FacultyReportingRoleSelectFieldProps): React.JSX.Element {
  const { t } = useTranslation();

  const currentDesId = facultyDraft.designationId;
  const currentDesName = facultyDraft.designation;

  const reportingRoleOptions = useMemo(() => {
    const list: Array<{ id: string; name: string; hierarchyRank?: number; isActive?: boolean }> = [
      ...designationOptions,
    ];

    if (supervisorCandidates) {
      for (const sup of supervisorCandidates) {
        if (!sup.designation) continue;
        const exists = list.some(
          (d) => d.name.toLowerCase() === sup.designation!.toLowerCase() || (sup.designationId && d.id === sup.designationId),
        );
        if (!exists) {
          list.push({
            id: sup.designationId || `cand-${sup.id}`,
            name: sup.designation,
            hierarchyRank: sup.hierarchyRank,
            isActive: true,
          });
        }
      }
    }

    const filtered = list.filter((d) => {
      if (currentDesId && d.id === currentDesId) return false;
      if (currentDesName && d.name.toLowerCase() === currentDesName.toLowerCase()) return false;
      return d.isActive !== false || d.id === facultyDraft.reportingFacultyId || d.id === facultyDraft.reportingRoleId;
    });

    return [
      { value: "", label: t("faculty.form.noSupervisor") },
      ...filtered.map((d) => ({
        value: d.id,
        label: d.hierarchyRank ? `${d.name} (Rank ${d.hierarchyRank})` : d.name,
      })),
    ];
  }, [
    designationOptions,
    supervisorCandidates,
    currentDesId,
    currentDesName,
    facultyDraft.reportingFacultyId,
    facultyDraft.reportingRoleId,
    t,
  ]);

  const selectedReportingRole = useMemo(() => {
    if (facultyDraft.reportingRoleId) return String(facultyDraft.reportingRoleId);
    if (facultyDraft.reportingDesignationId) return String(facultyDraft.reportingDesignationId);
    if (!facultyDraft.reportingFacultyId) return "";

    const direct = designationOptions.find((d) => d.id === facultyDraft.reportingFacultyId);
    if (direct) return direct.id;

    const supervisor = supervisorCandidates?.find((s) => String(s.id) === String(facultyDraft.reportingFacultyId));
    if (supervisor) {
      const des = designationOptions.find(
        (d) =>
          d.id === supervisor.designationId ||
          (supervisor.designation && d.name.toLowerCase() === supervisor.designation.toLowerCase()),
      );
      if (des) return des.id;
      if (supervisor.designation) {
        const found = reportingRoleOptions.find((o) => o.label.toLowerCase().includes(supervisor.designation!.toLowerCase()));
        if (found) return found.value;
      }
    }

    if (facultyDraft.reportingRole) {
      const des = designationOptions.find((d) => d.name.toLowerCase() === facultyDraft.reportingRole?.toLowerCase());
      if (des) return des.id;
    }

    return String(facultyDraft.reportingFacultyId);
  }, [
    facultyDraft.reportingRoleId,
    facultyDraft.reportingDesignationId,
    facultyDraft.reportingFacultyId,
    facultyDraft.reportingRole,
    designationOptions,
    supervisorCandidates,
    reportingRoleOptions,
  ]);

  const handleReportingRoleChange = (val: string) => {
    if (!val) {
      onDraftChange({
        reportingFacultyId: null,
        reportingRoleId: null,
        reportingRole: null,
        reportingDesignationId: null,
      });
      return;
    }
    const selectedDef = designationOptions.find((d) => d.id === val);
    const selectedName = selectedDef?.name ?? reportingRoleOptions.find((o) => o.value === val)?.label.replace(/\s*\(Rank\s*\d+\)$/, "");
    const matchingSupervisor = supervisorCandidates?.find(
      (cand) =>
        cand.designationId === val ||
        (selectedName && cand.designation?.toLowerCase() === selectedName.toLowerCase()),
    );
    onDraftChange({
      reportingFacultyId: matchingSupervisor?.id ? String(matchingSupervisor.id) : (val.startsWith("cand-") ? val.replace("cand-", "") : val),
      reportingRoleId: val,
      reportingRole: selectedName ?? null,
      reportingDesignationId: val,
    });
  };

  return (
    <Field
      label={t("faculty.form.reportingRole")}
      id="reportingFacultyId"
      required={required}
      error={errors.reportingFacultyId || errors.reportingRoleId}
    >
      <FormSelect
        id="reportingFacultyId"
        name="reportingFacultyId"
        value={selectedReportingRole}
        disabled={facultyDraft.hierarchyRank === 1}
        onChange={handleReportingRoleChange}
        options={reportingRoleOptions}
      />
      {facultyDraft.hierarchyRank === 1 && (
        <p className="mt-1 text-xs text-muted-foreground">{t("faculty.form.topLevelRankNotice")}</p>
      )}
    </Field>
  );
}
