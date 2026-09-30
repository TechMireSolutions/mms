import React from "react";
import { StatusBadge, type StatusBadgeConfigItem } from "@/components/ui/StatusBadge";
import { PersonDetailHeroCard } from "@/components/ui/PersonDetailHeroCard";
import { EmployeeIdBadge } from "@/tenant/features/faculty/components/EmployeeIdBadge";
import { getGenderCardAccent } from "@/lib/genderUi";
import { resolveFacultyStatus, type Faculty } from "@mms/shared";

export interface FacultyDetailHeroCardProps {
  faculty: Faculty;
  displayName: string;
  avatar?: string | null;
  statusConfig: Record<string, StatusBadgeConfigItem>;
  showStatus: boolean;
}

export function FacultyDetailHeroCard({
  faculty,
  displayName,
  avatar,
  statusConfig,
  showStatus,
}: FacultyDetailHeroCardProps): React.JSX.Element {
  return (
    <PersonDetailHeroCard
      id={String(faculty.id)}
      displayName={displayName}
      avatar={avatar}
      gender={faculty.gender}
      accentColor={getGenderCardAccent(faculty.gender)}
    >
      {showStatus ? (
        <StatusBadge status={resolveFacultyStatus(faculty.status)} config={statusConfig} />
      ) : null}
      <EmployeeIdBadge employeeId={faculty.employeeId} />
    </PersonDetailHeroCard>
  );
}

/** Backward-compatible aliases for existing consumers. */
export type FacultyDetailHeroProps = FacultyDetailHeroCardProps;
export const FacultyDetailHero = FacultyDetailHeroCard;

