import React from "react";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { PersonDetailHeroCard } from "@/components/ui/PersonDetailHeroCard";
import { EmployeeIdBadge } from "@/tenant/features/faculty/components/EmployeeIdBadge";
import { getGenderCardAccent } from "@/lib/genderUi";
import { resolveTeacherStatus, type Teacher } from "@mms/shared";

export interface FacultyDetailHeroCardProps {
  teacher: Teacher;
  displayName: string;
  avatar?: string | null;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  showStatus: boolean;
}

export function FacultyDetailHeroCard({
  teacher,
  displayName,
  avatar,
  statusConfig,
  showStatus,
}: FacultyDetailHeroCardProps): React.JSX.Element {
  return (
    <PersonDetailHeroCard
      id={String(teacher.id)}
      displayName={displayName}
      avatar={avatar}
      gender={teacher.gender}
      accentColor={getGenderCardAccent(teacher.gender)}
    >
      {showStatus ? (
        <StatusBadge status={resolveTeacherStatus(teacher.status)} config={statusConfig} />
      ) : null}
      <EmployeeIdBadge employeeId={teacher.employeeId} />
    </PersonDetailHeroCard>
  );
}

/** Backward-compatible aliases for existing consumers. */
export type FacultyDetailHeroProps = FacultyDetailHeroCardProps;
export const FacultyDetailHero = FacultyDetailHeroCard;

export type TeacherDetailHeroProps = FacultyDetailHeroCardProps;
export const TeacherDetailHero = FacultyDetailHeroCard;
